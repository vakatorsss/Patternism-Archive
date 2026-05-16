import { useEffect, useState } from "react";

import { isFalseTruthIndex, type GeneratedLine } from "../generation/scripture";

interface RitualRevealProps {
  lines: GeneratedLine[];
}

export function RitualReveal({ lines }: RitualRevealProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [running, setRunning] = useState(true);

  const totalGlyphs = lines.reduce((total, line) => total + line.text.length, 0);

  useEffect(() => {
    setVisibleCount(0);
    setRunning(true);
  }, [lines]);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reducedMotion ? 46 : 24;
    const step = reducedMotion ? 2 : 1;
    const timer = window.setInterval(() => {
      setVisibleCount((current) => Math.min(totalGlyphs, current + step));
    }, delay);

    return () => window.clearInterval(timer);
  }, [running, totalGlyphs]);

  useEffect(() => {
    if (visibleCount >= totalGlyphs && running) {
      setRunning(false);
    }
  }, [running, totalGlyphs, visibleCount]);

  let consumed = 0;

  return (
    <div className="archive-panel p-5 sm:p-6">
      <div className="border border-[var(--border)]">
        {lines.map((line) => {
          const lineOffset = consumed;
          consumed += line.text.length;
          const visibleOnLine = Math.max(0, Math.min(line.text.length, visibleCount - lineOffset));

          return (
            <div key={line.addressLabel} className="grid grid-cols-[2.8rem_1fr] gap-3 border-t border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4 first:border-t-0">
              <div className="mono-ritual pt-0.5 text-[var(--accent)]">{Math.round(line.truthIndex).toString().padStart(2, "0")}</div>
              <div>
                <p className="mono-ritual whitespace-pre-wrap text-sm leading-7 sm:text-[0.94rem]">
                  {line.text.split("").map((character, index) => {
                    const latentCharacter = line.characterStates[index]?.[0] ?? character;
                    const revealed = index < visibleOnLine;

                    return (
                      <span
                        key={`${line.addressLabel}-${index}`}
                        className={revealed ? (isFalseTruthIndex(line.truthIndex) ? "text-[var(--false-ink)]" : "text-[var(--ink)]") : "text-[var(--subtle)]"}
                      >
                        {revealed ? character : latentCharacter}
                      </span>
                    );
                  })}
                </p>
                <p className="mono-ritual mt-1 break-all text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">{line.addressLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
