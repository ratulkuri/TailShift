export interface PluginHandling {
  /** Emit `@plugin "name";` for this. */
  emit?: string;
  /** Drop entirely with a note (e.g., built-in in v4). */
  drop?: boolean;
  /** Note to surface to the user. */
  note?: string;
  /** Warning level vs informational. */
  level?: "info" | "warning";
}

export const KNOWN_PLUGINS: Record<string, PluginHandling> = {
  "@tailwindcss/forms": {
    emit: "@tailwindcss/forms",
  },
  "@tailwindcss/typography": {
    emit: "@tailwindcss/typography",
  },
  "@tailwindcss/aspect-ratio": {
    drop: true,
    note:
      "Dropped @tailwindcss/aspect-ratio — aspect ratio utilities are built into Tailwind v4.",
  },
  "@tailwindcss/container-queries": {
    drop: true,
    note:
      "Dropped @tailwindcss/container-queries — container queries are built into Tailwind v4.",
  },
  "@tailwindcss/line-clamp": {
    drop: true,
    note:
      "Dropped @tailwindcss/line-clamp — line-clamp utilities are built into Tailwind v4.",
  },
  "tailwindcss-animate": {
    emit: "tw-animate-css",
    note:
      "Replaced tailwindcss-animate with tw-animate-css (the v4-compatible community port). Install it: npm i -D tw-animate-css.",
    level: "warning",
  },
};
