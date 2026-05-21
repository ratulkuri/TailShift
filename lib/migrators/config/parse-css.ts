import type { CssParts, MigrationChange, MigrationNote } from "./types";

export interface CssParseResult {
  parts: CssParts;
  changes: MigrationChange[];
  notes: MigrationNote[];
}

/**
 * Strip v3 directives from a globals.css. Preserve everything else verbatim.
 * Also normalize whitespace lightly.
 */
export function parseCss(source: string): CssParseResult {
  const changes: MigrationChange[] = [];
  const notes: MigrationNote[] = [];

  let body = source;
  let hadTailwindBase = false;
  let hadTailwindComponents = false;
  let hadTailwindUtilities = false;
  let hadV4Import = false;

  // Detect v4 import already present
  if (/@import\s+["']tailwindcss["']/i.test(body)) {
    hadV4Import = true;
  }

  // Strip @tailwind directives (v3)
  body = body.replace(/@tailwind\s+base\s*;\s*/gi, () => {
    hadTailwindBase = true;
    return "";
  });
  body = body.replace(/@tailwind\s+components\s*;\s*/gi, () => {
    hadTailwindComponents = true;
    return "";
  });
  body = body.replace(/@tailwind\s+utilities\s*;\s*/gi, () => {
    hadTailwindUtilities = true;
    return "";
  });
  body = body.replace(/@tailwind\s+screens\s*;\s*/gi, "");

  if (hadTailwindBase || hadTailwindComponents || hadTailwindUtilities) {
    changes.push({
      from: "@tailwind base; @tailwind components; @tailwind utilities;",
      to: `@import "tailwindcss";`,
      reason: "v3 @tailwind directives collapsed into the single v4 import.",
    });
  }

  // Strip pre-existing v4 import (we will emit our own)
  body = body.replace(/@import\s+["']tailwindcss["'][^;]*;\s*/gi, "");

  // Rewrite theme('foo.bar.baz') → var(--foo-bar-baz) for known mappings
  body = rewriteThemeCalls(body, changes, notes);

  // Detect @layer utilities { .foo { ... } } and suggest @utility
  if (/@layer\s+utilities\s*{/i.test(body)) {
    notes.push({
      level: "info",
      message:
        "Found `@layer utilities { ... }`. In v4, prefer the new `@utility name { ... }` directive — your existing block still works.",
    });
  }

  // Strip empty leading newlines
  body = body.replace(/^\s+/, "").replace(/\s+$/, "\n");

  return {
    parts: {
      body,
      hadTailwindBase,
      hadTailwindComponents,
      hadTailwindUtilities,
      hadV4Import,
    },
    changes,
    notes,
  };
}

const THEME_GROUP_TO_PREFIX: Record<string, string> = {
  colors: "color",
  spacing: "spacing",
  screens: "breakpoint",
  fontFamily: "font",
  fontWeight: "font-weight",
  letterSpacing: "tracking",
  lineHeight: "leading",
  borderRadius: "radius",
  boxShadow: "shadow",
  dropShadow: "drop-shadow",
  blur: "blur",
  backdropBlur: "backdrop-blur",
  fontSize: "text",
  animation: "animate",
  container: "container",
  transitionDuration: "duration",
  transitionTimingFunction: "ease",
};

function rewriteThemeCalls(
  source: string,
  changes: MigrationChange[],
  _notes: MigrationNote[],
): string {
  return source.replace(/theme\(\s*(['"])([^'"]+)\1\s*(?:,\s*[^)]+)?\)/g, (match, _q, path: string) => {
    const segments = path
      .split(/[.\[\]]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length === 0) return match;
    const head = segments[0];
    const prefix = THEME_GROUP_TO_PREFIX[head];
    if (!prefix) return match;
    const rest = segments.slice(1).filter((s) => s !== "DEFAULT");
    const varName = rest.length ? `--${prefix}-${rest.join("-")}` : `--${prefix}`;
    const replacement = `var(${varName})`;
    changes.push({
      from: match,
      to: replacement,
      reason: "theme() rewritten to v4 CSS variable.",
    });
    return replacement;
  });
}
