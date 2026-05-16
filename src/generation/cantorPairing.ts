import { type BookAddress } from "./bookAddress";

/**
 * Cantor pairing function: maps two non-negative integers to a single unique non-negative integer
 * π(k1, k2) = ((k1 + k2) * (k1 + k2 + 1)) / 2 + k2
 */
export function cantorPair(k1: number, k2: number): number {
  const sum = k1 + k2;
  return (sum * (sum + 1)) / 2 + k2;
}

/**
 * Cantor pairing for 5-tuple (series, volume, chapter, page, line)
 * Applies pairing recursively to flatten all dimensions
 */
export function cantorPairingAddress(address: BookAddress): number {
  const { series, volume, chapter, page, line } = address;
  // Apply Cantor pairing recursively
  let paired = cantorPair(series, volume);
  paired = cantorPair(paired, chapter);
  paired = cantorPair(paired, page);
  paired = cantorPair(paired, line);
  return paired;
}

/**
 * Format Cantor pairing number without exponents or comma separators
 */
export function formatCantorPairing(num: number): string {
  return Math.floor(num).toString();
}
