/**
 * Subset of v3 default theme values that map cleanly to v4 defaults.
 * When a user references e.g. require('tailwindcss/defaultTheme').screens.lg
 * we want to recognize the value rather than copying it verbatim — v4 ships
 * the same default so we can just drop the reference.
 *
 * We don't try to be exhaustive: v4 covers the same defaults out of the box,
 * so unresolved references can usually be left alone with a note.
 */
export const DEFAULT_THEME_KEYS = new Set([
  "screens",
  "colors",
  "spacing",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "borderRadius",
  "boxShadow",
  "container",
  "transitionTimingFunction",
  "transitionDuration",
  "animation",
  "keyframes",
]);
