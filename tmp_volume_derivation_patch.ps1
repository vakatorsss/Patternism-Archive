$ErrorActionPreference = 'Stop'

$root = "C:\Users\viktor\OneDrive\Projects\P2\The Infinite Text"
$piRandomPath = Join-Path $root "src\generation\piRandom.ts"
$scripturePath = Join-Path $root "src\generation\scripture.ts"

$piRandomContent = @'
/**
 * Deterministic PRNG backed entirely by pi digits.
 * Never uses Math.random(). All output is a pure function of the seed.
 */
import { getPiChunkValue } from "./piSource";

interface PiDerivationStrategy {
  transform(seed: bigint, counter: bigint): bigint;
  salt(seed: bigint, counter: bigint): bigint;
  widthBias: number;
}

const DERIVATION_STRATEGIES: PiDerivationStrategy[] = [
  {
    transform: (seed, counter) => seed + counter * 17n + 1n,
    salt: (seed, counter) => (seed % 97n) + counter * 13n + 7n,
    widthBias: 0,
  },
  {
    transform: (seed, counter) => (seed ^ (counter * 29n + 11n)) + 3n,
    salt: (seed, counter) => (seed % 131n) + counter * 17n + 11n,
    widthBias: 1,
  },
  {
    transform: (seed, counter) => seed + (counter * counter + 1n) * 31n + 5n,
    salt: (seed, counter) => (seed % 193n) + counter * 19n + 13n,
    widthBias: 0,
  },
  {
    transform: (seed, counter) => (seed + 7n) * (counter + 1n) + 19n,
    salt: (seed, counter) => (seed % 257n) + counter * 23n + 17n,
    widthBias: 1,
  },
  {
    transform: (seed, counter) => seed + (counter + 1n) * (counter + 2n) * 13n + 23n,
    salt: (seed, counter) => (seed % 389n) + counter * 29n + 19n,
    widthBias: 0,
  },
];

function normalizeDerivationIndex(volume: number) {
  const integerVolume = Number.isFinite(volume) ? Math.floor(volume) : 1;
  return ((integerVolume - 1) % DERIVATION_STRATEGIES.length + DERIVATION_STRATEGIES.length) % DERIVATION_STRATEGIES.length;
}

export class PiRandom {
  private counter = 0;

  constructor(
    private readonly seed: bigint,
    private readonly derivation: PiDerivationStrategy = DERIVATION_STRATEGIES[0],
  ) {}

  /** Returns an integer in [0, max). */
  next(max: number, width = 3): number {
    const counter = BigInt(this.counter);
    this.counter += 1;
    const transformedSeed = this.derivation.transform(this.seed, counter);
    const salt = this.derivation.salt(this.seed, counter);
    const effectiveWidth = Math.max(1, width + this.derivation.widthBias);
    const value = getPiChunkValue(transformedSeed, effectiveWidth, salt);
    return value % max;
  }

  /** Returns true with probability (per1000 / 1000). */
  chance(per1000: number): boolean {
    return this.next(1000) < per1000;
  }

  /** Returns an integer in [min, max] inclusive. */
  range(min: number, max: number): number {
    return min + this.next(max - min + 1);
  }

  /** Picks one element from an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.next(arr.length)];
  }
}

/** Convenience factory - creates a PiRandom seeded from the given bigint. */
export function piRandom(seed: bigint): PiRandom {
  return new PiRandom(seed);
}

/** Creates a PiRandom with a volume-specific pi derivation strategy. */
export function piRandomForVolume(seed: bigint, volume: number): PiRandom {
  return new PiRandom(seed, DERIVATION_STRATEGIES[normalizeDerivationIndex(volume)]);
}
'@

Set-Content -Path $piRandomPath -Value $piRandomContent -Encoding UTF8

$scripture = Get-Content $scripturePath -Raw
$scripture = $scripture.Replace('import { getPiChunkValue } from "./piSource";`r`nimport { piRandom } from "./piRandom";','import { piRandomForVolume } from "./piRandom";')

$oldGuide = @'
function pick<T>(collection: T[], seed: bigint, salt: number) {
  const index = getPiChunkValue(seed + BigInt(salt * 17 + 1), 3, BigInt(salt * 11 + 5));
  return collection[index % collection.length];
}

function buildGuideParts(address: BookAddress): GuideParts {
  const seed = getGlobalLineSeed(address) * 17n + 5n;

  return {
    subject: pick(SUBJECTS, seed, 1),
    object: pick(OBJECTS, seed, 2),
    modifier: pick(MODIFIERS, seed, 3),
    motion: pick(MOTIONS, seed, 4),
    pastState: pick(PAST_STATES, seed, 5),
    settledState: pick(SETTLED_STATES, seed, 6),
    ordinal: pick(ORDINALS, seed, 7),
    pluralLeft: pick(PLURAL_FORMS, seed, 8),
    pluralRight: pick(PLURAL_FORMS, seed, 9),
    secondaryObject: pick(SECONDARY_OBJECTS, seed, 10),
  };
}

export function buildGuideLine(address: BookAddress) {
  const seed = getGlobalLineSeed(address) * 29n + 13n;
  const template = TEMPLATES[getPiChunkValue(seed, 2, 7n) % TEMPLATES.length];
  const guideLine = template(buildGuideParts(address));

  return guideLine.replace(/\s+/g, " ").trim();
}
'@

$newGuide = @'
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
'@

if (-not $scripture.Contains($oldGuide)) { throw 'Old guide block not found'; }
$scripture = $scripture.Replace($oldGuide, $newGuide)

$oldLine = @'
function buildPiLine(lineSeed: bigint): string {
  const rng = piRandom(lineSeed * 61n + 3n);
  const wordCount = rng.range(PI_LINE_MIN_WORDS, PI_LINE_MAX_WORDS);
  const words: string[] = [];

  for (let w = 0; w < wordCount; w += 1) {
    // Decide word type: lexicon word or pi-char word
    let word = rng.chance(PI_CHAR_WORD_PER_THOUSAND)
      ? piCharWord(rng)
      : pickLexiconWord(rng);

    // Occasionally decorate with a single symbol character
    if (rng.chance(SYMBOL_DECORATION_PER_THOUSAND)) {
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
function toPiAsciiLine(lineSeed: bigint): string {
  const rng = piRandom(lineSeed * 53n + 17n);
  const length = rng.range(48, 80);
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += String.fromCharCode(PRINTABLE_ASCII_START + rng.next(PRINTABLE_ASCII_SPAN));
  }
  return output;
}

export function generateLine(address: BookAddress): GeneratedLine {
  const guideText = buildGuideLine(address);
  const lineSeed = getGlobalLineSeed(address);
  const collapsed = collapseGuideLine(guideText, lineSeed);
  const truthIndex = normalizeTruthIndex(collapsed.rawTotal);

  // Use a separate rng seeded from lineSeed to decide line mode
  const modeRng = piRandom(lineSeed * 47n + 5n);
  const lineText = modeRng.chance(FULL_LINE_CHAOS_PER_THOUSAND)
    ? toPiAsciiLine(lineSeed)
    : buildPiLine(lineSeed);
'@

$newLine = @'
function buildPiLine(lineSeed: bigint, volume: number): string {
  const rng = piRandomForVolume(lineSeed * 61n + 3n, volume);
  const wordCount = rng.range(PI_LINE_MIN_WORDS, PI_LINE_MAX_WORDS);
  const words: string[] = [];

  for (let w = 0; w < wordCount; w += 1) {
    // Decide word type: lexicon word or pi-char word
    let word = rng.chance(PI_CHAR_WORD_PER_THOUSAND)
      ? piCharWord(rng)
      : pickLexiconWord(rng);

    // Occasionally decorate with a single symbol character
    if (rng.chance(SYMBOL_DECORATION_PER_THOUSAND)) {
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
  const lineSeed = getGlobalLineSeed(address);
  const collapsed = collapseGuideLine(guideText, lineSeed);
  const truthIndex = normalizeTruthIndex(collapsed.rawTotal);

  // Use a separate rng seeded from lineSeed to decide line mode
  const modeRng = piRandomForVolume(lineSeed * 47n + 5n, address.volume);
  const lineText = modeRng.chance(FULL_LINE_CHAOS_PER_THOUSAND)
    ? toPiAsciiLine(lineSeed, address.volume)
    : buildPiLine(lineSeed, address.volume);
'@

if (-not $scripture.Contains($oldLine)) { throw 'Old line-generation block not found'; }
$scripture = $scripture.Replace($oldLine, $newLine)

$scripture = $scripture.Replace('function piCharWord(rng: ReturnType<typeof piRandom>): string {','function piCharWord(rng: ReturnType<typeof piRandomForVolume>): string {')

Set-Content -Path $scripturePath -Value $scripture -Encoding UTF8
