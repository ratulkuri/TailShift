import type { JsValue, MigrationChange, MigrationNote } from "./types";

export interface ThemeEmit {
  /** Lines inside @theme block, one per variable. */
  themeLines: string[];
  /** Top-level @keyframes blocks. */
  keyframeBlocks: string[];
  changes: MigrationChange[];
  notes: MigrationNote[];
}

interface KeyMap {
  /** v4 CSS variable prefix without trailing dash (e.g. "color", "spacing"). Empty = skip key. */
  prefix: string;
  /** If true, key is a single ramp (DEFAULT mapped to the prefix alone). */
  ramp?: boolean;
  /** Special handler for unusual shapes (e.g., fontSize tuples, keyframes). */
  handler?: (
    value: JsValue,
    isExtend: boolean,
    out: ThemeEmit,
    pushDefault: () => void,
  ) => void;
}

const KEY_MAP: Record<string, KeyMap> = {
  colors: { prefix: "color" },
  spacing: { prefix: "spacing", ramp: true },
  screens: { prefix: "breakpoint" },
  fontFamily: { prefix: "font" },
  fontWeight: { prefix: "font-weight" },
  letterSpacing: { prefix: "tracking" },
  lineHeight: { prefix: "leading" },
  borderRadius: { prefix: "radius" },
  boxShadow: { prefix: "shadow" },
  dropShadow: { prefix: "drop-shadow" },
  blur: { prefix: "blur" },
  backdropBlur: { prefix: "backdrop-blur" },
  container: { prefix: "container" },
  transitionDuration: { prefix: "duration" },
  transitionTimingFunction: { prefix: "ease" },
  fontSize: { prefix: "text", handler: emitFontSize },
  animation: { prefix: "animate" },
  keyframes: { prefix: "", handler: emitKeyframes },
};

const RESETTABLE_PREFIXES = new Set([
  "color",
  "spacing",
  "breakpoint",
  "font",
  "font-weight",
  "tracking",
  "leading",
  "radius",
  "shadow",
  "drop-shadow",
  "blur",
  "backdrop-blur",
  "container",
  "duration",
  "ease",
  "text",
  "animate",
]);

/**
 * Convert root + extend theme tables into v4 @theme variables + top-level @keyframes.
 */
export function themeToVars(
  themeRoot: Record<string, JsValue>,
  themeExtend: Record<string, JsValue>,
): ThemeEmit {
  const out: ThemeEmit = {
    themeLines: [],
    keyframeBlocks: [],
    changes: [],
    notes: [],
  };

  // root keys: emit reset (--prefix-*: initial) first, then values
  for (const [key, value] of Object.entries(themeRoot)) {
    emitKey(key, value, false, out);
  }
  // extend keys: just append values
  for (const [key, value] of Object.entries(themeExtend)) {
    emitKey(key, value, true, out);
  }
  return out;
}

function emitKey(key: string, value: JsValue, isExtend: boolean, out: ThemeEmit) {
  const map = KEY_MAP[key];
  if (!map) {
    out.notes.push({
      level: "info",
      message: `Theme key "${key}" has no direct v4 mapping — preserved as a CSS custom property if static.`,
    });
    // best-effort: emit as `--<key>-*` if it's a flat object
    fallbackEmit(key, value, out);
    return;
  }
  if (map.handler) {
    map.handler(value, isExtend, out, () => pushReset(map.prefix, key, isExtend, out));
    return;
  }
  // Reset for root (non-extend) keys so we replicate v3 "replace defaults" semantics
  if (!isExtend && map.prefix && RESETTABLE_PREFIXES.has(map.prefix)) {
    pushReset(map.prefix, key, isExtend, out);
  }
  emitGenericValue(map.prefix, value, map.ramp ?? false, out, key);
}

function pushReset(
  prefix: string,
  key: string,
  isExtend: boolean,
  out: ThemeEmit,
) {
  if (isExtend) return;
  out.themeLines.push(`--${prefix}-*: initial;`);
  out.changes.push({
    from: `theme.${key}`,
    to: `--${prefix}-*: initial; (root override)`,
    reason: "Root theme key replaces v4 defaults — reset added before custom values.",
  });
}

function emitGenericValue(
  prefix: string,
  value: JsValue,
  ramp: boolean,
  out: ThemeEmit,
  ownerKey: string,
) {
  if (value.kind !== "object") {
    if (ramp && (value.kind === "string" || value.kind === "number")) {
      out.themeLines.push(`--${prefix}: ${formatScalar(value)};`);
      out.changes.push({
        from: `theme.${ownerKey}`,
        to: `--${prefix}`,
        reason: "Scalar ramp value migrated to v4 token.",
      });
    } else {
      out.notes.push({
        level: "warning",
        message: `theme.${ownerKey} was not an object — skipped. Got: ${describe(value)}`,
      });
    }
    return;
  }
  walkObject(value, [], (path, leaf) => {
    const name = buildVarName(prefix, path);
    const formatted = formatLeaf(leaf, prefix, ownerKey, out);
    if (formatted == null) return;
    out.themeLines.push(`--${name}: ${formatted};`);
  });
}

function walkObject(
  value: JsValue,
  path: string[],
  visit: (path: string[], leaf: JsValue) => void,
) {
  if (value.kind === "object") {
    for (const [k, v] of Object.entries(value.entries)) {
      walkObject(v, [...path, k], visit);
    }
  } else {
    visit(path, value);
  }
}

function buildVarName(prefix: string, path: string[]): string {
  const parts = path.filter((p) => p !== "DEFAULT");
  if (parts.length === 0) return prefix;
  return `${prefix}-${parts.map(slug).join("-")}`;
}

function slug(part: string): string {
  return part
    .toString()
    .replace(/\./g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function formatScalar(value: JsValue): string {
  if (value.kind === "string") return value.value;
  if (value.kind === "number") return String(value.value);
  return "";
}

function formatLeaf(
  leaf: JsValue,
  prefix: string,
  ownerKey: string,
  out: ThemeEmit,
): string | null {
  switch (leaf.kind) {
    case "string":
      return leaf.value;
    case "number":
      return String(leaf.value);
    case "array": {
      // fontFamily-style array: join with commas
      const parts: string[] = [];
      for (const item of leaf.items) {
        if (item.kind === "string") parts.push(item.value);
        else if (item.kind === "default-theme-key") parts.push(`/* ${item.path.join(".")} */`);
        else parts.push(`/* ${describe(item)} */`);
      }
      return parts.join(", ");
    }
    case "color-ref": {
      const v4 = leaf.shade ? `var(--color-${leaf.color}-${leaf.shade})` : `var(--color-${leaf.color})`;
      return v4;
    }
    case "default-theme-key":
      out.notes.push({
        level: "info",
        message: `theme.${ownerKey}: referenced defaultTheme.${leaf.path.join(".")} — value preserved by v4 defaults.`,
      });
      return null;
    case "unknown":
      out.notes.push({
        level: "warning",
        message: `theme.${ownerKey}: could not statically resolve "${leaf.source}". Skipped.`,
      });
      return null;
    case "function":
      out.notes.push({
        level: "warning",
        message: `theme.${ownerKey} used a function — v4 @theme is static. Move to CSS or convert manually.`,
      });
      return null;
    default:
      void prefix;
      return null;
  }
}

function emitFontSize(
  value: JsValue,
  isExtend: boolean,
  out: ThemeEmit,
  pushDefault: () => void,
) {
  if (!isExtend) pushDefault();
  if (value.kind !== "object") return;
  for (const [name, entry] of Object.entries(value.entries)) {
    const key = name === "DEFAULT" ? "text" : `text-${slug(name)}`;
    if (entry.kind === "string") {
      out.themeLines.push(`--${key}: ${entry.value};`);
      continue;
    }
    if (entry.kind === "array") {
      const [size, meta] = entry.items;
      if (size && (size.kind === "string" || size.kind === "number")) {
        out.themeLines.push(`--${key}: ${formatScalar(size)};`);
      }
      if (meta && meta.kind === "object") {
        const lh = meta.entries.lineHeight;
        const ls = meta.entries.letterSpacing;
        const fw = meta.entries.fontWeight;
        if (lh && (lh.kind === "string" || lh.kind === "number")) {
          out.themeLines.push(`--${key}--line-height: ${formatScalar(lh)};`);
        }
        if (ls && (ls.kind === "string" || ls.kind === "number")) {
          out.themeLines.push(`--${key}--letter-spacing: ${formatScalar(ls)};`);
        }
        if (fw && (fw.kind === "string" || fw.kind === "number")) {
          out.themeLines.push(`--${key}--font-weight: ${formatScalar(fw)};`);
        }
      } else if (meta && meta.kind === "string") {
        out.themeLines.push(`--${key}--line-height: ${meta.value};`);
      }
      out.changes.push({
        from: `theme.fontSize.${name}`,
        to: `--${key}${meta ? " + sub-tokens" : ""}`,
        reason: "fontSize tuple split into v4 sub-tokens (--text-*--line-height, etc.).",
      });
      continue;
    }
    out.notes.push({
      level: "warning",
      message: `theme.fontSize.${name}: unsupported shape, skipped.`,
    });
  }
}

function emitKeyframes(value: JsValue, _isExtend: boolean, out: ThemeEmit) {
  if (value.kind !== "object") return;
  for (const [name, frames] of Object.entries(value.entries)) {
    if (frames.kind !== "object") continue;
    const body: string[] = [];
    for (const [step, decls] of Object.entries(frames.entries)) {
      if (decls.kind !== "object") continue;
      const declStrs: string[] = [];
      for (const [prop, v] of Object.entries(decls.entries)) {
        if (v.kind === "string" || v.kind === "number") {
          declStrs.push(`    ${kebab(prop)}: ${formatScalar(v)};`);
        }
      }
      body.push(`  ${step} {\n${declStrs.join("\n")}\n  }`);
    }
    out.keyframeBlocks.push(`@keyframes ${name} {\n${body.join("\n")}\n}`);
    out.changes.push({
      from: `theme.keyframes.${name}`,
      to: `@keyframes ${name} { ... }`,
      reason: "Keyframes emitted as top-level CSS (animation token added separately).",
    });
  }
}

function kebab(prop: string): string {
  return prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function fallbackEmit(key: string, value: JsValue, out: ThemeEmit) {
  if (value.kind !== "object") return;
  walkObject(value, [], (path, leaf) => {
    if (leaf.kind === "string" || leaf.kind === "number") {
      const name = [slug(key), ...path.filter((p) => p !== "DEFAULT").map(slug)].join("-");
      out.themeLines.push(`/* unmapped */ --${name}: ${formatScalar(leaf)};`);
    }
  });
}

function describe(value: JsValue): string {
  switch (value.kind) {
    case "string":
      return `"${value.value}"`;
    case "number":
      return String(value.value);
    case "boolean":
      return String(value.value);
    case "array":
      return `array(${value.items.length})`;
    case "object":
      return `object(${Object.keys(value.entries).length})`;
    case "function":
      return "function";
    case "color-ref":
      return value.shade ? `colors.${value.color}.${value.shade}` : `colors.${value.color}`;
    case "default-theme-key":
      return `defaultTheme.${value.path.join(".")}`;
    case "colors-default":
      return "tailwindcss/colors";
    case "default-theme":
      return "tailwindcss/defaultTheme";
    default:
      return "unknown";
  }
}
