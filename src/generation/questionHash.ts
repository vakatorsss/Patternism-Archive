import { addressFromHash } from "./bookAddress";

const FNV_OFFSET = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;

export function normalizeQuestion(question: string) {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashQuestion(question: string) {
  const normalized = normalizeQuestion(question);
  let hash = FNV_OFFSET;

  for (const character of normalized) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * FNV_PRIME);
  }

  return hash;
}

export function questionToAddress(question: string) {
  return addressFromHash(hashQuestion(question));
}

export function ritualHashSegments(question: string) {
  const hex = hashQuestion(question).toString(16).padStart(16, "0");
  return hex.match(/.{1,4}/g) ?? [hex];
}
