"use client";

import { useMemo, useState, useId, useCallback } from "react";
import { convert, type Direction } from "@/lib/converters";

const EXAMPLES: Record<Direction, string> = {
  "v3-to-v4":
    "shadow rounded bg-red-500 bg-opacity-50 !flex flex-grow-1 outline-none ring bg-[--brand]",
  "v4-to-v3": "shadow-sm rounded-sm bg-red-500/50 flex! grow-1 outline-hidden ring-3 bg-(--brand)",
};

export function Converter() {
  const [direction, setDirection] = useState<Direction>("v3-to-v4");
  const [input, setInput] = useState(EXAMPLES["v3-to-v4"]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => convert(input, direction), [input, direction]);

  const inputId = useId();
  const outputId = useId();
  const changesId = useId();

  const onSwap = useCallback(() => {
    const newDir: Direction = direction === "v3-to-v4" ? "v4-to-v3" : "v3-to-v4";
    setDirection(newDir);
    setInput(result.output || EXAMPLES[newDir]);
  }, [direction, result.output]);

  const onDirectionChange = useCallback((d: Direction) => {
    setDirection(d);
    setInput((prev) => (prev.trim() ? prev : EXAMPLES[d]));
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard may be blocked
    }
  }, [result.output]);

  const fromLabel = direction === "v3-to-v4" ? "Tailwind v3 classes" : "Tailwind v4 classes";
  const toLabel = direction === "v3-to-v4" ? "Tailwind v4 classes" : "Tailwind v3 classes";

  return (
    <section
      id="main"
      aria-labelledby="converter-heading"
      className="mx-auto max-w-5xl px-4 sm:px-6"
    >
      <h2 id="converter-heading" className="sr-only">
        Converter
      </h2>

      <fieldset className="mb-6">
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Conversion direction
        </legend>
        <div
          role="radiogroup"
          aria-label="Conversion direction"
          className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900"
        >
          {(
            [
              { v: "v3-to-v4", label: "v3 → v4" },
              { v: "v4-to-v3", label: "v4 → v3" },
            ] as const
          ).map((opt) => {
            const active = direction === opt.v;
            return (
              <label
                key={opt.v}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-brand-600)] text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="direction"
                  value={opt.v}
                  checked={active}
                  onChange={() => onDirectionChange(opt.v)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={inputId} className="text-sm font-medium">
              {fromLabel}
            </label>
            <button
              type="button"
              onClick={onSwap}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-600)] rounded"
              aria-label="Swap input and output, reverse direction"
            >
              ↕ Swap
            </button>
          </div>
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            rows={8}
            aria-describedby={`${inputId}-help`}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-sm leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] resize-y"
            placeholder="Paste your Tailwind classes here…"
          />
          <p id={`${inputId}-help`} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Variants like <code className="font-mono">hover:</code>,{" "}
            <code className="font-mono">md:</code>, and arbitrary values are preserved.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={outputId} className="text-sm font-medium">
              {toLabel}
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
            value={result.output}
            readOnly
            aria-live="polite"
            spellCheck={false}
            rows={8}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 font-mono text-sm leading-relaxed resize-y"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Output updates live as you type.
          </p>
        </div>
      </div>

      {(result.changes.length > 0 || result.notes.length > 0) && (
        <aside
          aria-labelledby={changesId}
          className="mt-8 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900"
        >
          <h3 id={changesId} className="text-sm font-semibold mb-3">
            Changes applied ({result.changes.length})
          </h3>
          {result.changes.length > 0 && (
            <ul className="space-y-1.5 text-sm font-mono">
              {result.changes.map((c, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
                    {c.from}
                  </span>
                  <span aria-hidden className="text-slate-400">
                    →
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
                    {c.to}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    {c.reason}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result.notes.length > 0 && (
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-semibold mb-1">Notes:</p>
              <ul className="list-disc pl-5 space-y-1">
                {result.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
