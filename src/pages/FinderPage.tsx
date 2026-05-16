import { AskTheBook } from "../components/AskTheBook";

export function FinderPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-12 xl:items-start xl:gap-x-7 xl:gap-y-8">
      <section className="archive-panel p-5 sm:p-6 xl:col-span-7">
        <p className="archive-kicker">Finder</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[0.04em] text-[var(--ink-strong)] sm:text-4xl">Resolve a question into a page route</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--muted)] sm:text-base">
          The finder is not the reading surface. It is the routing surface. It hashes a question into coordinates, shows you the resulting address, and points you to the dedicated text page where that page address appears in the URL.
        </p>
      </section>

      <div className="xl:col-span-12">
        <AskTheBook />
      </div>
    </div>
  );
}
