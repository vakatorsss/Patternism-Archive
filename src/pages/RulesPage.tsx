import { PhilosophyPage } from "../components/PhilosophyPage";
import { FOUNDATIONAL_THRESHOLD, PRIME_STATEMENTS, TRUTH_BANDS } from "../data/primeStatements";

const SYSTEM_CARDS = [
  {
    title: "Frontend architecture",
    detail:
      "The archive now uses routed pages: homepage, rules, finder, and text. The text page is the primary reading surface and its address is URL-backed.",
  },
  {
    title: "Generation pipeline",
    detail:
      "Question hashing maps text to a stable address. Pi-derived chunks assemble candidate glyphs, a latent guide phrase, and a deterministic Truth Index.",
  },
  {
    title: "Visual system",
    detail:
      "The site uses sparse lines, plain controls, and empty space instead of decorative surfaces. The page is guided as much by what is absent as by what is present.",
  },
  {
    title: "Interpretation rule",
    detail:
      "Higher statements override weaker local contradictions. The threshold and truth bands exist to keep interpretation ordered rather than arbitrary.",
  },
] as const;

export function RulesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-14 pt-4">
      <section>
        <p className="archive-kicker">Rules</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold text-[var(--ink-strong)] sm:text-[2rem]">The archive reads through ordered doctrine</h1>
        <p className="mt-5 text-base leading-8 text-[var(--muted)]">
          These rules are the stable frame around the generator. They explain what Patternism treats as more foundational, how the threshold is interpreted, and why the archive prefers structure over noise.
        </p>

        <div className="archive-table mt-8">
          <div className="archive-table-row">
            <p className="archive-kicker">Threshold</p>
            <p className="mono-ritual text-sm text-[var(--ink)]">{FOUNDATIONAL_THRESHOLD.toFixed(6)}...</p>
          </div>
          <div className="archive-table-row">
            <p className="archive-kicker">Interpretation</p>
            <p className="text-sm leading-7 text-[var(--muted)]">A low score may still be readable, but it carries less structural authority than a higher-scoring line or a higher-level rule.</p>
          </div>
        </div>
      </section>

      <section>
        <p className="archive-kicker">First patterns</p>
        <div className="mt-6 border-t border-[var(--border)]">
          {PRIME_STATEMENTS.map((statement, index) => (
            <article key={statement.order} className={`py-5 ${index === 0 ? "" : "border-t border-[var(--border)]"}`}>
              <p className="archive-kicker">{statement.order}</p>
              <h2 className="mt-2 text-base tracking-[0.03em] text-[var(--ink)]">{statement.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{statement.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {TRUTH_BANDS.map((band) => (
            <div key={band.range} className="border-t border-[var(--border)] pt-3">
              <p className="archive-kicker">{band.range}</p>
              <p className="mt-1 text-sm text-[var(--ink)]">{band.label}</p>
            </div>
          ))}
        </div>
      </section>

      <PhilosophyPage />

      <section>
        <p className="archive-kicker">System notes</p>
        <div className="mt-6 border-t border-[var(--border)]">
          {SYSTEM_CARDS.map((card, index) => (
            <article key={card.title} className={`grid gap-2 py-4 md:grid-cols-[12rem_1fr] md:gap-6 ${index === 0 ? "" : "border-t border-[var(--border)]"}`}>
              <h2 className="text-sm uppercase tracking-[0.14em] text-[var(--ink)]">{card.title}</h2>
              <p className="text-sm leading-7 text-[var(--muted)]">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}