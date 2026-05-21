import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const SITE_NAME = "TailShift";
const TAGLINE = "Convert Tailwind CSS classes between v3 and v4";
const DESCRIPTION =
  "TailShift is a free, instant Tailwind CSS class converter. Migrate className strings between Tailwind v3 and v4 in either direction — handles renames, opacity modifiers, important syntax, and arbitrary values.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Tailwind CSS",
    "Tailwind v3 to v4",
    "Tailwind v4 to v3",
    "Tailwind migration",
    "Tailwind converter",
    "Tailwind upgrade tool",
    "className converter",
    "Tailwind classes",
    "CSS migration tool",
  ],
  authors: [{ name: "Kowshik Kuri", url: "https://kowshikkuri.com" }],
  creator: "Kowshik Kuri",
  publisher: "Kowshik Kuri",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    creator: "@kowshikkuri",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "developer-tools",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 font-sans">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
