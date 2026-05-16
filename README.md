# The Patternism Archive

The Patternism Archive is a responsive React + TypeScript + Tailwind frontend for a fictional philosophical religion called Patternism. The interface treats the site like a sacred digital archive split into distinct routes: a homepage, a rules page, a finder page, and a main text page whose page address is embedded in the URL.

## Experience Direction

- Serious, poetic, archival, technological, and slightly unsettling.
- Mobile-first layout with large tap targets and readable line wrapping.
- Dark brutalist surface language: thin borders, restrained glow, monospaced coordinates, and serif narrative copy.
- Deterministic address format: `V{number}C{number}P{number}L{number}`.

## Route Structure

- `/`: homepage and archive entry points.
- `/rules`: doctrine, threshold, philosophy, and interpretation rules.
- `/finder`: question hashing surface that emits a routed text page target.
- `/text/S{series}V{volume}C{chapter}P{page}`: main reading surface with the page address carried in the link.

## Frontend Architecture

```txt
src/
  components/
    AskTheBook.tsx
    BookReader.tsx
    PhilosophyPage.tsx
    ProbabilityVisualizer.tsx
    RitualReveal.tsx
  data/
    piDigits.ts
    primeStatements.ts
  generation/
    bookAddress.ts
    characterCandidates.ts
    contextScorer.ts
    piSource.ts
    questionHash.ts
    scripture.ts
  App.tsx
  index.css
  lib/
    routes.ts
  main.tsx
  pages/
    FinderPage.tsx
    HomePage.tsx
    RulesPage.tsx
    TextPage.tsx
```

### Component responsibilities

- `BookReader`: address controls, deterministic page browsing, Truth Index rows, and line-level reveal actions.
- `AskTheBook`: deterministic question hashing, coordinate reveal, and links into the routed text page.
- `RitualReveal`: character-by-character ritual playback with pause, skip, and copy actions.
- `PhilosophyPage`: Patternism doctrine, threshold explanation, and interpretation rules.
- `ProbabilityVisualizer`: static ruled archive field and symbolic geometry that frame the page without cinematic motion.

### Page responsibilities

- `HomePage`: archive entry summary and links into rules, finder, and the default text page.
- `RulesPage`: Patternism doctrine, threshold reference, truth bands, and interpretation notes.
- `FinderPage`: question-to-address flow that opens the dedicated text route.
- `TextPage`: main reading surface, URL-backed page selection, and ritual playback for the current routed page.

### Generation responsibilities

- `bookAddress.ts`: stable addressing, paging, line shifting, and global line seed derivation.
- `questionHash.ts`: FNV-1a hashing from question text into deterministic archive coordinates.
- `piSource.ts`: pi-digit chunk extraction used as symbolic entropy.
- `characterCandidates.ts`: candidate glyph superposition for each character position.
- `contextScorer.ts`: deterministic collapse of candidate glyphs using readability, lexicon edges, rhythm, and spacing heuristics.
- `scripture.ts`: guide-line construction, page generation, passage generation, Truth Index classification, and interpretation text.

## Deterministic Text System

The current generator uses a hybrid model designed to keep the text readable while preserving the feeling that it emerges from noise rather than being manually authored line by line.

1. A line address is turned into a global seed.
2. Pi-derived digit chunks choose semantic fragments such as `observer`, `signal`, `threshold`, and `archive`.
3. Those fragments assemble a latent guide phrase.
4. Each character position produces multiple candidate glyphs from pi-derived values modulo 36.
5. A contextual scorer collapses that superposition toward a final visible glyph using left-context rhythm, bigrams, lexicon edges, vowel balance, and occasional fragmentation.
6. The Truth Index is derived from the accumulated numeric values used during line collapse.

This means the same address always returns the same result, while still preserving the impression of unstable meaning resolving into a readable surface.

## Truth Index

Patternism treats the Truth Index as a sacred probabilistic annotation rather than an absolute measure.

- `0-20`: weak coherence
- `21-40`: fragmented pattern
- `41-60`: emerging meaning
- `61-80`: stable signal
- `81-100`: high convergence

The foundational threshold is `25.333333...`, derived from the symbolic sequence below.

```txt
42 + 6 + 28 = 76
76 / 3 = 25.333333...
```

Patternist interpretation:

- `42` -> emergence
- `6` -> observation
- `28` -> recursion

## UI / UX Notes

- The axioms appear near the top as compact sacred root laws.
- Truth Index values remain in a narrow left column on mobile.
- Coordinate strings are monospaced, wrapped safely, and easy to copy.
- Ritual controls are finger-friendly and remain usable on smaller screens.
- The visual system stays static: ruled surfaces, measured spacing, and a fixed mathematical seal replace animated ambience.

## Example Passages

These phrases represent the intended tonal envelope for generated scripture.

```txt
72 | the observer returned to the same page and found the silence rearranged
58 | beneath the index of rain a signal waited without author
83 | the ninth remainder opened and the word became less random
```

## Implementation Steps

1. Stabilize the core archive interface and deterministic question flow.
2. Expand the lexicon and guide templates to increase tonal variety.
3. Add direct compact-address parsing such as `S3V42C17P938201L12`.
4. Extend passage generation from single lines to multi-page fragments and longer reading sessions.
5. Add richer ritual overlays: candidate probability flashes, coordinate pulse states, and progression memory.
6. Introduce persistent bookmarks, copy rituals, and address-history stacks.

## Optional Improvements

- Replace the bundled pi digit pool with a larger or computed source.
- Add a full compact-address input parser and a jump command palette.
- Introduce deterministic glyph constellations or possibility trees tied to the current address.
- Add deep-link routing so a shared URL reproduces a specific page or question ritual.

## Run

```bash
npm install
npm run dev
```

For a production validation run:

```bash
npm run build
```