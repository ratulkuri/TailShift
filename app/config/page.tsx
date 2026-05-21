import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConfigMigrator } from "@/components/ConfigMigrator";
import { SITE_URL } from "@/lib/site";

const PAGE_TITLE = "Tailwind v3 config migrator";
const PAGE_DESCRIPTION =
  "Merge your Tailwind v3 tailwind.config.js and globals.css into a single Tailwind v4 globals.css with @theme tokens, @plugin directives, @custom-variant dark, and @source rules.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/config" },
  openGraph: {
    title: `${PAGE_TITLE} · TailShift`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/config`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} · TailShift`,
    description: PAGE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TailShift — Config Migrator",
  url: `${SITE_URL}/config`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  description: PAGE_DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  creator: {
    "@type": "Person",
    name: "Kowshik Kuri",
    url: "https://kowshikkuri.com",
  },
};

export default function ConfigMigratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="py-10 sm:py-16">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Merge config + CSS into
            <span className="block text-[var(--color-brand-600)]">v4 globals.css</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Drop in your <code className="font-mono">tailwind.config.js</code> and v3{" "}
            <code className="font-mono">globals.css</code>. TailShift folds{" "}
            <code className="font-mono">theme.extend</code> into{" "}
            <code className="font-mono">@theme</code> tokens, migrates plugins, rewrites{" "}
            <code className="font-mono">darkMode</code> to{" "}
            <code className="font-mono">@custom-variant</code>, and emits a single v4 CSS file.
          </p>
        </section>

        <ConfigMigrator />

        <section
          aria-labelledby="cm-how"
          className="mx-auto max-w-5xl px-4 sm:px-6 mt-16 grid gap-6 md:grid-cols-3"
        >
          <h2 id="cm-how" className="sr-only">
            What gets migrated
          </h2>
          <Feature
            title="Theme → @theme tokens"
            body="colors, spacing, screens, fontSize tuples, fontFamily arrays, borderRadius, shadows, keyframes — all mapped to v4 CSS variables."
          />
          <Feature
            title="Plugins → @plugin"
            body="@tailwindcss/forms and typography pass through. aspect-ratio, container-queries, and line-clamp are dropped (built-in). tailwindcss-animate is swapped for tw-animate-css."
          />
          <Feature
            title="darkMode, prefix, important"
            body="darkMode: 'class' → @custom-variant dark. prefix → @import option. important: true → @import option. safelist → @source inline."
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
