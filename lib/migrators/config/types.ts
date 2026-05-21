export interface MigrationChange {
  from: string;
  to: string;
  reason: string;
}

export interface MigrationNote {
  level: "info" | "warning";
  message: string;
}

export interface MigrationResult {
  css: string;
  changes: MigrationChange[];
  notes: MigrationNote[];
}

export type JsValue =
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" }
  | { kind: "array"; items: JsValue[] }
  | { kind: "object"; entries: Record<string, JsValue> }
  | { kind: "function"; source: string }
  | { kind: "color-ref"; color: string; shade?: string }
  | { kind: "colors-default" }
  | { kind: "default-theme" }
  | { kind: "default-theme-key"; path: string[] }
  | { kind: "unknown"; source: string };

export interface NormalizedConfig {
  themeRoot: Record<string, JsValue>;
  themeExtend: Record<string, JsValue>;
  darkMode?: JsValue;
  content?: JsValue;
  prefix?: string;
  important?: boolean | string;
  safelist?: string[];
  corePlugins?: JsValue;
  plugins: PluginRef[];
  presets: JsValue[];
  parseNotes: MigrationNote[];
}

export type PluginRef =
  | { kind: "npm"; name: string }
  | { kind: "inline"; source: string }
  | { kind: "unknown"; source: string };

export interface CssParts {
  /** raw CSS minus @tailwind directives and pre-existing @import "tailwindcss" */
  body: string;
  hadTailwindBase: boolean;
  hadTailwindComponents: boolean;
  hadTailwindUtilities: boolean;
  hadV4Import: boolean;
}
