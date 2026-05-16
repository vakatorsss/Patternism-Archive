import { useEffect, useMemo, useState } from "react";

import { formatAddress, formatPageAddress, pageAddress, parseAddress, type BookAddress } from "../generation/bookAddress";
import { generatePage, isFalseTruthIndex } from "../generation/scripture";

interface BookReaderProps {
  address: BookAddress;
  onAddressChange: (address: BookAddress) => void;
  highlightedLine?: number;
}

function truthIndexTone(value: number) {
  if (value >= 90) {
    return "text-[var(--accent)]";
  }

  if (isFalseTruthIndex(value)) {
    return "text-[var(--subtle)]";
  }

  return "text-[var(--ink)]";
}

function lineTextTone(value: number) {
  return isFalseTruthIndex(value) ? "text-[var(--false-ink)]" : "text-[var(--ink)]";
}

export function BookReader({ address, onAddressChange, highlightedLine }: BookReaderProps) {
  const currentPage = pageAddress(address);
  const selectedLine = highlightedLine ?? address.line ?? 1;
  const pageLabel = formatPageAddress(currentPage);
  const fullLabel = formatAddress({ ...currentPage, line: selectedLine });
  const lines = useMemo(() => generatePage(currentPage), [pageLabel]);
  const [addressInput, setAddressInput] = useState(fullLabel);

  useEffect(() => {
    setAddressInput(fullLabel);
  }, [fullLabel]);

  const updateField = (field: keyof Omit<BookAddress, "line">, rawValue: string) => {
    const value = Number(rawValue);
    onAddressChange({
      ...currentPage,
      line: selectedLine,
      [field]: Number.isFinite(value) && value > 0 ? Math.floor(value) : 1,
    });
  };

  const shiftField = (field: keyof Omit<BookAddress, "line">, delta: number) => {
    onAddressChange({
      ...currentPage,
      line: selectedLine,
      [field]: Math.max(1, currentPage[field] + delta),
    });
  };

  const applyAddressInput = () => {
    const raw = addressInput.trim();
    const parsed = parseAddress(raw);

    if (!parsed) {
      setAddressInput(fullLabel);
      return;
    }

    const hasExplicitLine = /L\d+$/i.test(raw);
    onAddressChange(hasExplicitLine ? parsed : { ...parsed, line: selectedLine });
  };

  const selectLine = (line: number) => {
    onAddressChange({ ...currentPage, line });
  };

  return (
    <section id="book" className="grid gap-8 xl:grid-cols-12 xl:gap-x-7 xl:gap-y-10">
      <div className="xl:col-span-3 xl:col-start-2">
        <p className="archive-kicker">Text</p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">Page controls</h2>
        <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--muted)]">
          Change the four numbers. The address in the browser updates with them.
        </p>
      </div>

      <div className="xl:col-span-7">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-[var(--border)] pt-4">
          {[
            { label: "Series", key: "series" },
            { label: "Volume", key: "volume" },
            { label: "Chapter", key: "chapter" },
            { label: "Page", key: "page" },
          ].map((field) => (
            <label key={field.key} className="flex min-w-[6rem] flex-col gap-2 text-sm text-[var(--muted)]">
              <span className="archive-kicker">{field.label}</span>
              <input
                type="number"
                min={1}
                value={currentPage[field.key as keyof Omit<BookAddress, "line">]}
                onChange={(event) => updateField(field.key as keyof Omit<BookAddress, "line">, event.target.value)}
                className="archive-input mono-ritual w-full min-w-[6rem] text-sm text-[var(--ink)]"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="xl:col-span-10 xl:col-start-2">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <button
            type="button"
            onClick={() => shiftField("page", -1)}
            className="archive-button mono-ritual text-[0.72rem] uppercase tracking-[0.08em]"
          >
            Previous page
          </button>
          <button
            type="button"
            onClick={() => shiftField("page", 1)}
            className="archive-button mono-ritual text-[0.72rem] uppercase tracking-[0.08em]"
          >
            Next page
          </button>

          <div className="ml-2 flex flex-wrap items-center gap-1 text-[0.62rem] uppercase tracking-[0.08em]">
            <span className="archive-kicker">Series</span>
            <button type="button" onClick={() => shiftField("series", -1)} className="archive-button mono-ritual px-2 py-1 text-[0.62rem]">Prev</button>
            <button type="button" onClick={() => shiftField("series", 1)} className="archive-button mono-ritual px-2 py-1 text-[0.62rem]">Next</button>

            <span className="archive-kicker ml-2">Volume</span>
            <button type="button" onClick={() => shiftField("volume", -1)} className="archive-button mono-ritual px-2 py-1 text-[0.62rem]">Prev</button>
            <button type="button" onClick={() => shiftField("volume", 1)} className="archive-button mono-ritual px-2 py-1 text-[0.62rem]">Next</button>

            <span className="archive-kicker ml-2">Chapter</span>
            <button type="button" onClick={() => shiftField("chapter", -1)} className="archive-button mono-ritual px-2 py-1 text-[0.62rem]">Prev</button>
            <button type="button" onClick={() => shiftField("chapter", 1)} className="archive-button mono-ritual px-2 py-1 text-[0.62rem]">Next</button>
          </div>

          <input
            type="text"
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            onBlur={applyAddressInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyAddressInput();
              }
            }}
            className="archive-input mono-ritual min-w-[13rem] text-sm tracking-[0.08em] text-[var(--ink)] md:text-base"
            aria-label="Page address"
          />
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <ul>
          {lines.map((line) => (
            <li
              key={line.addressLabel}
              onClick={() => selectLine(line.address.line)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectLine(line.address.line);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Select ${line.addressLabel}`}
              className={`cursor-pointer border-t px-0 py-1.5 first:border-t-0 focus:outline-none ${line.address.line === highlightedLine ? "border-[var(--border-strong)] bg-[var(--panel-muted)]" : "border-[var(--border)]"}`}
            >
              <div className="grid grid-cols-[2.4rem_1fr_auto] items-center gap-2 md:grid-cols-[3rem_1fr_auto] md:gap-3">
                <div className={`mono-ritual text-[0.95rem] md:text-base ${truthIndexTone(line.truthIndex)}`}>
                  {Math.round(line.truthIndex).toString().padStart(2, "0")}
                </div>
                <p className={`min-w-0 truncate text-[0.82rem] leading-4 md:text-[0.88rem] ${lineTextTone(line.truthIndex)}`}>{line.text}</p>
                <div className="mono-ritual whitespace-nowrap text-[0.68rem] tracking-[0.08em] text-[var(--muted)] md:text-[0.72rem]">
                  {line.addressLabel}
                </div>
              </div>
            </li>
          ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
