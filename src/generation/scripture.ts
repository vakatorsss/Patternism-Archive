import { TRUTH_STATE_THRESHOLD } from "../data/primeStatements";
import {
  type BookAddress,
  DEFAULT_ADDRESS,
  LINES_PER_PAGE,
  formatAddress,
  getGlobalLineSeed,
  pageAddress,
  shiftAddress,
} from "./bookAddress";
import { collapseGuideLine } from "./contextScorer";
import { getPiChunkValue } from "./piSource";
import { piRandomForVolume } from "./piRandom";
import { getRuntimeLexiconEntries, getRuntimeLexiconVersion } from "./runtimeLexicon";

export interface GeneratedLine {
  address: BookAddress;
  addressLabel: string;
  text: string;
  truthIndex: number;
  truthBand: string;
  guideText: string;
  characterStates: string[][];
}

const SUBJECTS = [
  "observer",
  "reader",
  "witness",
  "signal",
  "archive",
  "sequence",
  "remainder",
  "pattern",
  "page",
  "index",
  "silence",
];

const OBJECTS = [
  "NaN",
  "threshold",
  "sequence",
  "archive",
  "remainder",
  "index",
  "noise",
  "margin",
  "recursion",
  "coordinates",
  "silence",
];

const MODIFIERS = [
  "rain",
  "entropy",
  "memory",
  "static",
  "distance",
  "glass",
  "sleep",
  "ash",
  "probability",
  "recursion",
];

const MOTIONS = [
  "returned",
  "waited",
  "aligned",
  "recurred",
  "translated",
  "drifted",
  "settled",
  "echoed",
  "opened",
  "listened",
];

const PAST_STATES = [
  "written",
  "resolved",
  "completed",
  "named",
  "translated",
  "closed",
  "measured",
];

const SETTLED_STATES = [
  "less random",
  "pattern-bearing",
  "briefly convergent",
  "almost readable",
  "still unfinished",
  "near silence",
];

const ORDINALS = [
  "first",
  "third",
  "ninth",
  "tenth",
  "thirteenth",
  "twenty-eighth",
];

const PLURAL_FORMS = [
  "indices",
  "margins",
  "coordinates",
  "remainders",
  "thresholds",
  "archives",
  "pages",
  "witnesses",
];

const SECONDARY_OBJECTS = [
  "signal",
  "silence",
  "threshold",
  "noise",
  "remainder",
  "archive",
];

function withIndefiniteArticle(value: string) {
  return `${/^[aeiou]/i.test(value) ? "an" : "a"} ${value}`;
}

const TEMPLATES = [
  (parts: GuideParts) => `the ${parts.subject} returned to the same ${parts.object}`,
  (parts: GuideParts) => `beneath the ${parts.object} of ${parts.modifier} ${withIndefiniteArticle(parts.subject)} ${parts.motion}`,
  (parts: GuideParts) => `nothing was ${parts.pastState} but the ${parts.subject} continued`,
  (parts: GuideParts) => `the ${parts.ordinal} ${parts.object} opened and the word became ${parts.settledState}`,
  (parts: GuideParts) => `within the ${parts.object} ${withIndefiniteArticle(parts.subject)} waited without author`,
  (parts: GuideParts) => `between ${parts.pluralLeft} and ${parts.pluralRight} the ${parts.subject} remained ${parts.settledState}`,
  (parts: GuideParts) => `across the ${parts.object} the ${parts.subject} listened for ${parts.secondaryObject}`,
  (parts: GuideParts) => `the ${parts.subject} found the ${parts.object} arranged beneath ${parts.modifier}`,
];

interface GuideParts {
  subject: string;
  object: string;
  modifier: string;
  motion: string;
  pastState: string;
  settledState: string;
  ordinal: string;
  pluralLeft: string;
  pluralRight: string;
  secondaryObject: string;
}

function buildGuideParts(address: BookAddress) {
  const rng = piRandomForVolume(getGlobalLineSeed(address) * 17n + 5n, address.volume);

  return {
    subject: rng.pick(SUBJECTS),
    object: rng.pick(OBJECTS),
    modifier: rng.pick(MODIFIERS),
    motion: rng.pick(MOTIONS),
    pastState: rng.pick(PAST_STATES),
    settledState: rng.pick(SETTLED_STATES),
    ordinal: rng.pick(ORDINALS),
    pluralLeft: rng.pick(PLURAL_FORMS),
    pluralRight: rng.pick(PLURAL_FORMS),
    secondaryObject: rng.pick(SECONDARY_OBJECTS),
  };
}

export function buildGuideLine(address: BookAddress) {
  const rng = piRandomForVolume(getGlobalLineSeed(address) * 29n + 13n, address.volume);
  const template = rng.pick(TEMPLATES);
  const guideLine = template(buildGuideParts(address));

  return guideLine.replace(/\s+/g, " ").trim();
}

export function classifyTruthIndex(value: number) {
  return value < TRUTH_STATE_THRESHOLD ? "false" : "true";
}

export function isFalseTruthIndex(value: number) {
  return value < TRUTH_STATE_THRESHOLD;
}

function normalizeTruthIndex(rawTotal: number) {
  return Number((rawTotal % 10000) / 100);
}

function mixLineSeed(seed: bigint, address: BookAddress) {
  const line = BigInt(address.line);
  const page = BigInt(address.page);
  const chapter = BigInt(address.chapter);

  return seed * 4099n + line * line * 131n + page * 17n + chapter * 7n + 97n;
}

const PRINTABLE_ASCII_START = 32;
const PRINTABLE_ASCII_SPAN = 95;
const LOWER_ASCII_START = 97;
const LOWER_ASCII_SPAN = 26;
// ~0.8% of lines become full raw pi-ASCII
const FULL_LINE_CHAOS_PER_THOUSAND = 8;
// ~20% of words are pi-character words instead of pool words
const PI_CHAR_WORD_PER_THOUSAND = 45;
// ~12% of words get a symbol decoration
const SYMBOL_DECORATION_PER_THOUSAND = 28;
const SYMBOL_CHARS = ".-_~^*:!?#@%" as const;
const PI_LINE_MIN_WORDS = 4;
const PI_LINE_MAX_WORDS = 16;
const PI_CHAR_WORD_MIN_LEN = 5;
const PI_CHAR_WORD_MAX_LEN = 9;
const COMMON_WORD_MAX_LENGTH = 14;
const LONG_WORD_WEIGHT_SCALE = 1024;
const SHORT_WORD_WEIGHT_SCALE = 10;
const PREFERRED_WORD_PICK_PER_THOUSAND = 760;

interface SeriesGenerationProfile {
  lexicalCoherencePerThousand: number;
  symbolDecorationPerThousand: number;
  fullLineChaosPerThousand: number;
  piCharWordPerThousand: number;
  minWordsPerLine: number;
  maxWordsPerLine: number;
  repetitionWindow: number;
  repetitionRetries: number;
}

const seriesProfileCache = new Map<number, SeriesGenerationProfile>();

function deriveSeriesProfile(series: number): SeriesGenerationProfile {
  const safeSeries = Number.isFinite(series) ? Math.max(1, Math.floor(series)) : 1;
  const base = BigInt(safeSeries) * 1009n + 37n;

  const lexicalCoherencePerThousand = 540 + (getPiChunkValue(base + 1n, 3, 11n) % 401);
  const symbolDecorationPerThousand = 8 + (getPiChunkValue(base + 2n, 2, 17n) % 146);
  const fullLineChaosPerThousand = getPiChunkValue(base + 3n, 2, 23n) % 46;
  const piCharWordPerThousand = 18 + (getPiChunkValue(base + 4n, 3, 29n) % 240);
  const minWordsPerLine = 4 + (getPiChunkValue(base + 5n, 1, 31n) % 5);
  const wordSpan = 5 + (getPiChunkValue(base + 6n, 2, 41n) % 12);
  const maxWordsPerLine = Math.min(24, minWordsPerLine + wordSpan);
  const repetitionWindow = 1 + (getPiChunkValue(base + 7n, 1, 43n) % 6);
  const repetitionRetries = 1 + (getPiChunkValue(base + 8n, 1, 47n) % 4);

  return {
    lexicalCoherencePerThousand,
    symbolDecorationPerThousand,
    fullLineChaosPerThousand,
    piCharWordPerThousand,
    minWordsPerLine,
    maxWordsPerLine,
    repetitionWindow,
    repetitionRetries,
  };
}

function getSeriesProfile(series: number) {
  const safeSeries = Number.isFinite(series) ? Math.max(1, Math.floor(series)) : 1;
  const cached = seriesProfileCache.get(safeSeries);
  if (cached) {
    return cached;
  }

  const derived = deriveSeriesProfile(safeSeries);
  seriesProfileCache.set(safeSeries, derived);
  return derived;
}

interface ChapterWordBias {
  favoredWords: Set<string>;
  favoredWordPickPerThousand: number;
  bucketCache: Map<string, string[]>;
}

const chapterBiasCache = new Map<string, ChapterWordBias>();

function getChapterWordBias(chapter: number): ChapterWordBias {
  const safeChapter = Number.isFinite(chapter) ? Math.max(1, Math.floor(chapter)) : 1;
  const entries = getRuntimeLexiconEntries();
  const version = getRuntimeLexiconVersion();
  const key = `${safeChapter}:${version}:${entries.length}`;
  const cached = chapterBiasCache.get(key);
  if (cached) {
    return cached;
  }

  const sorted = [...entries].sort((left, right) => stableWordSortValue(left) - stableWordSortValue(right) || left.localeCompare(right));
  if (sorted.length === 0) {
    const emptyBias = {
      favoredWords: new Set<string>(),
      favoredWordPickPerThousand: 0,
      bucketCache: new Map<string, string[]>(),
    };
    chapterBiasCache.set(key, emptyBias);
    return emptyBias;
  }

  const base = BigInt(safeChapter) * 1013n + 89n;
  const favoredCount = Math.min(sorted.length, 12 + (getPiChunkValue(base + 1n, 2, 13n) % 61));
  const favoredWordPickPerThousand = 120 + (getPiChunkValue(base + 2n, 3, 29n) % 560);
  const start = getPiChunkValue(base + 3n, 3, 31n) % sorted.length;
  const step = 1 + (getPiChunkValue(base + 4n, 2, 37n) % Math.max(1, sorted.length - 1));

  const favoredWords = new Set<string>();
  let cursor = start;
  let attempts = 0;
  const maxAttempts = Math.max(sorted.length * 3, favoredCount * 6);

  while (favoredWords.size < favoredCount && attempts < maxAttempts) {
    favoredWords.add(sorted[cursor]);
    cursor = (cursor + step) % sorted.length;
    attempts += 1;
  }

  const derived = {
    favoredWords,
    favoredWordPickPerThousand,
    bucketCache: new Map<string, string[]>(),
  };

  chapterBiasCache.set(key, derived);

  if (chapterBiasCache.size > 128) {
    const oldestKey = chapterBiasCache.keys().next().value;
    if (typeof oldestKey === "string") {
      chapterBiasCache.delete(oldestKey);
    }
  }

  return derived;
}interface WeightedLexiconBucket {
  length: number;
  words: string[];
  preferredWords: string[];
  cumulativeWeight: number;
}

const PAGE_CACHE_LIMIT = 24;

interface CachedPage {
  version: number;
  lines: GeneratedLine[];
}

const pageCache = new Map<string, CachedPage>();

let weightedLexiconCache:
  | {
      version: number;
      bucketCount: number;
      totalWeight: number;
      buckets: WeightedLexiconBucket[];
    }
  | null = null;

function getLengthWeight(length: number) {
  if (length <= 2) {
    return Math.floor(LONG_WORD_WEIGHT_SCALE / 64);
  }

  if (length === 3) {
    return Math.floor(LONG_WORD_WEIGHT_SCALE / 24);
  }

  if (length === 4) {
    return Math.floor(LONG_WORD_WEIGHT_SCALE / 12);
  }

  if (length <= COMMON_WORD_MAX_LENGTH) {
    return LONG_WORD_WEIGHT_SCALE;
  }

  return Math.max(
    1,
    Math.floor(LONG_WORD_WEIGHT_SCALE / (1 + Math.log2(length - COMMON_WORD_MAX_LENGTH + 1))),
  );
}

const COMMON_BIGRAMS = [
  "th",
  "he",
  "in",
  "er",
  "an",
  "re",
  "on",
  "at",
  "en",
  "nd",
  "ti",
  "es",
  "or",
  "te",
  "of",
  "ed",
  "is",
  "it",
  "al",
  "ar",
];

function getBigramScore(word: string) {
  let score = 0;
  for (let index = 0; index < word.length - 1; index += 1) {
    const bigram = word.slice(index, index + 2);
    if (COMMON_BIGRAMS.includes(bigram)) {
      score += 1;
    }
  }

  return score;
}

function isPreferredWord(word: string) {
  if (word.length < 4 || word.length > 11) {
    return false;
  }

  if (!/[aeiou]/.test(word)) {
    return false;
  }

  if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(word)) {
    return false;
  }

  return getBigramScore(word) >= 1;
}

function stableWordSortValue(word: string) {
  let hash = 2166136261;

  for (let index = 0; index < word.length; index += 1) {
    hash ^= word.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getWeightedLexiconBuckets() {
  const entries = getRuntimeLexiconEntries();
  const version = getRuntimeLexiconVersion();

  if (
    weightedLexiconCache &&
    weightedLexiconCache.version === version &&
    weightedLexiconCache.bucketCount === entries.length
  ) {
    return weightedLexiconCache;
  }

  const wordsByLength = new Map<number, string[]>();

  for (const entry of entries) {
    const length = entry.length;
    const bucket = wordsByLength.get(length);
    if (bucket) {
      bucket.push(entry);
    } else {
      wordsByLength.set(length, [entry]);
    }
  }

  let cumulativeWeight = 0;
  const buckets = [...wordsByLength.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([length, words]) => {
      cumulativeWeight += getLengthWeight(length);
      const sortedWords = [...words].sort((left, right) => stableWordSortValue(left) - stableWordSortValue(right) || left.localeCompare(right));
      const preferredWords = sortedWords.filter(isPreferredWord);

      return {
        length,
        words: sortedWords,
        preferredWords,
        cumulativeWeight,
      } satisfies WeightedLexiconBucket;
    });

  weightedLexiconCache = {
    version,
    bucketCount: entries.length,
    totalWeight: cumulativeWeight,
    buckets,
  };

  return weightedLexiconCache;
}

function pickLexiconWord(
  rng: ReturnType<typeof piRandomForVolume>,
  lexicalCoherencePerThousand = PREFERRED_WORD_PICK_PER_THOUSAND,
  chapterBias?: ChapterWordBias,
) {
  const weightedLexicon = getWeightedLexiconBuckets();
  if (weightedLexicon.totalWeight <= 0 || weightedLexicon.buckets.length === 0) {
    return "archive";
  }

  const targetWeight = rng.next(weightedLexicon.totalWeight);
  const selectedBucket =
    weightedLexicon.buckets.find((bucket) => targetWeight < bucket.cumulativeWeight) ??
    weightedLexicon.buckets[weightedLexicon.buckets.length - 1];

  const usePreferred =
    selectedBucket.preferredWords.length > 0 && rng.chance(lexicalCoherencePerThousand);
  const sourceWords = usePreferred ? selectedBucket.preferredWords : selectedBucket.words;

  if (chapterBias && chapterBias.favoredWords.size > 0 && rng.chance(chapterBias.favoredWordPickPerThousand)) {
    const cacheKey = `${selectedBucket.length}:${usePreferred ? 1 : 0}`;
    let favoredPool = chapterBias.bucketCache.get(cacheKey);

    if (!favoredPool) {
      favoredPool = sourceWords.filter((word) => chapterBias.favoredWords.has(word));
      chapterBias.bucketCache.set(cacheKey, favoredPool);
    }

    if (favoredPool.length > 0) {
      return rng.pick(favoredPool);
    }
  }

  return rng.pick(sourceWords);
}
/** Generates a word made of pi-driven lowercase letters. */
function piCharWord(rng: ReturnType<typeof piRandomForVolume>): string {
  const length = rng.range(PI_CHAR_WORD_MIN_LEN, PI_CHAR_WORD_MAX_LEN);
  let word = "";
  for (let i = 0; i < length; i += 1) {
    word += String.fromCharCode(LOWER_ASCII_START + rng.next(LOWER_ASCII_SPAN));
  }
  return word;
}

/** Generates a line as a pi-driven sequence of words. */
function buildPiLine(lineSeed: bigint, address: BookAddress, profile: SeriesGenerationProfile, chapterBias: ChapterWordBias): string {
  const rng = piRandomForVolume(lineSeed * 61n + 3n, address.volume);
  const wordCount = rng.range(profile.minWordsPerLine, profile.maxWordsPerLine);
  const words: string[] = [];

  for (let w = 0; w < wordCount; w += 1) {
    let word = "";

    // Retry a few times to avoid tight local repetition when series profile asks for it.
    for (let attempt = 0; attempt <= profile.repetitionRetries; attempt += 1) {
      const candidate = rng.chance(profile.piCharWordPerThousand)
        ? piCharWord(rng)
        : pickLexiconWord(rng, profile.lexicalCoherencePerThousand, chapterBias);

      const recentWindow = Math.max(0, words.length - profile.repetitionWindow);
      const repeatsRecent = words.slice(recentWindow).includes(candidate);

      word = candidate;
      if (!repeatsRecent || attempt >= profile.repetitionRetries) {
        break;
      }
    }

    if (rng.chance(profile.symbolDecorationPerThousand)) {
      const sym = SYMBOL_CHARS[rng.next(SYMBOL_CHARS.length)];
      const pos = rng.next(3);
      if (pos === 0) word = sym + word;
      else if (pos === 1) word = word + sym;
      else word = word.slice(0, Math.floor(word.length / 2)) + sym + word.slice(Math.floor(word.length / 2));
    }

    words.push(word);
  }

  return words.join(" ");
}

/** Generates a full line of raw printable ASCII from pi (rare chaos mode). */
function toPiAsciiLine(lineSeed: bigint, volume: number): string {
  const rng = piRandomForVolume(lineSeed * 53n + 17n, volume);
  const length = rng.range(48, 80);
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += String.fromCharCode(PRINTABLE_ASCII_START + rng.next(PRINTABLE_ASCII_SPAN));
  }
  return output;
}

export function generateLine(address: BookAddress): GeneratedLine {
  const guideText = buildGuideLine(address);
  const baseSeed = getGlobalLineSeed(address);
  const lineSeed = mixLineSeed(baseSeed, address);
  const collapsed = collapseGuideLine(guideText, lineSeed);
  const truthIndex = normalizeTruthIndex(collapsed.rawTotal);

  // Use a separate rng seeded from lineSeed to decide line mode
    const profile = getSeriesProfile(address.series);
  const chapterBias = getChapterWordBias(address.chapter);
  const modeRng = piRandomForVolume(lineSeed * 47n + 5n, address.volume);
  const lineText = modeRng.chance(profile.fullLineChaosPerThousand)
    ? toPiAsciiLine(lineSeed, address.volume)
    : buildPiLine(lineSeed, address, profile, chapterBias);

  return {
    address,
    addressLabel: formatAddress(address),
    text: lineText,
    truthIndex,
    truthBand: classifyTruthIndex(truthIndex),
    guideText,
    characterStates: collapsed.steps.map((step) => step.candidates),
  };
}

export function generatePage(address: BookAddress = DEFAULT_ADDRESS) {
  const start = pageAddress(address);
  const cacheKey = formatAddress(start);
  const version = getRuntimeLexiconVersion();
  const cached = pageCache.get(cacheKey);

  if (cached && cached.version === version) {
    return cached.lines;
  }

  const lines = Array.from({ length: LINES_PER_PAGE }, (_, index) =>
    generateLine({ ...start, line: index + 1 }),
  );

  pageCache.set(cacheKey, {
    version,
    lines,
  });

  if (pageCache.size > PAGE_CACHE_LIMIT) {
    const oldestKey = pageCache.keys().next().value;
    if (typeof oldestKey === "string") {
      pageCache.delete(oldestKey);
    }
  }

  return lines;
}
export function generatePassage(address: BookAddress, radius = 1) {
  const lines: GeneratedLine[] = [];

  for (let offset = -radius; offset <= radius; offset += 1) {
    const lineAddress = shiftAddress(address, offset);
    lines.push(generateLine(lineAddress));
  }

  return lines;
}

export function interpretPassage(lines: GeneratedLine[]) {
  const averageTruth = lines.reduce((total, line) => total + line.truthIndex, 0) / Math.max(lines.length, 1);

  if (averageTruth < TRUTH_STATE_THRESHOLD) {
    return "The archive returns a fractured alignment. The question was received, but the signal remains below the sacred threshold.";
  }

  if (averageTruth < 60) {
    return "The passage is pattern-bearing but unsettled. Read it as a direction of pressure rather than a command.";
  }

  if (averageTruth < 80) {
    return "The passage holds a stable signal. Patternism would treat this as a readable convergence, not an absolute decree.";
  }

  return "The archive is highly convergent at this coordinate. The question and the page are briefly aligned.";
}









