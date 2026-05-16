import { PI_DIGITS } from "../data/piDigits";

const DIGIT_COUNT = BigInt(PI_DIGITS.length);
const PI_API_BASE = "https://api.pi.delivery/v1/pi";
const PI_API_CHUNK_SIZE = 1000n;

const piChunkCache = new Map<string, string>();
const pendingPiChunkLoads = new Set<string>();

function normalizeApiDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toPositiveModulo(value: bigint) {
  return ((value % DIGIT_COUNT) + DIGIT_COUNT) % DIGIT_COUNT;
}

function toChunkStart(index: bigint) {
  const normalized = index < 0n ? -index : index;
  return normalized - (normalized % PI_API_CHUNK_SIZE);
}

function getChunkKey(start: bigint) {
  return start.toString();
}

function getCachedDigit(index: bigint) {
  const chunkStart = toChunkStart(index);
  const key = getChunkKey(chunkStart);
  const chunk = piChunkCache.get(key);

  if (!chunk) {
    return null;
  }

  const offset = Number((index < 0n ? -index : index) - chunkStart);
  if (offset < 0 || offset >= chunk.length) {
    return null;
  }

  const value = Number(chunk[offset]);
  return Number.isFinite(value) ? value : null;
}

function ensurePiChunkLoaded(index: bigint) {
  if (typeof window === "undefined") {
    return;
  }

  const chunkStart = toChunkStart(index);
  const key = getChunkKey(chunkStart);

  if (piChunkCache.has(key) || pendingPiChunkLoads.has(key)) {
    return;
  }

  pendingPiChunkLoads.add(key);
  const params = new URLSearchParams({
    start: key,
    numberOfDigits: PI_API_CHUNK_SIZE.toString(),
    radix: "10",
  });

  fetch(`${PI_API_BASE}?${params.toString()}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Pi API request failed: ${response.status}`);
      }

      const payload = (await response.json()) as { content?: string };
      const digits = normalizeApiDigits(payload.content ?? "");
      if (digits.length > 0) {
        piChunkCache.set(key, digits);
      }
    })
    .catch(() => {
      // Keep deterministic local fallback when API is unavailable.
    })
    .finally(() => {
      pendingPiChunkLoads.delete(key);
    });
}

export function getPiDigit(index: bigint) {
  const cached = getCachedDigit(index);
  if (cached !== null) {
    return cached;
  }

  ensurePiChunkLoaded(index);
  return Number(PI_DIGITS[Number(toPositiveModulo(index))]);
}

export function getPiChunkValue(index: bigint, width = 3, salt = 0n) {
  let digits = "";

  for (let cursor = 0; cursor < width; cursor += 1) {
    const offset = index + salt + BigInt(cursor * cursor + cursor + 1);
    digits += getPiDigit(offset).toString();
  }

  return Number(digits);
}

export function getPiChunkValues(index: bigint, count: number, width = 3) {
  return Array.from({ length: count }, (_, offset) => {
    const salt = BigInt(offset * 11 + 3);
    return getPiChunkValue(index + BigInt(offset * 7 + 1), width, salt);
  });
}
