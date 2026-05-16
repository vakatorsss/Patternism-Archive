import { buildCharacterSuperposition } from "./characterCandidates";
import { getRuntimeLexiconEntries, getRuntimeLexiconVersion } from "./runtimeLexicon";

const BIGRAM_HINTS = new Set([
  "th",
  "he",
  "in",
  "re",
  "er",
  "an",
  "nd",
  "io",
  "ob",
  "si",
  "pa",
  "ar",
  "co",
  "ra",
  "te",
  "se",
  "wi",
]);

const TRIGRAM_HINTS = new Set([
  "the",
  "ion",
  "ing",
  "ter",
  "ent",
  "ree",
  "sig",
  "ise",
  "pat",
  "obs",
  "wit",
  "pag",
  "arc",
]);

const SYNTHETIC_PREFIXES = [
  "arc",
  "aur",
  "clar",
  "con",
  "cor",
  "luc",
  "nov",
  "obs",
  "ord",
  "pat",
  "sig",
  "sil",
  "spir",
  "tem",
  "ver",
];

const SYNTHETIC_SUFFIXES = [
  "a",
  "ae",
  "al",
  "am",
  "an",
  "aris",
  "ent",
  "ia",
  "ic",
  "ion",
  "is",
  "ium",
  "or",
  "ora",
  "um",
  "us",
];

export interface CollapseStep {
  candidates: string[];
  chosen: string;
}

interface LexiconEdgeIndex {
  version: number;
  prefixes: Set<string>;
  words: Set<string>;
}

let lexiconEdgeIndex: LexiconEdgeIndex | null = null;

function getLexiconEdgeIndex() {
  const version = getRuntimeLexiconVersion();
  if (lexiconEdgeIndex && lexiconEdgeIndex.version === version) {
    return lexiconEdgeIndex;
  }

  const prefixes = new Set<string>();
  const words = new Set<string>();

  for (const entry of getRuntimeLexiconEntries()) {
    words.add(entry);

    const prefixLength = Math.min(entry.length, 12);
    for (let length = 1; length <= prefixLength; length += 1) {
      prefixes.add(entry.slice(0, length));
    }
  }

  lexiconEdgeIndex = {
    version,
    prefixes,
    words,
  };

  return lexiconEdgeIndex;
}
function isLetter(value: string) {
  return /^[a-z]$/.test(value);
}

function isVowel(value: string) {
  return /[aeiou]/.test(value);
}

function getRecentWord(leftContext: string, candidate: string) {
  return `${leftContext.split(" ").at(-1) ?? ""}${candidate}`.slice(-12);
}

function matchesLexiconEdge(leftContext: string, candidate: string) {
  const recentWord = getRecentWord(leftContext, candidate);
  if (!recentWord) {
    return false;
  }

  const index = getLexiconEdgeIndex();

  if (index.prefixes.has(recentWord)) {
    return true;
  }

  const suffixLimit = Math.min(recentWord.length, 12);
  for (let length = 1; length <= suffixLimit; length += 1) {
    if (index.words.has(recentWord.slice(-length))) {
      return true;
    }
  }

  return false;
}
function looksPronounceable(fragment: string) {
  if (!/^[a-z]+$/.test(fragment)) {
    return false;
  }

  if (/(.)\1\1/.test(fragment)) {
    return false;
  }

  if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(fragment)) {
    return false;
  }

  return true;
}

function matchesSyntheticEdge(leftContext: string, candidate: string, fragmentWeight: number, position: number, rawValues: number[]) {
  if (!isLetter(candidate)) {
    return false;
  }

  const recentWord = getRecentWord(leftContext, candidate);

  if (recentWord.length < 4 || recentWord.length > 11) {
    return false;
  }

  if (!looksPronounceable(recentWord)) {
    return false;
  }

  const vowelCount = [...recentWord].filter((character) => isVowel(character)).length;
  if (vowelCount === 0) {
    return false;
  }

  const hasKnownShape =
    SYNTHETIC_PREFIXES.some((prefix) => recentWord.startsWith(prefix)) ||
    SYNTHETIC_SUFFIXES.some((suffix) => recentWord.endsWith(suffix));

  if (!hasKnownShape) {
    return false;
  }

  return (fragmentWeight + rawValues[2] + position) % 7 === 0;
}

function scoreCandidate(
  candidate: string,
  leftContext: string,
  guideCharacter: string,
  nextGuideCharacter: string,
  position: number,
  silenceWeight: number,
  fragmentWeight: number,
  rawValues: number[],
) {
  const previousCharacter = leftContext.at(-1) ?? " ";
  const currentWord = leftContext.split(" ").at(-1) ?? "";
  let score = 0;

  if (candidate === guideCharacter) {
    score += 3.6 - fragmentWeight * 0.14;
  }

  if (guideCharacter === " " && candidate === " ") {
    score += 4.2;
  }

  if (candidate === " ") {
    if (currentWord.length >= 4 && currentWord.length <= 9) {
      score += 1.4;
    }

    if (currentWord.length < 3) {
      score -= 2.2;
    }

    score += silenceWeight > 6 ? 0.6 : -0.3;
  } else {
    const pair = `${previousCharacter}${candidate}`;
    const triad = `${leftContext.slice(-2)}${candidate}`;

    if (BIGRAM_HINTS.has(pair)) {
      score += 1.15;
    }

    if (TRIGRAM_HINTS.has(triad)) {
      score += 1.2;
    }

    if (matchesLexiconEdge(leftContext, candidate)) {
      score += 0.95;
    } else if (matchesSyntheticEdge(leftContext, candidate, fragmentWeight, position, rawValues)) {
      score += 0.42;
    }

    if (isLetter(candidate) && guideCharacter !== " " && isLetter(guideCharacter)) {
      if (isVowel(candidate) === isVowel(guideCharacter)) {
        score += 0.35;
      }
    }

    if (/\d/.test(candidate)) {
      score += fragmentWeight > 8 ? 0.25 : -1.35;
    }

    if (candidate === previousCharacter && candidate !== " ") {
      score -= 0.6;
    }

    if (nextGuideCharacter === candidate && candidate !== guideCharacter) {
      score -= 0.2;
    }
  }

  score += rawValues[0] % 5 * 0.03;
  score += (position % 4) * 0.01;

  return score;
}

function stabilizeSpacing(text: string, guideLine: string) {
  const normalized = text.replace(/\s{2,}/g, " ").trim();

  if (normalized.length < Math.round(guideLine.length * 0.72)) {
    return guideLine.trim();
  }

  return normalized;
}

export function collapseGuideLine(guideLine: string, lineSeed: bigint) {
  let output = "";
  let rawTotal = 0;
  const steps: CollapseStep[] = [];

  for (let position = 0; position < guideLine.length; position += 1) {
    const guideCharacter = guideLine[position] ?? " ";
    const nextGuideCharacter = guideLine[position + 1] ?? " ";
    const superposition = buildCharacterSuperposition(lineSeed, position, guideCharacter);
    const pool = [...superposition.candidates];

    rawTotal += superposition.rawValues.reduce((total, value) => total + value, 0);

    if (guideCharacter === " " || superposition.silenceWeight > 6) {
      pool.push(" ");
    }

    const uniquePool = [...new Set(pool)];
    const chosen = [...uniquePool]
      .map((candidate) => ({
        candidate,
        score: scoreCandidate(
          candidate,
          output,
          guideCharacter,
          nextGuideCharacter,
          position,
          superposition.silenceWeight,
          superposition.fragmentWeight,
          superposition.rawValues,
        ),
      }))
      .sort((left, right) => right.score - left.score || left.candidate.localeCompare(right.candidate))[0]?.candidate ?? guideCharacter;

    output += chosen;
    steps.push({
      candidates: uniquePool,
      chosen,
    });
  }

  return {
    text: stabilizeSpacing(output, guideLine),
    steps,
    rawTotal,
  };
}
