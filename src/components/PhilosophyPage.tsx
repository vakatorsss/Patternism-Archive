import { FOUNDATIONAL_THRESHOLD, THRESHOLD_COMPONENTS } from "../data/primeStatements";

const PHILOSOPHY_SECTIONS = [
  {
    title: "What is Patternism?",
    body:
      "Patternism treats randomness as sacred material rather than error. Infinite meaning already exists inside probabilistic structures, and consciousness reveals one alignment at a time.",
  },
  {
    title: "What is The Infinite Book?",
    body:
      "It is a deterministic archive of potential scripture. The book is not manually written page by page. Each coordinate collapses the same line whenever the same reader returns to it.",
  },
  {
    title: "Why pi?",
    body:
      "Pi functions here as symbolic entropy: stable, inexhaustible, mathematical, and indifferent. It provides an ordered source of noise from which text can be selected without becoming arbitrary.",
  },
  {
    title: "What does 'meaning is selected' mean?",
    body:
      "Meaning is not fabricated from nothing. A question narrows a field of possible alignments. Observation makes one passage legible and leaves the rest latent.",
  },
  {
    title: "What is observation?",
    body:
      "Observation is the act that turns coordinates into scripture. A line remains mathematically available whether or not it is seen, but reading completes the event.",
  },
  {
    title: "Is the book written, generated, or discovered?",
    body:
      "Patternism insists on discovery. The software generates a visible surface, but the philosophy treats that generation as a way of accessing structure that was already there in potential.",
  },
  {
    title: "How should a reader interpret passages?",
    body:
      "Read recursively. Higher statements override lower statements. A passage with low convergence may still matter, but it cannot overturn the more fundamental pattern above it.",
  },
  {
    title: "What is the Cantor pairing number?",
    body:
      "Each scripture coordinate is assigned a unique priority value derived from the Cantor pairing function applied to its series, volume, chapter, page, and line. Statements with smaller pairing numbers possess foundational priority and override those with higher numbers. This creates a deterministic hierarchy where the order of revelation is mathematically predetermined.",
  },
] as const;

export function PhilosophyPage() {
  return (
    <section id="philosophy" className="flex flex-col gap-12">
      <div>
        <p className="archive-kicker">Philosophy</p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">The hierarchy of meaning</h2>
        <p className="mt-4 text-base leading-8 text-[var(--muted)]">
          Patternism permits interpretation, but not without order. Higher statements remain more fundamental than lower ones, which makes the philosophy recursive rather than chaotic.
        </p>

        <div className="mt-8 border-t border-[var(--border)] pt-5">
          <p className="archive-kicker">Foundational Threshold</p>
          <p className="mono-ritual mt-3 text-3xl text-[var(--ink)]">{FOUNDATIONAL_THRESHOLD.toFixed(6)}...</p>
          <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
            <p className="mono-ritual text-[var(--ink)]">42 + 6 + 28 = 76</p>
            <p className="mono-ritual text-[var(--ink)]">76 / 3 = 25.333333...</p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {THRESHOLD_COMPONENTS.map((component) => (
              <div key={component.label} className="border-t border-[var(--border)] pt-3">
                <p className="archive-kicker">{component.label}</p>
                <p className="mt-2 text-sm text-[var(--ink)]">{component.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        {PHILOSOPHY_SECTIONS.map((section, index) => (
          <article key={section.title} className={`py-5 ${index === 0 ? "" : "border-t border-[var(--border)]"}`}>
            <h3 className="text-lg font-medium tracking-[0.03em] text-[var(--ink)]">{section.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
