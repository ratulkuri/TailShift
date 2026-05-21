import { KNOWN_PLUGINS } from "./plugins";
import type {
  CssParts,
  JsValue,
  MigrationChange,
  MigrationNote,
  NormalizedConfig,
} from "./types";
import type { ThemeEmit } from "./theme-to-vars";

export interface EmitInput {
  config: NormalizedConfig;
  theme: ThemeEmit;
  css: CssParts;
}

export interface EmitOutput {
  css: string;
  changes: MigrationChange[];
  notes: MigrationNote[];
}

export function emit({ config, theme, css }: EmitInput): EmitOutput {
  const changes: MigrationChange[] = [...theme.changes];
  const notes: MigrationNote[] = [...theme.notes, ...config.parseNotes];

  const lines: string[] = [];
  lines.push("/* Migrated by TailShift — Tailwind v3 → v4 */");
  lines.push("");

  // 1. @import "tailwindcss" with prefix/important options
  const importLine = buildImport(config, changes, notes);
  lines.push(importLine);
  lines.push("");

  // 2. @plugin directives
  const pluginLines = buildPlugins(config, changes, notes);
  if (pluginLines.length) {
    lines.push(...pluginLines);
    lines.push("");
  }

  // 3. @custom-variant dark
  const darkLine = buildDarkVariant(config, changes, notes);
  if (darkLine) {
    lines.push(darkLine);
    lines.push("");
  }

  // 4. @source for safelist + unusual content
  const sourceLines = buildSources(config, changes, notes);
  if (sourceLines.length) {
    lines.push(...sourceLines);
    lines.push("");
  }

  // 5. @theme block
  if (theme.themeLines.length) {
    lines.push("@theme {");
    for (const ln of theme.themeLines) lines.push(`  ${ln}`);
    lines.push("}");
    lines.push("");
  }

  // 6. Preserved user CSS body
  if (css.body.trim()) {
    lines.push("/* --- preserved from your v3 globals.css --- */");
    lines.push(css.body.trim());
    lines.push("");
  }

  // 7. @keyframes blocks
  if (theme.keyframeBlocks.length) {
    lines.push(...theme.keyframeBlocks);
    lines.push("");
  }

  // 8. presets / unhandled
  emitPresetsNote(config, notes);

  // 9. PostCSS reminder
  notes.push({
    level: "info",
    message:
      "Update postcss.config.js: replace `tailwindcss: {}` and `autoprefixer: {}` with `'@tailwindcss/postcss': {}` — autoprefixer is included.",
  });
  notes.push({
    level: "info",
    message:
      "Install v4 deps: `npm i -D tailwindcss@^4 @tailwindcss/postcss` and remove the old `tailwindcss` v3.",
  });

  return { css: lines.join("\n").replace(/\n{3,}/g, "\n\n"), changes, notes };
}

function buildImport(
  config: NormalizedConfig,
  _changes: MigrationChange[],
  notes: MigrationNote[],
): string {
  const opts: string[] = [];
  if (config.prefix) opts.push(`prefix(${config.prefix})`);
  if (config.important === true) opts.push("important");

  // corePlugins.preflight: false → import without preflight
  const preflightDisabled = isPreflightDisabled(config.corePlugins);
  if (preflightDisabled) {
    notes.push({
      level: "info",
      message:
        "corePlugins.preflight was disabled — emitted split imports without preflight.",
    });
    const tail = opts.length ? ` ${opts.join(" ")}` : "";
    return [
      `@layer theme, base, components, utilities;`,
      `@import "tailwindcss/theme" layer(theme)${tail};`,
      `@import "tailwindcss/utilities" layer(utilities)${tail};`,
    ].join("\n");
  }

  if (typeof config.important === "string") {
    notes.push({
      level: "warning",
      message: `important: "${config.important}" (scoped) has no direct v4 equivalent. Wrap utilities in a selector layer manually.`,
    });
  }

  return `@import "tailwindcss"${opts.length ? " " + opts.join(" ") : ""};`;
}

function isPreflightDisabled(value?: JsValue): boolean {
  if (!value) return false;
  if (value.kind === "object") {
    const p = value.entries.preflight;
    if (p && p.kind === "boolean") return p.value === false;
  }
  return false;
}

function buildPlugins(
  config: NormalizedConfig,
  changes: MigrationChange[],
  notes: MigrationNote[],
): string[] {
  const out: string[] = [];
  for (const plugin of config.plugins) {
    if (plugin.kind === "npm") {
      const handling = KNOWN_PLUGINS[plugin.name];
      if (handling?.drop) {
        notes.push({ level: handling.level ?? "info", message: handling.note ?? `Dropped ${plugin.name}.` });
        changes.push({ from: `plugins: require("${plugin.name}")`, to: "(dropped)", reason: handling.note ?? "Built into v4." });
        continue;
      }
      const emitName = handling?.emit ?? plugin.name;
      out.push(`@plugin "${emitName}";`);
      if (handling?.note) {
        notes.push({ level: handling.level ?? "info", message: handling.note });
      }
      changes.push({
        from: `plugins: require("${plugin.name}")`,
        to: `@plugin "${emitName}";`,
        reason: handling?.note ?? "Plugin moved to v4 @plugin directive.",
      });
    } else if (plugin.kind === "inline") {
      notes.push({
        level: "warning",
        message:
          "Found an inline `plugin(function({ addUtilities, ... }))` — v4 plugins use the same JS API but you must extract it to a file and reference via `@plugin \"./your-plugin\"`. Original kept below as a comment.",
      });
      out.push(`/* inline plugin — extract to a file and use @plugin "./path.js":\n${indentComment(plugin.source)}\n*/`);
    } else {
      notes.push({
        level: "warning",
        message: `Unrecognized plugin entry: ${plugin.source}. Review manually.`,
      });
    }
  }
  return out;
}

function indentComment(source: string): string {
  return source
    .split("\n")
    .map((l) => `   ${l}`)
    .join("\n");
}

function buildDarkVariant(
  config: NormalizedConfig,
  changes: MigrationChange[],
  _notes: MigrationNote[],
): string | null {
  const v = config.darkMode;
  if (!v) return null;
  if (v.kind === "string") {
    if (v.value === "media") return null;
    if (v.value === "class") {
      changes.push({
        from: 'darkMode: "class"',
        to: "@custom-variant dark (&:where(.dark, .dark *));",
        reason: "v4 expresses dark mode as a custom variant.",
      });
      return "@custom-variant dark (&:where(.dark, .dark *));";
    }
    if (v.value === "selector") {
      changes.push({
        from: 'darkMode: "selector"',
        to: "@custom-variant dark (&:where(.dark, .dark *));",
        reason: "v4 expresses dark mode as a custom variant.",
      });
      return "@custom-variant dark (&:where(.dark, .dark *));";
    }
  }
  if (v.kind === "array") {
    // ['selector', '.theme-dark'] or ['class', '[data-theme="dark"]']
    const [mode, selector] = v.items;
    if ((mode?.kind === "string") && selector?.kind === "string") {
      const sel = selector.value;
      const variant = `@custom-variant dark (&:where(${sel}, ${sel} *));`;
      changes.push({
        from: `darkMode: ["${mode.value}", "${sel}"]`,
        to: variant,
        reason: "v4 dark mode with custom selector.",
      });
      return variant;
    }
  }
  return null;
}

function buildSources(
  config: NormalizedConfig,
  changes: MigrationChange[],
  notes: MigrationNote[],
): string[] {
  const out: string[] = [];
  if (config.safelist && config.safelist.length) {
    out.push(`@source inline("${config.safelist.join(" ")}");`);
    changes.push({
      from: `safelist: [${config.safelist.length} entries]`,
      to: `@source inline("...");`,
      reason: "Safelist migrated to v4 @source inline.",
    });
  }
  // content[] paths: v4 auto-detects. Warn if user listed unusual paths.
  if (config.content) {
    notes.push({
      level: "info",
      message:
        "`content` paths are no longer needed in v4 — auto content detection covers most projects. If you import classes from outside your source tree (e.g., node_modules), add `@source \"../path/**/*.tsx\";` lines manually.",
    });
  }
  return out;
}

function emitPresetsNote(config: NormalizedConfig, notes: MigrationNote[]) {
  if (config.presets.length) {
    notes.push({
      level: "warning",
      message:
        "Found `presets: [...]` — v4 has no direct preset mechanism. Inline the preset's theme values into this file, or share them via a separate `@import`-able CSS file.",
    });
  }
}
