import { emit } from "./emit";
import { parseConfig } from "./parse-config";
import { parseCss } from "./parse-css";
import { themeToVars } from "./theme-to-vars";
import type { MigrationResult } from "./types";

export type { MigrationChange, MigrationNote, MigrationResult } from "./types";

export interface MigrateInput {
  configSource: string;
  cssSource: string;
}

export function migrateConfig(input: MigrateInput): MigrationResult {
  const config = parseConfig(input.configSource);
  const theme = themeToVars(config.themeRoot, config.themeExtend);
  const cssParse = parseCss(input.cssSource);

  const emitted = emit({ config, theme, css: cssParse.parts });

  return {
    css: emitted.css,
    changes: [...cssParse.changes, ...emitted.changes],
    notes: [...cssParse.notes, ...emitted.notes],
  };
}
