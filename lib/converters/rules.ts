export type Rule = {
  from: string;
  to: string;
  note?: string;
};

export const SCALE_RENAMES_V3_TO_V4: Rule[] = [
  { from: "shadow-sm", to: "shadow-xs" },
  { from: "shadow", to: "shadow-sm" },
  { from: "drop-shadow-sm", to: "drop-shadow-xs" },
  { from: "drop-shadow", to: "drop-shadow-sm" },
  { from: "blur-sm", to: "blur-xs" },
  { from: "blur", to: "blur-sm" },
  { from: "backdrop-blur-sm", to: "backdrop-blur-xs" },
  { from: "backdrop-blur", to: "backdrop-blur-sm" },
  { from: "rounded-sm", to: "rounded-xs" },
  { from: "rounded", to: "rounded-sm" },
  { from: "outline-none", to: "outline-hidden", note: "v4 outline-none now sets outline-style:none" },
  { from: "ring", to: "ring-3", note: "Default ring width changed from 3px to 1px" },
  { from: "overflow-ellipsis", to: "text-ellipsis" },
  { from: "decoration-slice", to: "box-decoration-slice" },
  { from: "decoration-clone", to: "box-decoration-clone" },
];

export const PREFIX_RENAMES_V3_TO_V4: { fromPrefix: string; toPrefix: string }[] = [
  { fromPrefix: "flex-grow-", toPrefix: "grow-" },
  { fromPrefix: "flex-shrink-", toPrefix: "shrink-" },
];

export const FLEX_EXACT_V3_TO_V4: Rule[] = [
  { from: "flex-grow", to: "grow" },
  { from: "flex-shrink", to: "shrink" },
];

export const OPACITY_FAMILIES = [
  "bg",
  "text",
  "border",
  "divide",
  "ring",
  "placeholder",
  "from",
  "via",
  "to",
  "fill",
  "stroke",
  "accent",
  "caret",
  "outline",
  "decoration",
  "shadow",
] as const;

export type OpacityFamily = (typeof OPACITY_FAMILIES)[number];
