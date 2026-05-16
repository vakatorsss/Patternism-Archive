import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { BookReader } from "../components/BookReader";
import { RitualReveal } from "../components/RitualReveal";
import { DEFAULT_ADDRESS, formatAddress, formatPageAddress, pageAddress, parseAddress, type BookAddress } from "../generation/bookAddress";
import { generatePage, type GeneratedLine } from "../generation/scripture";
import { DEFAULT_TEXT_PATH, getTextPath } from "../lib/routes";

function topTruthLines(address: BookAddress, count = 3) {
  return [...generatePage(address)]
    .sort((left, right) => right.truthIndex - left.truthIndex || left.address.line - right.address.line)
    .slice(0, count);
}

export function TextPage() {
  const navigate = useNavigate();
  const { address } = useParams<{ address?: string }>();
  const parsedAddress = address ? parseAddress(address) : null;
  const hasExplicitLine = Boolean(address && /L\d+$/i.test(address));
  const highlightedLine = parsedAddress?.line ?? 1;
  const currentPage = pageAddress(parsedAddress ?? DEFAULT_ADDRESS);
  const pageLabel = formatPageAddress(currentPage);
  const pagePath = getTextPath(currentPage);
  const [ritualPassage, setRitualPassage] = useState<GeneratedLine[]>(() => topTruthLines(currentPage));
  const [ritualOrigin, setRitualOrigin] = useState(() => formatAddress(topTruthLines(currentPage)[0]?.address ?? { ...currentPage, line: 1 }));

  useEffect(() => {
    const topLines = topTruthLines(currentPage);
    setRitualPassage(topLines);
    setRitualOrigin(formatAddress(topLines[0]?.address ?? { ...currentPage, line: 1 }));
  }, [pageLabel]);

  const updateAddress = (nextAddress: BookAddress) => {
    navigate(getTextPath(nextAddress));
  };

  if (!address) {
    return <Navigate to={DEFAULT_TEXT_PATH} replace />;
  }

  if (!parsedAddress) {
    return <Navigate to={pagePath} replace />;
  }

  const canonicalAddress = hasExplicitLine ? formatAddress(parsedAddress) : formatPageAddress(parsedAddress);
  if (address !== canonicalAddress) {
    return <Navigate to={`/text/${canonicalAddress}`} replace />;
  }

  return (
    <div className="w-full overflow-x-hidden px-4 sm:px-6 lg:px-10">
      <div className="grid gap-10 pt-2 xl:grid-cols-12 xl:gap-x-7 xl:gap-y-14 xl:px-0">
        <div className="xl:col-span-11 xl:col-start-2">
          <BookReader address={parsedAddress} onAddressChange={updateAddress} highlightedLine={highlightedLine} />
        </div>

        <section className="xl:col-span-3 xl:col-start-2">
          <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">Ordered disclosure</h2>

          <div className="archive-table mt-6">
            <div className="archive-table-row">
              <div className="archive-kicker">Current origin</div>
              <div className="mono-ritual break-all text-sm text-[var(--ink)]">{ritualOrigin}</div>
            </div>
            <div className="archive-table-row">
              <div className="archive-kicker">Route page</div>
              <div className="mono-ritual break-all text-sm text-[var(--ink)]">{pageLabel}</div>
            </div>
          </div>
        </section>

        <div className="xl:col-span-7 xl:col-start-5">
          <RitualReveal lines={ritualPassage} />
        </div>
      </div>
    </div>
  );
}
