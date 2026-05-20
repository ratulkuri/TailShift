import { tokenize, stringifyToken, Token } from "./tokenize";
import { SCALE_RENAMES_V3_TO_V4, PREFIX_RENAMES_V3_TO_V4, FLEX_EXACT_V3_TO_V4 } from "./rules";
import type { Change, ConvertResult } from "./v3-to-v4";

const SCALE_REVERSE = new Map(SCALE_RENAMES_V3_TO_V4.map((r) => [r.to, r.from]));
const FLEX_REVERSE = new Map(FLEX_EXACT_V3_TO_V4.map((r) => [r.to, r.from]));

export function convertV4toV3(input: string): ConvertResult {
  const tokens = tokenize(input);
  const changes: Change[] = [];
  const notes: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.utility) continue;
    const original = t.utility;

    // Exact scale reverse.
    const scaleBack = SCALE_REVERSE.get(t.utility);
    if (scaleBack) t.utility = scaleBack;

    // Flex reverse.
    if (t.utility === original) {
      const flexBack = FLEX_REVERSE.get(t.utility);
      if (flexBack) t.utility = flexBack;
    }

    // Prefix reverse.
    if (t.utility === original) {
      for (const p of PREFIX_RENAMES_V3_TO_V4) {
        if (t.utility.startsWith(p.toPrefix) && !t.utility.startsWith(p.fromPrefix)) {
          // Only swap if this looks like the renamed form (e.g., grow-0, shrink-2).
          if (/^\w+-\w/.test(t.utility) && (p.toPrefix === "grow-" || p.toPrefix === "shrink-")) {
            t.utility = p.fromPrefix + t.utility.slice(p.toPrefix.length);
            break;
          }
        }
      }
    }

    // CSS variable arbitrary value: bg-(--var) -> bg-[--var]
    t.utility = t.utility.replace(/\((--[A-Za-z0-9_-]+)\)/g, "[$1]");

    // Opacity-modifier expansion: bg-red-500/50 -> bg-red-500 + bg-opacity-50
    const slashMatch = t.utility.match(/^([a-z]+)-([A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*)\/(\d+)$/);
    if (slashMatch) {
      const fam = slashMatch[1];
      const value = slashMatch[2];
      const op = slashMatch[3];
      const baseUtil = `${fam}-${value}`;
      const opacityUtil = `${fam}-opacity-${op}`;

      t.utility = baseUtil;

      // Insert a space + new opacity token right after this one.
      const importantStyle = t.important ? "!" : "";
      const newToken: Token = {
        raw: "",
        variants: [...t.variants],
        important: t.important,
        utility: opacityUtil,
      };
      tokens.splice(i + 1, 0, { raw: " ", variants: [], important: false, utility: "" }, newToken);
      changes.push({
        from: original,
        to: `${baseUtil} ${opacityUtil}`,
        reason: `${fam} opacity expanded to v3 syntax`,
      });
      i += 2;
      continue;
    }

    if (t.utility !== original) {
      changes.push({ from: original, to: t.utility, reason: "v4 → v3 rename" });
    }
  }

  // Stringify with v3-style important prefix.
  const output = tokens.map((t) => stringifyToken(t, "prefix")).join("");

  return { output, changes, notes };
}

export type { ConvertResult, Change };
