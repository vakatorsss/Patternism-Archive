export function HomePage() {
  return (
    <div className="grid min-h-[68vh] gap-10 pt-8 xl:grid-cols-12 xl:pt-16">
      <section className="xl:col-span-6 xl:col-start-3">
        <p className="archive-kicker">Homepage</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-[var(--ink-strong)] sm:text-4xl">
          A scripture archive split into entry, rules, finder, and text
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)]">
          The archive is divided into separate pages. Rules explains the doctrine. Finder routes a question into coordinates. Text is the main reading surface, and the page address lives in the link.
        </p>

        <p className="mt-20 max-w-xl text-sm leading-7 text-[var(--subtle)]">Use the navigation above. The empty space is intentional.</p>
      </section>
    </div>
  );
}