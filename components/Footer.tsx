export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 mt-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p>
          Built with care by{" "}
          <a
            href="https://kowshikkuri.com"
            target="_blank"
            rel="noopener noreferrer me author"
            className="font-medium text-slate-900 dark:text-white underline decoration-[var(--color-brand-500)] decoration-2 underline-offset-4 hover:decoration-[var(--color-brand-700)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-600)] rounded"
          >
            Kowshik Kuri
          </a>
          .
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Not affiliated with Tailwind Labs. Open source friendly.
        </p>
      </div>
    </footer>
  );
}
