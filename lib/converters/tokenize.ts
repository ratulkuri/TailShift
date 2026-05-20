export type Token = {
  raw: string;
  variants: string[];
  important: boolean;
  utility: string;
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const parts = input.split(/(\s+)/);
  for (const part of parts) {
    if (!part.trim()) {
      tokens.push({ raw: part, variants: [], important: false, utility: "" });
      continue;
    }
    tokens.push(parseClass(part));
  }
  return tokens;
}

function parseClass(cls: string): Token {
  const segments = splitOnUnnestedColon(cls);
  const last = segments.pop() ?? "";
  const variants = segments;

  let utility = last;
  let important = false;
  if (utility.startsWith("!")) {
    important = true;
    utility = utility.slice(1);
  } else if (utility.endsWith("!")) {
    important = true;
    utility = utility.slice(0, -1);
  }

  return { raw: cls, variants, important, utility };
}

function splitOnUnnestedColon(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of input) {
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ":" && depth === 0) {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  out.push(buf);
  return out;
}

export function stringifyToken(t: Token, importantStyle: "prefix" | "suffix"): string {
  if (!t.utility) return t.raw;
  const utilWithBang = t.important
    ? importantStyle === "prefix"
      ? `!${t.utility}`
      : `${t.utility}!`
    : t.utility;
  return [...t.variants, utilWithBang].join(":");
}
