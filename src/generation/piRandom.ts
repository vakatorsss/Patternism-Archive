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
