import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { ProbabilityVisualizer } from "./components/ProbabilityVisualizer";
import { loadRuntimeLexicon } from "./generation/runtimeLexicon";
import { FinderPage } from "./pages/FinderPage";
import { HomePage } from "./pages/HomePage";
import { RulesPage } from "./pages/RulesPage";
import { TextPage } from "./pages/TextPage";

type ThemeMode = "black" | "white" | "archive";

const THEME_STORAGE_KEY = "patternism-theme";
const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "archive", label: "Archive" },
];

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/rules", label: "Rules", end: false },
  { to: "/finder", label: "Finder", end: false },
  { to: "/text", label: "Text", end: false },
] as const;

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "black";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "black" || storedTheme === "white" || storedTheme === "archive") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "white" : "black";
}

export default function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lexiconVersion, setLexiconVersion] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme);
  const pageGroup = location.pathname.startsWith("/text/") ? "/text" : location.pathname;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pageGroup]);

  useEffect(() => {
    let cancelled = false;

    loadRuntimeLexicon().then((version) => {
      if (!cancelled) {
        setLexiconVersion(version);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const themeSwitch = (
    <div className="flex items-center gap-3">
      <span className="archive-kicker">Mode</span>
      <div className="flex border border-[var(--border)]">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={theme === option.value}
            data-active={theme === option.value}
            onClick={() => setTheme(option.value)}
            className="archive-mode-button border-r border-[var(--border)] last:border-r-0"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ProbabilityVisualizer />
      <header className="z-40 border-b border-[var(--border)]">
        <div className="mx-auto grid w-full max-w-[118rem] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end xl:px-10 2xl:max-w-[126rem]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="archive-kicker">Patternism Archive</p>
              <p className="text-sm tracking-[0.18em] text-[var(--ink)]">The Infinite Book</p>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="archive-button archive-button-ghost mono-ritual px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.16em] md:hidden"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>

          <div className="hidden items-end gap-8 md:flex">
            <nav className="flex items-center gap-5 mono-ritual text-[0.76rem] uppercase tracking-[0.18em] text-[var(--muted)]">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `archive-link ${isActive ? "text-[var(--ink)]" : ""}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            {themeSwitch}
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-[var(--border)] px-4 py-4 md:hidden sm:px-6">
            <nav className="grid gap-px border border-[var(--border)] bg-[var(--border)]">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `bg-[var(--panel)] px-4 py-3 mono-ritual text-[0.76rem] uppercase tracking-[0.16em] ${isActive ? "text-[var(--ink)]" : "text-[var(--muted)]"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4">{themeSwitch}</div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[118rem] px-4 pb-24 pt-6 sm:px-6 xl:px-10 2xl:max-w-[126rem]">
        <Routes key={`lexicon-${lexiconVersion}`}>
          <Route path="/" element={<HomePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/text" element={<TextPage />} />
          <Route path="/text/:address" element={<TextPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
