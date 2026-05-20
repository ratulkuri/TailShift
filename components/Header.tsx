import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-600)] rounded"
          aria-label="TailShift home"
        >
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand-600)] text-white text-sm font-bold"
          >
            T
          </span>
          <span>TailShift</span>
        </Link>
        <nav aria-label="Primary">
          <a
            href="https://tailwindcss.com/docs/upgrade-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-600)] rounded"
          >
            Upgrade guide
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
