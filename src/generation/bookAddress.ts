export interface BookAddress {
  series: number;
  volume: number;
  chapter: number;
  page: number;
  line: number;
}

export const LINES_PER_PAGE = 256;

const CHAPTER_SPAN = 4096n;
const VOLUME_SPAN = CHAPTER_SPAN * 512n;
const SERIES_SPAN = VOLUME_SPAN * 512n;

export const DEFAULT_ADDRESS: BookAddress = {
  series: 1,
  volume: 1,
  chapter: 1,
  page: 1,
  line: 1,
};

const ADDRESS_PATTERN = /^S(\d+)V(\d+)C(\d+)P(\d+)(?:L(\d+))?$/i;
const LEGACY_ADDRESS_PATTERN = /^V(\d+)C(\d+)P(\d+)(?:L(\d+))?$/i;

function clampMinimum(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export function sanitizeAddress(address: Partial<BookAddress>): BookAddress {
  return {
    series: clampMinimum(address.series ?? DEFAULT_ADDRESS.series),
    volume: clampMinimum(address.volume ?? DEFAULT_ADDRESS.volume),
    chapter: clampMinimum(address.chapter ?? DEFAULT_ADDRESS.chapter),
    page: clampMinimum(address.page ?? DEFAULT_ADDRESS.page),
    line: Math.min(LINES_PER_PAGE, clampMinimum(address.line ?? DEFAULT_ADDRESS.line)),
  };
}

export function formatAddress(address: BookAddress) {
  const safe = sanitizeAddress(address);
  return `S${safe.series}V${safe.volume}C${safe.chapter}P${safe.page}L${safe.line}`;
}

export function formatPageAddress(address: BookAddress) {
  const safe = pageAddress(address);
  return `S${safe.series}V${safe.volume}C${safe.chapter}P${safe.page}`;
}

export function parseAddress(rawValue: string): BookAddress | null {
  const normalized = rawValue.trim();

  const modernMatch = ADDRESS_PATTERN.exec(normalized);
  if (modernMatch) {
    const [, series, volume, chapter, page, line] = modernMatch;
    return sanitizeAddress({
      series: Number(series),
      volume: Number(volume),
      chapter: Number(chapter),
      page: Number(page),
      line: line ? Number(line) : 1,
    });
  }

  const legacyMatch = LEGACY_ADDRESS_PATTERN.exec(normalized);
  if (legacyMatch) {
    const [, volume, chapter, page, line] = legacyMatch;
    return sanitizeAddress({
      series: 1,
      volume: Number(volume),
      chapter: Number(chapter),
      page: Number(page),
      line: line ? Number(line) : 1,
    });
  }

  return null;
}

export function pageAddress(address: BookAddress): BookAddress {
  return { ...sanitizeAddress(address), line: 1 };
}

export function shiftAddress(address: BookAddress, lineOffset: number): BookAddress {
  const safe = sanitizeAddress(address);
  const absoluteLine = BigInt((safe.page - 1) * LINES_PER_PAGE + (safe.line - 1)) + BigInt(lineOffset);
  const normalized = absoluteLine < 0n ? 0n : absoluteLine;

  return {
    ...safe,
    page: Number(normalized / BigInt(LINES_PER_PAGE)) + 1,
    line: Number(normalized % BigInt(LINES_PER_PAGE)) + 1,
  };
}

export function getGlobalLineSeed(address: BookAddress) {
  const safe = sanitizeAddress(address);
  const pageOffset = BigInt((safe.page - 1) * LINES_PER_PAGE + (safe.line - 1));

  return (
    BigInt(safe.series - 1) * SERIES_SPAN +
    BigInt(safe.volume - 1) * VOLUME_SPAN +
    BigInt(safe.chapter - 1) * CHAPTER_SPAN +
    pageOffset
  );
}

export function addressFromHash(hash: bigint): BookAddress {
  const value = hash < 0n ? -hash : hash;

  return {
    series: Number((value % 144n) + 1n),
    volume: Number((value / 144n % 144n) + 1n),
    chapter: Number((value / 20736n % 72n) + 1n),
    page: Number((value / 1492992n % 999999n) + 1n),
    line: Number((value / 1492980507008n % BigInt(LINES_PER_PAGE)) + 1n),
  };
}