import { tokenize, stringifyToken, Token } from "./tokenize";
import {
  SCALE_RENAMES_V3_TO_V4,
  PREFIX_RENAMES_V3_TO_V4,
  FLEX_EXACT_V3_TO_V4,
  OPACITY_FAMILIES,
} from "./rules";

export type ConvertResult = {
  output: string;
  changes: Change[];
  notes: string[];
};

export type Change = {
  from: string;
  to: string;
  reason: string;
};

const SCALE_MAP = new Map(SCALE_RENAMES_V3_TO_V4.map((r) => [r.from, r]));
const FLEX_MAP = new Map(FLEX_EXACT_V3_TO_V4.map((r) => [r.from, r]));

export function convertV3toV4(input: string): ConvertResult {
  const tokens = tokenize(input);
  const changes: Change[] = [];
  const notes = new Set<string>();

  // Phase 1: transform individual utilities (renames, prefix renames, arbitrary value syntax).
  for (const t of tokens) {
    if (!t.utility) continue;
    const original = t.utility;

    // Exact scale renames.
    const scaleRule = SCALE_MAP.get(t.utility);
    if (scaleRule) {
      t.utility = scaleRule.to;
      if (scaleRule.note) notes.add(scaleRule.note);
    }

    // Flex exact.
    if (t.utility === original) {
      const flexRule = FLEX_MAP.get(t.utility);
      if (flexRule) t.utility = flexRule.to;
    }

    // Prefix renames.
    if (t.utility === original) {
      for (const p of PREFIX_RENAMES_V3_TO_V4) {
        if (t.utility.startsWith(p.fromPrefix)) {
          t.utility = p.toPrefix + t.utility.slice(p.fromPrefix.length);
          break;
        }
      }
    }

    // CSS variable arbitrary value: bg-[--var] -> bg-(--var)
    t.utility = t.utility.replace(/\[(--[A-Za-z0-9_-]+)\]/g, "($1)");

    if (t.utility !== original) {
      changes.push({ from: original, to: t.utility, reason: "v3 → v4 rename" });
    }
  }

  // Phase 2: merge opacity utilities (bg-opacity-50 + bg-red-500 -> bg-red-500/50).
  mergeOpacity(tokens, changes);

  // Stringify with v4-style important suffix.
  const output = tokens.map((t) => stringifyToken(t, "suffix")).join("");

  return { output, changes, notes: Array.from(notes) };
}

function mergeOpacity(tokens: Token[], changes: Change[]) {
  for (const fam of OPACITY_FAMILIES) {
    const opacityPattern = new RegExp(`^${fam}-opacity-(.+)$`);
    const colorPattern = new RegExp(`^${fam}-(?!opacity-)(.+)$`);

    // Group tokens by variant-set so we only merge utilities applied together.
    const groups = new Map<string, Token[]>();
    for (const t of tokens) {
      if (!t.utility) continue;
      const key = t.variants.join(":") + "|" + (t.important ? "!" : "");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    for (const group of groups.values()) {
      const opacityTok = group.find((t) => opacityPattern.test(t.utility));
      if (!opacityTok) continue;
      const opMatch = opacityTok.utility.match(opacityPattern)!;
      const opValue = opMatch[1];

      const colorTok = group.find(
        (t) => t !== opacityTok && colorPattern.test(t.utility) && !t.utility.includes("/")
      );
      if (!colorTok) continue;

      const original = colorTok.utility;
      colorTok.utility = `${colorTok.utility}/${opValue}`;
      changes.push({
        from: `${original} + ${opacityTok.utility}`,
        to: colorTok.utility,
        reason: `${fam} opacity merged into modifier syntax`,
      });
      // Blank out the opacity token by clearing its utility; we'll strip its whitespace too.
      opacityTok.utility = "";
      opacityTok.raw = "";
    }
  }
  // Remove blanked tokens and collapse double whitespace.
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].raw === "" && tokens[i].utility === "") {
      tokens.splice(i, 1);
      // Collapse a now-adjacent whitespace pair.
      if (
        i > 0 &&
        i < tokens.length &&
        !tokens[i - 1].utility &&
        !tokens[i].utility
      ) {
        tokens.splice(i, 1);
      }
    }
  }
}
