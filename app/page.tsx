import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Converter } from "@/components/Converter";
import { SITE_URL } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "TailShift",
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      description:
        "Free Tailwind CSS class converter. Migrate className strings between Tailwind v3 and v4 in either direction.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: {
        "@type": "Person",
        name: "Kowshik Kuri",
        url: "https://kowshikkuri.com",
      },
    },
    {
      "@type": "WebSite",
      name: "TailShift",
      url: SITE_URL,
      inLanguage: "en",
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="py-10 sm:py-16">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Convert Tailwind classes
            <span className="block text-[var(--color-brand-600)]">v3 ↔ v4</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Paste any className string and TailShift rewrites it for the other Tailwind major
            version. Handles renames, opacity modifiers, the new <code>!</code> position, and
            arbitrary CSS variable syntax.
          </p>
        </section>

        <Converter />

        <section
          aria-labelledby="how"
          className="mx-auto max-w-5xl px-4 sm:px-6 mt-16 grid gap-6 md:grid-cols-3"
        >
          <h2 id="how" className="sr-only">
            How it works
          </h2>
          <Feature
            title="Two-way conversion"
            body="Run v3 → v4 for an upgrade, or v4 → v3 to backport snippets into a legacy codebase."
          />
          <Feature
            title="Variant-aware"
            body="Variants like hover:, md:, group-hover: and arbitrary values stay attached to the rewritten utility."
          />
          <Feature
            title="Opacity-modifier smart"
            body="Pairs like bg-red-500 + bg-opacity-50 collapse into bg-red-500/50 — and back."
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{body}</p>
    </article>
  );
}
