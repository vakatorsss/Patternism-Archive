import { getPiChunkValues } from "./piSource";

const BASE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export interface CharacterSuperposition {
  candidates: string[];
  rawValues: number[];
  silenceWeight: number;
  fragmentWeight: number;
}

function shiftGuideCharacter(guideCharacter: string, rawValue: number) {
  const alphabetIndex = BASE_ALPHABET.indexOf(guideCharacter);
  if (alphabetIndex === -1) {
    return "";
  }

  const delta = rawValue % 2 === 0 ? 1 : -1;
  return BASE_ALPHABET[(alphabetIndex + delta + BASE_ALPHABET.length) % BASE_ALPHABET.length];
}

function deduplicate(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function buildCharacterSuperposition(
  lineSeed: bigint,
  position: number,
  guideCharacter: string,
): CharacterSuperposition {
  const baseIndex = lineSeed * 97n + BigInt(position * 13 + 1);
  const rawValues = getPiChunkValues(baseIndex, 3, 2);
  const baseCandidates = rawValues.map((value) => BASE_ALPHABET[value % BASE_ALPHABET.length]);
  const guideVariant = guideCharacter === " " ? "" : shiftGuideCharacter(guideCharacter, rawValues[1]);
  const candidates = deduplicate([
    ...baseCandidates,
    guideCharacter === " " ? "" : guideCharacter,
    guideVariant,
  ]);

  return {
    candidates,
    rawValues,
    silenceWeight: (rawValues[0] + rawValues[1]) % 10,
    fragmentWeight: (rawValues[1] + rawValues[2] + position) % 12,
  };
}
