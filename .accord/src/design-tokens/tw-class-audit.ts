/**
 * Tailwind ClassName -> Token auto-audit (Storybook "Token Override" controls)
 *
 * Usage:
 *   import src from './button.tsx?raw';
 *   const audit = autoClassControls(src);
 *   // audit.args / argTypes: mapped scale -> `Token Override · Bound` (select);
 *   //   unmapped -> `Token Override · Unmapped` (text + optional token dropdown, binding optional);
 *   //   numeric class not in design spacing scale -> `Token Override · px Tweak` (number, hints not referencing token)
 *   // audit.buildClassName(args) -> builds override class string from control values
 *   // audit.entries -> full audit (including non-token), nonTokenCount for compliance stats
 */

import spacingScale from "./spacing-scale.generated.json";

/* ================================================================== */
/*  1. Token definitions (consistent with @theme)                      */
/* ================================================================== */

const TOKEN_RADIUS: Record<string, string> = {
  none: "0px", sm: "4px", md: "6px", lg: "8px", xl: "12px", full: "9999px",
};

const TOKEN_SHADOW: Record<string, string> = {
  none: "none", xs: "xs", sm: "sm", DEFAULT: "DEFAULT", md: "md", lg: "lg",
};

const TOKEN_FONT_SIZE: Record<string, string> = {
  xs: "12px", sm: "14px", base: "16px", lg: "18px",
  xl: "20px", "2xl": "24px", "3xl": "30px",
};

const TOKEN_FONT_WEIGHT: Record<string, string> = {
  normal: "400", medium: "500", semibold: "600", bold: "700",
};

const TOKEN_OPACITY: Record<string, string> = {
  transparent: "0",
  subtle: "0.4",
  disabled: "0.5",
  muted: "0.7",
  opaque: "1",
};

const TOKEN_DURATION: Record<string, string> = {
  fast: "0.1s",
  "150": "0.15s",
  mid: "0.2s",
  slow: "0.3s",
  long: "0.5s",
  whole: "1s",
};

/** Tailwind numeric spacing -> px (same source as `spacing-scale.generated.json` / Modular seed) */
const TW_NUM_SPACING_PX: Record<string, string> = spacingScale.suffixToPx as Record<string, string>;

/** Tailwind default border radius -> px */
const TW_NUM_RADIUS_PX: Record<string, string> = {
  none: "0px", sm: "2px", DEFAULT: "4px", md: "6px",
  lg: "8px", xl: "12px", "2xl": "16px", "3xl": "24px", full: "9999px",
};

const TW_NUM_FONT_SIZE_PX: Record<string, string> = {
  xs: "12px", sm: "14px", base: "16px", lg: "18px",
  xl: "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px",
  "5xl": "48px", "6xl": "60px",
};

const TW_FONT_WEIGHT_NUM: Record<string, string> = {
  thin: "100", extralight: "200", light: "300", normal: "400",
  medium: "500", semibold: "600", bold: "700", extrabold: "800", black: "900",
};

const TW_NUM_OPACITY: Record<string, string> = {
  "0": "0", "5": "0.05", "10": "0.1", "15": "0.15", "20": "0.2",
  "25": "0.25", "30": "0.3", "35": "0.35", "40": "0.4", "45": "0.45",
  "50": "0.5", "55": "0.55", "60": "0.6", "65": "0.65", "70": "0.7",
  "75": "0.75", "80": "0.8", "85": "0.85", "90": "0.9", "95": "0.95", "100": "1",
};

const TW_NUM_DURATION_MS: Record<string, string> = {
  "0": "0s", "75": "0.075s", "100": "0.1s", "150": "0.15s",
  "200": "0.2s", "300": "0.3s", "500": "0.5s", "700": "0.7s", "1000": "1s",
};

/** Semantic color names registered in @theme (bg-primary, text-foreground, etc.) */
const SEMANTIC_COLORS = new Set([
  "background", "foreground", "card", "card-foreground",
  "popover", "popover-foreground", "primary", "primary-foreground",
  "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground",
  "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary",
  "sidebar-primary-foreground", "sidebar-accent",
  "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  "transparent", "current", "inherit", "white", "black",
]);

/* ================================================================== */
/*  2. Class name extraction                                           */
/* ================================================================== */

export function extractClasses(source: string): string[] {
  const raw: string[] = [];

  for (const m of source.matchAll(/className="([^"]+)"/g)) raw.push(m[1]);
  for (const m of source.matchAll(/className=\{`([^`]+)`\}/g)) raw.push(m[1]);

  for (const m of source.matchAll(/(?:cn|cva)\(([\s\S]*?)\n\s*\)/gm)) {
    const body = m[1];
    for (const s of body.matchAll(/"([^"]+)"/g)) raw.push(s[1]);
    for (const s of body.matchAll(/`([^`]+)`/g)) raw.push(s[1]);
  }
  for (const m of source.matchAll(/(?:cn|cva)\(([^\n)]*)\)/g)) {
    const body = m[1];
    for (const s of body.matchAll(/"([^"]+)"/g)) raw.push(s[1]);
    for (const s of body.matchAll(/`([^`]+)`/g)) raw.push(s[1]);
  }

  for (const m of source.matchAll(/:\s*"([^"]{4,})"/g)) {
    if (m[1].includes(" ") || /^[a-z]+-/.test(m[1])) raw.push(m[1]);
  }

  const all = raw.flatMap((s) =>
    s.split(/\s+/).filter((c) => c && !c.startsWith("${")),
  );
  return [...new Set(all)];
}

/* ================================================================== */
/*  3. Class name categorization & Token matching                      */
/* ================================================================== */

export type AuditCategory =
  | "spacing" | "radius" | "shadow" | "fontSize" | "fontWeight"
  | "textColor" | "bgColor" | "borderColor" | "opacity" | "duration"
  | "layout" | "other";

export type AuditEntry = {
  raw: string;
  category: AuditCategory;
  prefix: string;
  value: string;
  isToken: boolean;
  cssValue: string;
  equivalentToken: string | null;
  adjustable: boolean;
};


function parsePx(css: string): number | null {
  const m = /^([\d.]+)px$/i.exec(String(css).trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** In a given semantic token->px mapping, select the key closest to the target; when tied, prefer larger px ("nearest larger"). */
export function nearestTokenKeyPreferLarger(
  targetPx: number,
  tokens: Record<string, string>,
): string | null {
  let bestKey: string | null = null;
  let bestDist = Infinity;
  let bestPx = -Infinity;
  for (const [k, css] of Object.entries(tokens)) {
    const px = parsePx(css);
    if (px == null) continue;
    const dist = Math.abs(targetPx - px);
    if (dist < bestDist || (dist === bestDist && px > bestPx)) {
      bestKey = k;
      bestDist = dist;
      bestPx = px;
    }
  }
  return bestKey;
}

function parseCssSeconds(s: string): number | null {
  const t = String(s).trim().toLowerCase();
  const m = /^([\d.]+)s$/i.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Opacity absolute value in [0,1]; when tied, prefer the larger semantic value (more opaque side). */
function nearestOpacitySemantic(target: number): string | null {
  let bestK: string | null = null;
  let bestD = Infinity;
  let bestN = -Infinity;
  for (const [k, v] of Object.entries(TOKEN_OPACITY)) {
    const n = Number(String(v));
    if (!Number.isFinite(n)) continue;
    const d = Math.abs(target - n);
    if (d < bestD || (d === bestD && n > bestN)) {
      bestK = k;
      bestD = d;
      bestN = n;
    }
  }
  return bestK;
}

/** Animation duration nearest semantic (when tied, pick larger duration). */
function nearestDurationSemantic(targetSec: number): string | null {
  let bestK: string | null = null;
  let bestD = Infinity;
  let bestS = -Infinity;
  for (const [k, v] of Object.entries(TOKEN_DURATION)) {
    const s = parseCssSeconds(v);
    if (s == null) continue;
    const d = Math.abs(targetSec - s);
    if (d < bestD || (d === bestD && s > bestS)) {
      bestK = k;
      bestD = d;
      bestS = s;
    }
  }
  return bestK;
}

/** Font size: nearest larger on the px mapping (only for non-exact matches). */
function nearestFontSizeSemantic(targetPx: number): string | null {
  let bestKey: string | null = null;
  let bestDist = Infinity;
  let bestPx = -Infinity;
  for (const [k, cssv] of Object.entries(TOKEN_FONT_SIZE)) {
    const px = parsePx(cssv);
    if (px == null) continue;
    const d = Math.abs(targetPx - px);
    if (d < bestDist || (d === bestDist && px > bestPx)) {
      bestKey = k;
      bestDist = d;
      bestPx = px;
    }
  }
  return bestKey;
}

/** Font weight nearest semantic (when tied, pick heavier weight). */
function nearestFontWeightSemantic(target: number): string | null {
  let bestK: string | null = null;
  let bestD = Infinity;
  let bestN = -Infinity;
  for (const [k, v] of Object.entries(TOKEN_FONT_WEIGHT)) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const d = Math.abs(target - n);
    if (d < bestD || (d === bestD && n > bestN)) {
      bestK = k;
      bestD = d;
      bestN = n;
    }
  }
  return bestK;
}

function findEquivalent(
  cssVal: string,
  tokens: Record<string, string>,
): string | null {
  for (const [k, v] of Object.entries(tokens)) {
    if (v === cssVal) return k;
  }
  return null;
}

const NUMERIC_SPACING_SUFFIX = /^\d+(\.\d+)?$/;

function auditSpacingOrSizing(
  cls: string,
  prefix: string,
  val: string,
): AuditEntry | null {
  const skip = new Set([
    "auto", "full", "screen", "fit", "min", "max", "prose",
  ]);
  if (skip.has(val)) return null;
  if (val.includes("/")) return null;
  if (val.startsWith("[")) return arb(cls, "spacing", prefix, val);

  if (!(val in TW_NUM_SPACING_PX)) return null;

  return {
    raw: cls,
    category: "spacing",
    prefix,
    value: val,
    isToken: true,
    cssValue: TW_NUM_SPACING_PX[val],
    equivalentToken: null,
    adjustable: true,
  };
}

/**
 * Tailwind default spacing(n)=n*0.25rem; at 16px root that's n*4px.
 * Used for px estimation and Storybook fine-tuning when scale suffix is not in design spacing-scale.
 */
function tailwindDefaultSpacingToPx(n: number): number {
  return n * 4;
}

/** Numeric scale classes (e.g. h-9, gap-7) with suffix not in `spacing-scale.generated` are treated as not referencing spacing design tokens. */
function auditNumericOutsideDesignSpacingToken(
  cls: string,
  prefix: string,
  val: string,
): AuditEntry | null {
  const skip = new Set([
    "auto", "full", "screen", "fit", "min", "max", "prose",
  ]);
  if (skip.has(val)) return null;
  if (val.includes("/")) return null;
  if (val.startsWith("[")) return null;
  if (!NUMERIC_SPACING_SUFFIX.test(val)) return null;

  const n = Number(val);
  if (!Number.isFinite(n)) return null;

  const pxNum = tailwindDefaultSpacingToPx(n);
  const cssValue = `${pxNum}px`;
  const nearest = nearestTokenKeyPreferLarger(pxNum, TW_NUM_SPACING_PX);

  return {
    raw: cls,
    category: "layout",
    prefix,
    value: val,
    isToken: false,
    cssValue,
    equivalentToken: nearest,
    adjustable: true,
  };
}

const SPACING_PREFIXES =
  /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|inset-x|inset-y|inset|top|right|bottom|left|size|min-w|max-w|min-h|max-h|w|h)-(.+)$/;
const RADIUS_RE = /^rounded(?:-(tl|tr|bl|br|t|r|b|l|s|e|ss|se|es|ee))?(?:-(.+))?$/;

export function auditClass(cls: string): AuditEntry | null {
  if (/^[\w[\]-]+:/.test(cls)) return null;
  if (cls.startsWith("-")) {
    const result = auditClass(cls.slice(1));
    if (result) return { ...result, raw: cls, prefix: "-" + result.prefix };
    return null;
  }

  // --- Spacing / sizing utilities (consistent with `@theme --spacing-{n}` numeric scale)
  const spM = cls.match(SPACING_PREFIXES);
  if (spM) {
    const [, prefix, val] = spM;
    if (prefix === "min-w" || prefix === "max-w") return null;
    const row = auditSpacingOrSizing(cls, prefix, val);
    if (row) return row;
    const layoutRow = auditNumericOutsideDesignSpacingToken(cls, prefix, val);
    if (layoutRow) return layoutRow;
  }

  // --- Border Radius ---
  const rdM = cls.match(RADIUS_RE);
  if (rdM) {
    const sub = rdM[1] ?? "";
    const val = rdM[2] ?? "DEFAULT";
    const prefix = sub ? `rounded-${sub}` : "rounded";
    if (val.startsWith("[")) return arb(cls, "radius", prefix, val);
    const cssVal =
      val in TOKEN_RADIUS
        ? TOKEN_RADIUS[val]
        : (TW_NUM_RADIUS_PX[val] ?? "?");
    const px = parsePx(cssVal);
    const exactName = findEquivalent(cssVal, TOKEN_RADIUS);
    const nearest =
      px != null ? nearestTokenKeyPreferLarger(px, TOKEN_RADIUS) : null;
    const equiv = exactName ?? nearest;
    const isToken = exactName !== null && exactName === val;
    return {
      raw: cls,
      category: "radius",
      prefix,
      value: val,
      isToken,
      cssValue: cssVal,
      equivalentToken: isToken ? null : equiv,
      adjustable: true,
    };
  }

  // --- Shadow ---
  const shM = cls.match(/^shadow(?:-(.+))?$/);
  if (shM) {
    const val = shM[1] ?? "DEFAULT";
    if (val.startsWith("[")) return arb(cls, "shadow", "shadow", val);
    const isToken = val in TOKEN_SHADOW;
    return {
      raw: cls,
      category: "shadow",
      prefix: "shadow",
      value: val,
      isToken,
      cssValue: val,
      equivalentToken: null,
      adjustable: true,
    };
  }

  // --- Font Size ---
  const fsM = cls.match(/^text-(xs|sm|base|lg|xl|[2-9]xl)$/);
  if (fsM) {
    const val = fsM[1];
    const cssVal = TW_NUM_FONT_SIZE_PX[val] ?? "?";
    const px = parsePx(cssVal);
    const exactName = findEquivalent(cssVal, TOKEN_FONT_SIZE);
    const nearest =
      px != null ? nearestFontSizeSemantic(px) : null;
    const equiv = exactName ?? nearest;
    const isToken = exactName !== null && exactName === val;
    return {
      raw: cls,
      category: "fontSize",
      prefix: "text",
      value: val,
      isToken,
      cssValue: cssVal,
      equivalentToken: isToken ? null : equiv,
      adjustable: true,
    };
  }

  // --- Font Weight ---
  const fwM = cls.match(
    /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  );
  if (fwM) {
    const val = fwM[1];
    const cssStr = TW_FONT_WEIGHT_NUM[val] ?? "?";
    const n = Number(cssStr);
    const exactName = findEquivalent(cssStr, TOKEN_FONT_WEIGHT);
    const nearest = Number.isFinite(n)
      ? nearestFontWeightSemantic(n)
      : null;
    const equiv = exactName ?? nearest;
    const isToken = exactName !== null && exactName === val;
    return {
      raw: cls,
      category: "fontWeight",
      prefix: "font",
      value: val,
      isToken,
      cssValue: cssStr,
      equivalentToken: isToken ? null : equiv,
      adjustable: true,
    };
  }

  // --- Opacity ---
  const opM = cls.match(/^opacity-(.+)$/);
  if (opM) {
    const val = opM[1];
    if (val.startsWith("[")) return arb(cls, "opacity", "opacity", val);
    if (val in TOKEN_OPACITY) {
      return {
        raw: cls,
        category: "opacity",
        prefix: "opacity",
        value: val,
        isToken: true,
        cssValue: TOKEN_OPACITY[val],
        equivalentToken: null,
        adjustable: true,
      };
    }
    const cssStr =
      val in TW_NUM_OPACITY ? TW_NUM_OPACITY[val] ?? "?" : "?";
    const n = Number(cssStr);
    const exactName =
      cssStr !== "?"
        ? findEquivalent(cssStr, TOKEN_OPACITY)
        : null;
    const nearest = Number.isFinite(n)
      ? nearestOpacitySemantic(n)
      : null;
    const equiv = exactName ?? nearest;
    const isToken = false;
    return {
      raw: cls,
      category: "opacity",
      prefix: "opacity",
      value: val,
      isToken,
      cssValue: cssStr,
      equivalentToken: equiv,
      adjustable: true,
    };
  }

  // --- Duration ---
  const duM = cls.match(/^duration-(.+)$/);
  if (duM) {
    const val = duM[1];
    if (val.startsWith("[")) return arb(cls, "duration", "duration", val);
    const cssStr =
      val in TOKEN_DURATION
        ? TOKEN_DURATION[val]
        : (TW_NUM_DURATION_MS[val] ?? "?");
    const secs = parseCssSeconds(cssStr);
    const exactName =
      cssStr !== "?" ? findEquivalent(cssStr, TOKEN_DURATION) : null;
    const nearest =
      secs != null ? nearestDurationSemantic(secs) : null;
    const equiv = exactName ?? nearest;
    const isToken = exactName !== null && exactName === val;
    return {
      raw: cls,
      category: "duration",
      prefix: "duration",
      value: val,
      isToken,
      cssValue: cssStr,
      equivalentToken: isToken ? null : equiv,
      adjustable: true,
    };
  }

  // --- Text Color ---
  const tcM = cls.match(/^text-([\w-]+?)(?:\/([\d]+))?$/);
  if (tcM && !TW_NUM_FONT_SIZE_PX[tcM[1]]) {
    const val = tcM[1];
    const isToken = SEMANTIC_COLORS.has(val) || SEMANTIC_COLORS.has(val.replace("-foreground", ""));
    return { raw: cls, category: "textColor", prefix: "text", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: true };
  }

  // --- Background Color ---
  const bgM = cls.match(/^bg-([\w-]+?)(?:\/([\d]+))?$/);
  if (bgM) {
    const val = bgM[1];
    const isToken = SEMANTIC_COLORS.has(val);
    return { raw: cls, category: "bgColor", prefix: "bg", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: true };
  }

  // --- Border Color ---
  const bcM = cls.match(/^border-([\w-]+?)(?:\/([\d]+))?$/);
  if (bcM && !["solid", "dashed", "dotted", "0", "2", "4", "8"].includes(bcM[1])) {
    const val = bcM[1];
    const isToken = SEMANTIC_COLORS.has(val);
    return { raw: cls, category: "borderColor", prefix: "border", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: true };
  }

  return null;
}

function arb(
  raw: string, category: AuditCategory, prefix: string, val: string,
): AuditEntry {
  return { raw, category, prefix, value: val, isToken: false, cssValue: val, equivalentToken: null, adjustable: false };
}

/* ================================================================== */
/*  4. Auto-generate Storybook Controls                                */
/* ================================================================== */

type CategoryMeta = {
  tokens: Record<string, string>;
  label: string;
  /** Generate className, e.g. (prefix, key) => `${prefix}-${key}` */
  makeClass: (prefix: string, key: string) => string;
};

const CATEGORY_BOUND = "Token Override · Bound";
const CATEGORY_UNMAPPED = "Token Override · Unmapped";
const CATEGORY_LAYOUT_NON_TOKEN = "Token Override · px Tweak";

function readPxArg(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function makeLayoutPxClass(prefix: string, px: number): string {
  if (!/^[\w-]+$/.test(prefix)) return "";
  return `${prefix}-[${px}px]`;
}

/** Allowed Tailwind scale suffixes / arbitrary fragments in "Unmapped" text fields (injection prevention) */
function isSafeTailwindSuffix(s: string): boolean {
  return /^[\w.[\]\/-]+$/.test(s);
}

/**
 * Tailwind utility prefix -> Controls "name" column short label (unrelated to internal args key `controlId`).
 * Unlisted prefixes fall back by category at runtime.
 */
const SPACING_PREFIX_LABEL_ZH: Record<string, string> = {
  p: "Padding (all)",
  px: "Padding (horizontal)",
  py: "Padding (vertical)",
  pt: "Padding (top)",
  pb: "Padding (bottom)",
  pl: "Padding (left)",
  pr: "Padding (right)",
  m: "Margin (all)",
  mx: "Margin (horizontal)",
  my: "Margin (vertical)",
  mt: "Margin (top)",
  mb: "Margin (bottom)",
  ml: "Margin (left)",
  mr: "Margin (right)",
  gap: "Gap",
  "gap-x": "Gap (horizontal)",
  "gap-y": "Gap (vertical)",
  "space-x": "Space X",
  "space-y": "Space Y",
  "inset-x": "Inset X",
  "inset-y": "Inset Y",
  inset: "Inset (all)",
  top: "Top offset",
  right: "Right offset",
  bottom: "Bottom offset",
  left: "Left offset",
  size: "Size (w=h)",
  w: "Width",
  h: "Height",
  "min-w": "Min width",
  "max-w": "Max width",
  "min-h": "Min height",
  "max-h": "Max height",
};

const RADIUS_PREFIX_LABEL_ZH: Record<string, string> = {
  rounded: "Border radius",
  "rounded-t": "Top border radius",
  "rounded-r": "Right border radius",
  "rounded-b": "Bottom border radius",
  "rounded-l": "Left border radius",
  "rounded-tl": "Top-left radius",
  "rounded-tr": "Top-right radius",
  "rounded-bl": "Bottom-left radius",
  "rounded-br": "Bottom-right radius",
  "rounded-ss": "Start-start radius",
  "rounded-se": "Start-end radius",
  "rounded-es": "End-start radius",
  "rounded-ee": "End-end radius",
};

const CATEGORY_FALLBACK_LABEL_ZH: Record<AuditCategory, string> = {
  spacing: "Spacing",
  layout: "Spacing",
  radius: "Border Radius",
  shadow: "Shadow",
  fontSize: "Font Size",
  fontWeight: "Font Weight",
  textColor: "Text Color",
  bgColor: "Background",
  borderColor: "Border Color",
  opacity: "Opacity",
  duration: "Duration",
  other: "Style",
};

/** Consistent with autoClassControls: Tailwind spacing/sizing prefix -> Controls name column */
export function spacingUtilityPrefixLabelZh(prefix: string): string {
  const neg = prefix.startsWith("-");
  const p = neg ? prefix.slice(1) : prefix;
  const base = SPACING_PREFIX_LABEL_ZH[p];
  if (!base) return prefix;
  return neg ? `${base} (neg)` : base;
}

function controlNameZh(entry: AuditEntry): string {
  const p = entry.prefix.startsWith("-")
    ? entry.prefix.slice(1)
    : entry.prefix;
  const neg = entry.prefix.startsWith("-");
  let title: string | undefined;
  if (entry.category === "spacing" || entry.category === "layout") {
    title = SPACING_PREFIX_LABEL_ZH[p];
  } else if (entry.category === "radius") {
    title = RADIUS_PREFIX_LABEL_ZH[entry.prefix] ?? RADIUS_PREFIX_LABEL_ZH[p];
  } else if (entry.category === "shadow") {
    title = "Shadow";
  } else if (entry.category === "fontSize") {
    title = "Font Size";
  } else if (entry.category === "fontWeight") {
    title = "Font Weight";
  } else if (entry.category === "opacity") {
    title = "Opacity";
  } else if (entry.category === "duration") {
    title = "Duration";
  } else if (entry.category === "textColor") {
    title = `Text·${entry.value}`;
  } else if (entry.category === "bgColor") {
    title = `Background·${entry.value}`;
  } else if (entry.category === "borderColor") {
    title = `Border·${entry.value}`;
  }
  if (!title) title = CATEGORY_FALLBACK_LABEL_ZH[entry.category] ?? p;
  return neg ? `${title} (neg)` : title;
}

/** Semantic color dropdown options (shared for bg-/text-/border-) */
const TOKEN_SEMANTIC_COLOR: Record<string, string> = {
  background: "Page background",
  foreground: "Default foreground",
  card: "Card background",
  "card-foreground": "Card foreground",
  popover: "Popover background",
  "popover-foreground": "Popover foreground",
  primary: "Primary",
  "primary-foreground": "Primary foreground",
  secondary: "Secondary fill",
  "secondary-foreground": "Secondary foreground",
  muted: "Muted background",
  "muted-foreground": "Muted foreground",
  accent: "Accent fill",
  "accent-foreground": "Accent foreground",
  destructive: "Destructive",
  "destructive-foreground": "Destructive foreground",
  border: "Border",
  input: "Input border",
  ring: "Focus ring",
  transparent: "Transparent",
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  spacing: {
    tokens: TW_NUM_SPACING_PX,
    label: "Spacing",
    makeClass: (p, k) =>
      k === "0" ? `${p}-0` : k === "px" ? `${p}-px` : `${p}-${k}`,
  },
  radius: {
    tokens: TOKEN_RADIUS,
    label: "Border Radius",
    makeClass: (p, k) => (k === "none" ? `${p}-none` : k === "full" ? `${p}-full` : `${p}-${k}`),
  },
  shadow: {
    tokens: TOKEN_SHADOW,
    label: "Shadow",
    makeClass: (_p, k) => (k === "none" ? "shadow-none" : k === "DEFAULT" ? "shadow" : `shadow-${k}`),
  },
  fontSize: {
    tokens: TOKEN_FONT_SIZE,
    label: "Font Size",
    makeClass: (_p, k) => `text-${k}`,
  },
  fontWeight: {
    tokens: TOKEN_FONT_WEIGHT,
    label: "Font Weight",
    makeClass: (_p, k) => `font-${k}`,
  },
  opacity: {
    tokens: TOKEN_OPACITY,
    label: "Opacity",
    makeClass: (_p, k) => `opacity-${k}`,
  },
  duration: {
    tokens: TOKEN_DURATION,
    label: "Duration",
    makeClass: (_p, k) => `duration-${k}`,
  },
  textColor: {
    tokens: TOKEN_SEMANTIC_COLOR,
    label: "Text Color",
    makeClass: (_p, k) => `text-${k}`,
  },
  bgColor: {
    tokens: TOKEN_SEMANTIC_COLOR,
    label: "Background Color",
    makeClass: (_p, k) => `bg-${k}`,
  },
  borderColor: {
    tokens: TOKEN_SEMANTIC_COLOR,
    label: "Border Color",
    makeClass: (_p, k) => `border-${k}`,
  },
};

function makeLabels(
  tokens: Record<string, string>,
  equivalentToken: string | null,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) {
    let lbl = `${k} · ${v}`;
    if (equivalentToken === k) lbl += " <- equivalent";
    labels[k] = lbl;
  }
  return labels;
}

/** Shape of Storybook `args` passed to `buildClassName` (includes runtime values from number controls) */
export type ClassOverrideArgs = Record<string, string | number | undefined>;

/** Routes token overrides from Story side to correct DOM: root `className` and (if any) `classNames` slots */
export type AutoPreviewProps = {
  className: string;
  classNames?: Record<string, string>;
  /**
   * Override classes on the 2nd and subsequent `className={cn(` slots in source (order matches `extractClassNameCnBodiesWithStart`);
   * The 1st slot merges into `className`. Only present when multiple `className={cn(` exist in the file.
   */
  previewCnSlotOverrides?: string[];
};

export type AutoControlsResult = {
  entries: AuditEntry[];
  /** Compatible with Meta.args: all string */
  args: Record<string, string>;
  argTypes: Record<string, unknown>;
  buildClassName: (runtimeArgs: ClassOverrideArgs) => string;
  /**
   * Routes `buildClassName` fragments by source `classNames.xxx: cn(...)` / root `className={cn(...)}`,
   * preventing `gap-*` etc. from being added to root when the actual style is on `classNames.month` (avoids "control changed but no effect").
   */
  buildPreview: (runtimeArgs: ClassOverrideArgs) => AutoPreviewProps;
  resolveArgTypes: (runtimeArgs: ClassOverrideArgs) => Record<string, unknown>;
  /** Total non-token entry count */
  nonTokenCount: number;
};

/** For Story destructuring: `{...spreadAutoPreviewProps(audit, args)}` */
export function spreadAutoPreviewProps(
  audit: AutoControlsResult,
  args: ClassOverrideArgs,
): {
  className?: string;
  classNames?: Record<string, string>;
  previewCnSlotOverrides?: string[];
} {
  const p = audit.buildPreview(args);
  const out: {
    className?: string;
    classNames?: Record<string, string>;
    previewCnSlotOverrides?: string[];
  } = {};
  if (p.className.trim()) out.className = p.className;
  if (p.classNames && Object.keys(p.classNames).length > 0) out.classNames = p.classNames;
  if (p.previewCnSlotOverrides?.some((s) => s.trim())) {
    out.previewCnSlotOverrides = p.previewCnSlotOverrides;
  }
  return out;
}

const PREVIEW_ROOT = "__root__";

type ClassNamesObjectSlice = { absInnerStart: number; inner: string };

/** `classNames={{ ... }}` inner object literal content (excluding wrapping `{` `}`) and its start position in source */
function sliceClassNamesObjectInner(source: string): ClassNamesObjectSlice | null {
  const o = source.indexOf("classNames={");
  if (o < 0) return null;
  let i = o + "classNames={".length;
  while (i < source.length && /\s/.test(source[i]!)) i++;
  if (source[i] !== "{") return null;
  i++;
  const absInnerStart = i;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const c = source[i]!;
    if (c === "{") depth++;
    else if (c === "}") depth--;
    if (depth === 0) break;
    i++;
  }
  return { absInnerStart, inner: source.slice(absInnerStart, i) };
}

/** `classNames` `key: cn( ... )` slot cn parameter ranges in source (absolute indices) */
function extractClassNamesSlotRegions(
  source: string,
): { key: string; innerStart: number; innerEnd: number }[] {
  const sl = sliceClassNamesObjectInner(source);
  if (!sl) return [];
  const { absInnerStart, inner } = sl;
  const out: { key: string; innerStart: number; innerEnd: number }[] = [];
  const re = /(\w+):\s*cn\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    const relStart = m.index + m[0].length;
    let j = absInnerStart + relStart;
    let depth = 1;
    while (j < source.length && depth > 0) {
      const c = source[j]!;
      if (c === "(") depth++;
      else if (c === ")") depth--;
      j++;
    }
    out.push({
      key: m[1],
      innerStart: absInnerStart + relStart,
      innerEnd: j - 1,
    });
  }
  return out;
}

/** All `className={cn( ... )}` cn parameter bodies and start indices in source */
function extractClassNameCnBodiesWithStart(
  source: string,
): { start: number; body: string }[] {
  const needle = "className={cn(";
  const out: { start: number; body: string }[] = [];
  let pos = 0;
  while (pos < source.length) {
    const idx = source.indexOf(needle, pos);
    if (idx < 0) break;
    const innerStart = idx + needle.length;
    let j = innerStart;
    let depth = 1;
    while (j < source.length && depth > 0) {
      const c = source[j];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      j++;
    }
    out.push({ start: innerStart, body: source.slice(innerStart, j - 1) });
    pos = j;
  }
  return out;
}

/** Determines which `classNames` key a token slot should map to based on source, otherwise falls back to root `className` / Nth `className={cn(` */
function inferTokenPreviewSlot(source: string, entry: AuditEntry): string {
  const raw = entry.raw;
  const regions = extractClassNamesSlotRegions(source);
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i];
    if (source.slice(r.innerStart, r.innerEnd).includes(raw)) return r.key;
  }
  const bodies = extractClassNameCnBodiesWithStart(source);
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].body.includes(raw)) {
      return bodies.length === 1 || i === 0 ? PREVIEW_ROOT : `__cn_${i}`;
    }
  }
  return PREVIEW_ROOT;
}

/** `autoClassControls` optional configuration */
export type AutoClassControlsOptions = {
  /**
   * Tailwind **prefixes** not generated in Storybook Controls (e.g. `w`, `h`, `rounded`).
   * For track/thumb sizes, pill radius, etc. locked by implementation that designers should not remap spacing/shadow tokens.
   */
  hidePrefixes?: string[];
  /**
   * Regex pattern list (corresponds to spec.json styleLock.blacklist[].pattern).
   * If entry.raw matches any pattern, no control is generated. More precise than hidePrefixes.
   */
  hidePatterns?: RegExp[];
};

type SlotMeta =
  | {
      mode: "mapped";
      controlId: string;
      entry: AuditEntry;
      catMeta: CategoryMeta;
      previewSlot: string;
    }
  | {
      mode: "layoutPx";
      controlId: string;
      entry: AuditEntry;
      defaultPx: number;
      previewSlot: string;
    };

export function autoClassControls(
  source: string,
  options?: AutoClassControlsOptions,
): AutoControlsResult {
  const rawClasses = extractClasses(source);
  const allEntries: AuditEntry[] = [];
  for (const cls of rawClasses) {
    const entry = auditClass(cls);
    if (entry) allEntries.push(entry);
  }

  const seen = new Set<string>();
  const adjustable: AuditEntry[] = [];
  for (const e of allEntries) {
    if (!e.adjustable) continue;
    const slotKey =
      e.category === "layout"
        ? `layout::${e.prefix}::${e.value}`
        : e.category === "fontSize" || e.category === "fontWeight"
          ? `${e.category}::${e.prefix}::${e.value}`
          : e.category === "textColor" || e.category === "bgColor" || e.category === "borderColor"
            ? `${e.category}::${e.prefix}::${e.value}`
            : `${e.category}::${e.prefix}`;
    if (seen.has(slotKey)) continue;
    seen.add(slotKey);
    adjustable.push(e);
  }

  const hide = new Set(options?.hidePrefixes ?? []);
  const hidePatterns = options?.hidePatterns ?? [];
  const adjustableForControls = adjustable.filter((e) => {
    if (hide.size && hide.has(e.prefix)) return false;
    if (hidePatterns.length && hidePatterns.some((re) => re.test(e.raw))) return false;
    return true;
  });

  const args: Record<string, string> = {};
  const argTypes: Record<string, unknown> = {};
  const slotMeta: SlotMeta[] = [];

  for (const entry of adjustableForControls) {
    if (entry.category === "layout") {
      const px = parsePx(entry.cssValue);
      if (px == null) continue;
      const controlId = `layout_${entry.prefix.replace(/-/g, "_")}_${String(entry.value).replace(/\./g, "_")}`;
      const suggest =
        entry.equivalentToken != null
          ? `\nNearest token: ${entry.equivalentToken} = ${TW_NUM_SPACING_PX[entry.equivalentToken] ?? "?"}`
          : "";
      const desc =
        `Source class ${entry.raw} ≈ ${entry.cssValue}, not bound to spacing token.${suggest}`;
      args[controlId] = String(px);
      argTypes[controlId] = {
        name: controlNameZh(entry),
        control: { type: "text" as const },
        description: desc,
        table: { category: CATEGORY_LAYOUT_NON_TOKEN },
      };
      slotMeta.push({
        mode: "layoutPx",
        controlId,
        entry,
        defaultPx: px,
        previewSlot: inferTokenPreviewSlot(source, entry),
      });
      continue;
    }

    const catMeta = CATEGORY_META[entry.category];
    if (!catMeta) continue;

    const controlId =
      entry.category === "fontSize" || entry.category === "fontWeight" ||
      entry.category === "textColor" || entry.category === "bgColor" || entry.category === "borderColor"
        ? `${entry.prefix.replace(/-/g, "_")}_${String(entry.value).replace(/[^a-zA-Z0-9]/g, "_")}`
        : entry.prefix.replace(/-/g, "_");
    const defaultKey = entry.value;
    const tokenKeys = Object.keys(catMeta.tokens);
    const labels = makeLabels(catMeta.tokens, null);

    if (entry.isToken) {
      const desc = `${catMeta.label} · aligned to design scale · ${entry.raw}`;
      args[controlId] = defaultKey;
      argTypes[controlId] = {
        name: controlNameZh(entry),
        control: { type: "select" as const, labels },
        options: [...tokenKeys],
        description: desc,
        table: { category: CATEGORY_BOUND },
      };
      slotMeta.push({
        mode: "mapped",
        controlId,
        entry,
        catMeta,
        previewSlot: inferTokenPreviewSlot(source, entry),
      });
      continue;
    }

    const allLabels: Record<string, string> = { ...labels };
    if (!tokenKeys.includes(defaultKey)) {
      allLabels[defaultKey] = `${defaultKey} (source value)`;
    }
    const options = tokenKeys.includes(defaultKey)
      ? [...tokenKeys]
      : [defaultKey, ...tokenKeys];
    const desc = `${catMeta.label} · ${entry.raw}`;

    args[controlId] = defaultKey;
    argTypes[controlId] = {
      name: controlNameZh(entry),
      control: { type: "select" as const, labels: allLabels },
      options,
      description: desc,
      table: { category: CATEGORY_UNMAPPED },
    };

    slotMeta.push({
      mode: "mapped",
      controlId,
      entry,
      catMeta,
      previewSlot: inferTokenPreviewSlot(source, entry),
    });
  }

  function emitSlotOverride(
    slot: SlotMeta,
    runtimeArgs: ClassOverrideArgs,
  ): string | null {
    if (slot.mode === "layoutPx") {
      const n = readPxArg(runtimeArgs[slot.controlId]);
      if (n == null || n === slot.defaultPx) return null;
      const cls = makeLayoutPxClass(slot.entry.prefix, n);
      return cls || null;
    }
    const selected = runtimeArgs[slot.controlId];
    if (selected == null || selected === "" || selected === slot.entry.value)
      return null;
    return slot.catMeta.makeClass(slot.entry.prefix, String(selected));
  }

  function buildClassName(runtimeArgs: ClassOverrideArgs): string {
    const parts: string[] = [];
    for (const sm of slotMeta) {
      const cls = emitSlotOverride(sm, runtimeArgs);
      if (cls) parts.push(cls);
    }
    return parts.join(" ");
  }

  function buildPreview(runtimeArgs: ClassOverrideArgs): AutoPreviewProps {
    const buckets: Record<string, string[]> = {};
    for (const sm of slotMeta) {
      const cls = emitSlotOverride(sm, runtimeArgs);
      if (!cls) continue;
      const key = sm.previewSlot;
      (buckets[key] ??= []).push(cls);
    }
    const className = (buckets[PREVIEW_ROOT] ?? []).join(" ");
    const classNames: Record<string, string> = {};
    for (const [k, arr] of Object.entries(buckets)) {
      if (k === PREVIEW_ROOT || k.startsWith("__cn_")) continue;
      const s = arr.join(" ");
      if (s.trim()) classNames[k] = s;
    }
    const bodies = extractClassNameCnBodiesWithStart(source);
    let previewCnSlotOverrides: string[] | undefined;
    if (bodies.length > 1) {
      previewCnSlotOverrides = [];
      for (let i = 1; i < bodies.length; i++) {
        const slotKey = `__cn_${i}`;
        const s = (buckets[slotKey] ?? []).join(" ").trim();
        previewCnSlotOverrides.push(s);
      }
    }
    return {
      className,
      ...(Object.keys(classNames).length > 0 ? { classNames } : {}),
      ...(previewCnSlotOverrides?.length ? { previewCnSlotOverrides } : {}),
    };
  }

  function resolveArgTypes(_runtimeArgs: ClassOverrideArgs): Record<string, unknown> {
    return { ...argTypes };
  }

  const nonTokenCount = allEntries.filter((e) => !e.isToken).length;

  return {
    entries: allEntries,
    args,
    argTypes,
    buildClassName,
    buildPreview,
    resolveArgTypes,
    nonTokenCount,
  };
}
