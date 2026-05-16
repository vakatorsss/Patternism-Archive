import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { formatAddress } from "../generation/bookAddress";
import { questionToAddress, ritualHashSegments } from "../generation/questionHash";
import { generatePassage, interpretPassage, isFalseTruthIndex } from "../generation/scripture";
import { getTextPath } from "../lib/routes";

export function AskTheBook() {
  const [question, setQuestion] = useState("What pattern is nearest to me?");
  const [response, setResponse] = useState(() => {
    const address = questionToAddress("What pattern is nearest to me?");
    const lines = generatePassage(address);
    return {
      addressLabel: formatAddress(address),
      pagePath: getTextPath(address),
      hashSegments: ritualHashSegments("What pattern is nearest to me?"),
      interpretation: interpretPassage(lines),
      lines,
    };
  });
  const deferredQuestion = useDeferredValue(question);
  const previewAddress = questionToAddress(deferredQuestion || "patternism");
  const previewPath = getTextPath(previewAddress);
  const previewSegments = ritualHashSegments(deferredQuestion || "patternism");

  useEffect(() => {
    const normalized = deferredQuestion.trim();
    if (!normalized) {
      return;
    }

    const address = questionToAddress(normalized);
    const lines = generatePassage(address);

    setResponse({
      addressLabel: formatAddress(address),
      pagePath: getTextPath(address),
      hashSegments: ritualHashSegments(normalized),
      interpretation: interpretPassage(lines),
      lines,
    });
  }, [deferredQuestion]);

  return (
    <section id="ask" className="grid gap-5 xl:grid-cols-12 xl:items-start xl:gap-x-7 xl:gap-y-8">
      <div className="archive-panel p-5 sm:p-6 xl:col-span-5">
        <p className="archive-kicker">Ask The Book</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[0.04em] text-[var(--ink)] sm:text-3xl">A question is routed into coordinates</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          The archive does not reply conversationally. A question is hashed, indexed, and redirected toward an existing passage.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="sr-only">Question</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              className="archive-input mono-ritual min-h-32 w-full resize-y text-sm leading-7"
              placeholder="What should I notice today?"
            />
          </label>

          <div className="archive-table bg-[var(--panel-strong)]">
            <div className="archive-table-row">
              <span className="archive-kicker">Derived coordinate</span>
              <span className="mono-ritual break-all text-sm text-[var(--ink)]">{formatAddress(previewAddress)}</span>
            </div>
            <div className="archive-table-row">
              <span className="archive-kicker">Text route</span>
              <span className="mono-ritual break-all text-sm text-[var(--ink)]">{previewPath}</span>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
              {previewSegments.map((segment) => (
                <span key={segment} className="bg-[var(--panel)] px-3 py-3 mono-ritual text-[0.72rem] tracking-[0.18em] text-[var(--muted)]">
                  {segment}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="archive-panel p-5 sm:p-6 xl:col-span-7 xl:mt-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
          <span className="archive-kicker">Selected address</span>
          <span className="mono-ritual break-all text-[var(--ink)]">{response.addressLabel}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={response.pagePath} className="archive-button archive-button-accent mono-ritual text-[0.72rem] uppercase tracking-[0.16em]">
            Open text page
          </Link>
          <span className="archive-tag mono-ritual break-all text-[0.72rem] tracking-[0.12em]">{response.pagePath}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
          {response.hashSegments.map((segment) => (
            <span key={segment} className="bg-[var(--panel-strong)] px-3 py-3 mono-ritual text-[0.72rem] tracking-[0.18em] text-[var(--muted)]">
              {segment}
            </span>
          ))}
        </div>

        <div className="mt-5 border border-[var(--border)]">
          {response.lines.map((line) => (
            <div key={line.addressLabel} className="grid grid-cols-[2.8rem_1fr] gap-3 border-t border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4 first:border-t-0">
              <div className="mono-ritual text-[var(--accent)]">{Math.round(line.truthIndex).toString().padStart(2, "0")}</div>
              <div className="min-w-0">
                <p className={`text-sm leading-7 ${isFalseTruthIndex(line.truthIndex) ? "text-[var(--false-ink)]" : "text-[var(--ink)]"}`}>{line.text}</p>
                <p className="mono-ritual mt-1 break-all text-[0.7rem] uppercase tracking-[0.18em] text-[var(--muted)]">{line.addressLabel}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 border-t border-[var(--border)] pt-4 text-sm leading-7 text-[var(--muted)]">{response.interpretation}</p>
      </div>
    </section>
  );
}
