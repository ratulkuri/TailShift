"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { migrateConfig } from "@/lib/migrators/config";

const EXAMPLE_CONFIG = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
        accent: require("tailwindcss/colors").rose[500],
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      borderRadius: {
        xl: "1rem",
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};
`;

const EXAMPLE_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.5rem;
  }
  body {
    @apply bg-white text-slate-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-brand-500 text-white px-4 py-2 rounded-md;
  }
}
`;

export function ConfigMigrator() {
  const [configSrc, setConfigSrc] = useState(EXAMPLE_CONFIG);
  const [cssSrc, setCssSrc] = useState(EXAMPLE_CSS);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () => migrateConfig({ configSource: configSrc, cssSource: cssSrc }),
    [configSrc, cssSrc],
  );

  const configId = useId();
  const cssId = useId();
  const outputId = useId();
  const reportId = useId();

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked
    }
  }, [result.css]);

  const onReset = useCallback(() => {
    setConfigSrc(EXAMPLE_CONFIG);
    setCssSrc(EXAMPLE_CSS);
  }, []);

  const onClear = useCallback(() => {
    setConfigSrc("");
    setCssSrc("");
  }, []);

  const warnings = result.notes.filter((n) => n.level === "warning");
  const infos = result.notes.filter((n) => n.level === "info");

  return (
    <section
      id="main"
      aria-labelledby="migrator-heading"
      className="mx-auto max-w-6xl px-4 sm:px-6"
    >
      <h2 id="migrator-heading" className="sr-only">
        Config migrator
      </h2>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="text-xs rounded border border-slate-300 dark:border-slate-700 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-600)]"
        >
          Load example
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-xs rounded border border-slate-300 dark:border-slate-700 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-600)]"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor={configId} className="block text-sm font-medium mb-2">
            <code className="font-mono">tailwind.config.js</code>{" "}
            <span className="text-slate-500 dark:text-slate-400">(or .ts)</span>
          </label>
          <textarea
            id={configId}
            value={configSrc}
            onChange={(e) => setConfigSrc(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            rows={18}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-xs leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] resize-y"
            placeholder="Paste your tailwind.config.js here…"
            aria-describedby={`${configId}-help`}
          />
          <p
            id={`${configId}-help`}
            className="mt-1 text-xs text-slate-500 dark:text-slate-400"
          >
            <code className="font-mono">module.exports</code> or{" "}
            <code className="font-mono">export default</code>. TypeScript syntax is supported.
          </p>
        </div>

        <div>
          <label htmlFor={cssId} className="block text-sm font-medium mb-2">
            <code className="font-mono">globals.css</code>{" "}
            <span className="text-slate-500 dark:text-slate-400">(v3)</span>
          </label>
          <textarea
            id={cssId}
            value={cssSrc}
            onChange={(e) => setCssSrc(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            rows={18}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-xs leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] resize-y"
            placeholder="Paste your v3 globals.css here…"
            aria-describedby={`${cssId}-help`}
          />
          <p
            id={`${cssId}-help`}
            className="mt-1 text-xs text-slate-500 dark:text-slate-400"
          >
            Include your <code className="font-mono">@tailwind</code> directives,{" "}
            <code className="font-mono">@layer</code> blocks, and any{" "}
            <code className="font-mono">@apply</code> rules.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor={outputId} className="block text-sm font-medium">
            <code className="font-mono">globals.css</code>{" "}
            <span className="text-[var(--color-brand-600)]">(v4 — merged)</span>
          </label>
          <button
            type="button"
            onClick={onCopy}
            className="text-xs text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-600)]"
            aria-live="polite"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <textarea
          id={outputId}
          value={result.css}
          readOnly
          aria-live="polite"
          spellCheck={false}
          rows={22}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 font-mono text-xs leading-relaxed resize-y"
        />
      </div>

      {(result.changes.length > 0 || result.notes.length > 0) && (
        <aside
          aria-labelledby={reportId}
          className="mt-8 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900"
        >
          <h3 id={reportId} className="text-sm font-semibold mb-3">
            Migration report
          </h3>

          {result.changes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Applied ({result.changes.length})
              </p>
              <ul className="space-y-1.5 text-sm font-mono">
                {result.changes.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 break-all">
                      {c.from}
                    </span>
                    <span aria-hidden className="text-slate-400">
                      →
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 break-all">
                      {c.to}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-sans w-full sm:w-auto">
                      {c.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">
                Needs review ({warnings.length})
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {warnings.map((n, i) => (
                  <li key={i}>{n.message}</li>
                ))}
              </ul>
            </div>
          )}

          {infos.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                Notes
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {infos.map((n, i) => (
                  <li key={i}>{n.message}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
