export interface RuntimeLexiconPayload {
  english: string[];
  latin: string[];
}

type LexiconEntry = string | { value?: string };

const FALLBACK_LEXICON: RuntimeLexiconPayload = {
  english: [
    "archive",
    "reader",
    "witness",
    "signal",
    "noise",
    "pattern",
    "threshold",
    "sequence",
    "silence",
    "recursion",
    "page",
    "index",
  ],
  latin: [
    "liber",
    "index",
    "ratio",
    "signum",
    "silentium",
    "structura",
    "verbum",
    "via",
  ],
};

let lexiconEntries = normalizeLexicon(FALLBACK_LEXICON);
let lexiconVersion = 0;
let loadPromise: Promise<number> | null = null;

function coerceLexiconEntry(value: LexiconEntry) {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  if (value && typeof value === "object" && typeof value.value === "string") {
    return value.value.trim().toLowerCase();
  }

  return "";
}

function normalizeBucket(values: LexiconEntry[]) {
  return values
    .map(coerceLexiconEntry)
    .filter((value) => /^[a-z]+$/.test(value));
}

function normalizeLexicon(payload: RuntimeLexiconPayload) {
  return [...new Set([...normalizeBucket(payload.english), ...normalizeBucket(payload.latin)])];
}

function isRuntimeLexiconPayload(value: unknown): value is RuntimeLexiconPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<RuntimeLexiconPayload>;
  return Array.isArray(payload.english) && Array.isArray(payload.latin);
}

export function getRuntimeLexiconEntries() {
  return lexiconEntries;
}

export function getRuntimeLexiconVersion() {
  return lexiconVersion;
}

export async function loadRuntimeLexicon() {
  if (typeof window === "undefined") {
    return lexiconVersion;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = fetch(`${import.meta.env.BASE_URL}db/example-lexicon.json`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Lexicon request failed with ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!isRuntimeLexiconPayload(payload)) {
        throw new Error("Lexicon payload shape is invalid.");
      }

      const nextEntries = normalizeLexicon(payload);
      if (nextEntries.length > 0) {
        lexiconEntries = nextEntries;
        lexiconVersion += 1;
      }

      return lexiconVersion;
    })
    .catch(() => lexiconVersion);

  return loadPromise;
}
