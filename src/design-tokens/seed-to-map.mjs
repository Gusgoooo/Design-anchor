/**
 * Seed → Map → Alias token generation engine.
 * Ported from Ant Design 5's open-source token algorithms:
 *   - @ant-design/colors (generate)
 *   - genColorMapToken / generateNeutralColorPalettes
 *   - genFontMapToken / genFontSizes
 *   - genSizeMapToken / genRadius / genCommonMapToken
 *
 * Extended with custom alias generators for shadcn semantic colors,
 * shadows, spacing, opacity, font-weight, focus ring, z-index,
 * chart colors, and sidebar colors.
 */

import { generate } from "@ant-design/colors";

// ---------------------------------------------------------------------------
// Color helpers (ported from antd default/colorAlgorithm.ts + colors.ts)
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
  );
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastForeground(bgHex, lightText = "#fff", darkText = "#18181b") {
  const lum = relativeLuminance(bgHex);
  return lum > 0.35 ? darkText : lightText;
}

function alpha(colorHex, a) {
  const [r, g, b] = hexToRgb(
    colorHex.startsWith("#") ? colorHex : `#${colorHex}`,
  );
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount / 100;
  return rgbToHex(r * f, g * f, b * f);
}

function generateColorPalettes(baseColor, isDark = false, bgBase = "#141414") {
  if (isDark) {
    const colors = generate(baseColor, { theme: "dark", backgroundColor: bgBase });
    return {
      1: colors[0],
      2: colors[1],
      3: colors[2],
      4: colors[3],
      5: colors[6],
      6: colors[5],
      7: colors[4],
      8: colors[6],
      9: colors[5],
      10: colors[4],
    };
  }
  const colors = generate(baseColor);
  return {
    1: colors[0],
    2: colors[1],
    3: colors[2],
    4: colors[3],
    5: colors[4],
    6: colors[5],
    7: colors[6],
    8: colors[4],
    9: colors[5],
    10: colors[6],
  };
}

function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = amount / 100;
  return rgbToHex(
    r + (255 - r) * f,
    g + (255 - g) * f,
    b + (255 - b) * f,
  );
}

function isDarkBase(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function generateNeutralColorPalettes(bgBaseColor, textBaseColor) {
  const colorBgBase = bgBaseColor || "#fff";
  const colorTextBase = textBaseColor || "#000";
  const dark = isDarkBase(colorBgBase);
  const colorShadow = "#000";

  if (dark) {
    return {
      colorBgBase,
      colorTextBase,
      colorShadow,

      colorText: alpha(colorTextBase, 0.85),
      colorTextSecondary: alpha(colorTextBase, 0.65),
      colorTextTertiary: alpha(colorTextBase, 0.45),
      colorTextQuaternary: alpha(colorTextBase, 0.25),

      colorFill: alpha(colorTextBase, 0.18),
      colorFillSecondary: alpha(colorTextBase, 0.12),
      colorFillTertiary: alpha(colorTextBase, 0.08),
      colorFillQuaternary: alpha(colorTextBase, 0.04),

      colorBgSolid: alpha(colorTextBase, 1),
      colorBgSolidHover: alpha(colorTextBase, 0.75),
      colorBgSolidActive: alpha(colorTextBase, 0.95),

      colorBgLayout: colorBgBase,
      colorBgContainer: lighten(colorBgBase, 8),
      colorBgElevated: lighten(colorBgBase, 12),
      colorBgSpotlight: lighten(colorBgBase, 26),
      colorBgBlur: "transparent",

      colorBorder: lighten(colorBgBase, 26),
      colorBorderDisabled: lighten(colorBgBase, 10),
      colorBorderSecondary: lighten(colorBgBase, 19),
    };
  }

  return {
    colorBgBase,
    colorTextBase,
    colorShadow,

    colorText: alpha(colorTextBase, 0.88),
    colorTextSecondary: alpha(colorTextBase, 0.65),
    colorTextTertiary: alpha(colorTextBase, 0.45),
    colorTextQuaternary: alpha(colorTextBase, 0.25),

    colorFill: alpha(colorTextBase, 0.15),
    colorFillSecondary: alpha(colorTextBase, 0.06),
    colorFillTertiary: alpha(colorTextBase, 0.04),
    colorFillQuaternary: alpha(colorTextBase, 0.02),

    colorBgSolid: alpha(colorTextBase, 1),
    colorBgSolidHover: alpha(colorTextBase, 0.75),
    colorBgSolidActive: alpha(colorTextBase, 0.95),

    colorBgLayout: darken(colorBgBase, 4),
    colorBgContainer: colorBgBase,
    colorBgElevated: colorBgBase,
    colorBgSpotlight: alpha(colorTextBase, 0.85),
    colorBgBlur: "transparent",

    colorBorder: darken(colorBgBase, 15),
    colorBorderDisabled: darken(colorBgBase, 15),
    colorBorderSecondary: darken(colorBgBase, 6),
  };
}

// ---------------------------------------------------------------------------
// genColorMapToken (ported from antd shared/genColorMapToken.ts)
// ---------------------------------------------------------------------------

function genColorMapToken(seed, isDark = false) {
  const {
    colorSuccess: colorSuccessBase,
    colorWarning: colorWarningBase,
    colorError: colorErrorBase,
    colorInfo: colorInfoBase,
    colorPrimary: colorPrimaryBase,
    colorBgBase,
    colorTextBase,
  } = seed;

  const neutralColors = generateNeutralColorPalettes(colorBgBase, colorTextBase);
  const darkBg = isDark ? neutralColors.colorBgContainer : undefined;

  const primaryColors = generateColorPalettes(colorPrimaryBase, isDark, darkBg);
  const successColors = generateColorPalettes(colorSuccessBase, isDark, darkBg);
  const warningColors = generateColorPalettes(colorWarningBase, isDark, darkBg);
  const errorColors = generateColorPalettes(colorErrorBase, isDark, darkBg);
  const infoColors = generateColorPalettes(colorInfoBase, isDark, darkBg);

  const colorLink = seed.colorLink || seed.colorInfo;
  const linkColors = generateColorPalettes(colorLink, isDark, darkBg);

  return {
    ...neutralColors,

    colorPrimaryBg: primaryColors[1],
    colorPrimaryBgHover: primaryColors[2],
    colorPrimaryBorder: primaryColors[3],
    colorPrimaryBorderHover: primaryColors[4],
    colorPrimaryHover: primaryColors[5],
    colorPrimary: primaryColors[6],
    colorPrimaryActive: primaryColors[7],
    colorPrimaryTextHover: primaryColors[8],
    colorPrimaryText: primaryColors[9],
    colorPrimaryTextActive: primaryColors[10],

    colorSuccessBg: successColors[1],
    colorSuccessBgHover: successColors[2],
    colorSuccessBorder: successColors[3],
    colorSuccessBorderHover: successColors[4],
    colorSuccessHover: successColors[4],
    colorSuccess: successColors[6],
    colorSuccessActive: successColors[7],
    colorSuccessTextHover: successColors[8],
    colorSuccessText: successColors[9],
    colorSuccessTextActive: successColors[10],

    colorErrorBg: errorColors[1],
    colorErrorBgHover: errorColors[2],
    colorErrorBgActive: errorColors[3],
    colorErrorBorder: errorColors[3],
    colorErrorBorderHover: errorColors[4],
    colorErrorHover: errorColors[5],
    colorError: errorColors[6],
    colorErrorActive: errorColors[7],
    colorErrorTextHover: errorColors[8],
    colorErrorText: errorColors[9],
    colorErrorTextActive: errorColors[10],

    colorWarningBg: warningColors[1],
    colorWarningBgHover: warningColors[2],
    colorWarningBorder: warningColors[3],
    colorWarningBorderHover: warningColors[4],
    colorWarningHover: warningColors[4],
    colorWarning: warningColors[6],
    colorWarningActive: warningColors[7],
    colorWarningTextHover: warningColors[8],
    colorWarningText: warningColors[9],
    colorWarningTextActive: warningColors[10],

    colorInfoBg: infoColors[1],
    colorInfoBgHover: infoColors[2],
    colorInfoBorder: infoColors[3],
    colorInfoBorderHover: infoColors[4],
    colorInfoHover: infoColors[4],
    colorInfo: infoColors[6],
    colorInfoActive: infoColors[7],
    colorInfoTextHover: infoColors[8],
    colorInfoText: infoColors[9],
    colorInfoTextActive: infoColors[10],

    colorLinkHover: linkColors[4],
    colorLink: linkColors[6],
    colorLinkActive: linkColors[7],

    colorBgMask: alpha("#000", 0.45),
    colorWhite: "#fff",
  };
}

// ---------------------------------------------------------------------------
// genFontSizes / genFontMapToken (ported from antd shared/genFontSizes.ts)
// ---------------------------------------------------------------------------

function getLineHeight(fontSize) {
  return (fontSize + 8) / fontSize;
}

function genFontSizes(base) {
  const fontSizes = Array.from({ length: 10 }, (_, index) => {
    const i = index - 1;
    const baseSize = base * Math.E ** (i / 5);
    const intSize = index > 1 ? Math.floor(baseSize) : Math.ceil(baseSize);
    return Math.floor(intSize / 2) * 2;
  });
  fontSizes[1] = base;
  return fontSizes.map((size) => ({
    size,
    lineHeight: getLineHeight(size),
  }));
}

function genFontMapToken(fontSize) {
  // Coerce string inputs (the Customizer length editor may write "12"
  // instead of 12). All downstream math assumes Number.
  fontSize = Number(fontSize);
  if (!Number.isFinite(fontSize)) fontSize = 14;
  const pairs = genFontSizes(fontSize);
  const sizes = pairs.map((p) => p.size);
  const lhs = pairs.map((p) => p.lineHeight);

  return {
    fontSizeSM: sizes[0],
    fontSize: sizes[1],
    fontSizeLG: sizes[2],
    fontSizeXL: sizes[3],
    fontSizeHeading1: sizes[6],
    fontSizeHeading2: sizes[5],
    fontSizeHeading3: sizes[4],
    fontSizeHeading4: sizes[3],
    fontSizeHeading5: sizes[2],
    lineHeight: lhs[1],
    lineHeightLG: lhs[2],
    lineHeightSM: lhs[0],
    fontHeight: Math.round(lhs[1] * sizes[1]),
    fontHeightLG: Math.round(lhs[2] * sizes[2]),
    fontHeightSM: Math.round(lhs[0] * sizes[0]),
    lineHeightHeading1: lhs[6],
    lineHeightHeading2: lhs[5],
    lineHeightHeading3: lhs[4],
    lineHeightHeading4: lhs[3],
    lineHeightHeading5: lhs[2],
  };
}

// ---------------------------------------------------------------------------
// genSizeMapToken (ported from antd shared/genSizeMapToken.ts)
// ---------------------------------------------------------------------------

function genSizeMapToken(seed) {
  const { sizeUnit, sizeStep } = seed;
  return {
    sizeXXL: sizeUnit * (sizeStep + 8),
    sizeXL: sizeUnit * (sizeStep + 4),
    sizeLG: sizeUnit * (sizeStep + 2),
    sizeMD: sizeUnit * (sizeStep + 1),
    sizeMS: sizeUnit * sizeStep,
    size: sizeUnit * sizeStep,
    sizeSM: sizeUnit * (sizeStep - 1),
    sizeXS: sizeUnit * (sizeStep - 2),
    sizeXXS: sizeUnit * (sizeStep - 3),
  };
}

// ---------------------------------------------------------------------------
// genRadius (ported from antd shared/genRadius.ts)
// ---------------------------------------------------------------------------

function genRadius(radiusBase) {
  let radiusLG = radiusBase;
  let radiusSM = radiusBase;
  let radiusXS = radiusBase;
  let radiusOuter = radiusBase;

  if (radiusBase < 6 && radiusBase >= 5) radiusLG = radiusBase + 1;
  else if (radiusBase < 16 && radiusBase >= 6) radiusLG = radiusBase + 2;
  else if (radiusBase >= 16) radiusLG = 16;

  if (radiusBase < 7 && radiusBase >= 5) radiusSM = 4;
  else if (radiusBase < 8 && radiusBase >= 7) radiusSM = 5;
  else if (radiusBase < 14 && radiusBase >= 8) radiusSM = 6;
  else if (radiusBase < 16 && radiusBase >= 14) radiusSM = 7;
  else if (radiusBase >= 16) radiusSM = 8;

  if (radiusBase < 6 && radiusBase >= 2) radiusXS = 1;
  else if (radiusBase >= 6) radiusXS = 2;

  if (radiusBase > 4 && radiusBase < 8) radiusOuter = 4;
  else if (radiusBase >= 8) radiusOuter = 6;

  return {
    borderRadius: radiusBase,
    borderRadiusXS: radiusXS,
    borderRadiusSM: radiusSM,
    borderRadiusLG: radiusLG,
    borderRadiusOuter: radiusOuter,
  };
}

// ---------------------------------------------------------------------------
// genCommonMapToken (ported from antd shared/genCommonMapToken.ts)
// ---------------------------------------------------------------------------

function genCommonMapToken(seed) {
  const { borderRadius } = seed;
  // Motion durations & line widths are no longer user-editable seeds —
  // fixed system constants.
  return {
    motionDurationFast: "0.1s",
    motionDurationMid: "0.2s",
    motionDurationSlow: "0.3s",
    lineWidthBold: 2,
    ...genRadius(borderRadius),
  };
}

// ---------------------------------------------------------------------------
// Custom: genShadowTokens
// ---------------------------------------------------------------------------

function genShadowTokens(colorShadow, isDark) {
  const lo = isDark ? 0.2 : 0.05;
  const mid = isDark ? 0.35 : 0.1;
  const hi = isDark ? 0.4 : 0.1;
  return {
    shadowSm: `0 1px 2px 0 ${alpha(colorShadow, lo)}`,
    shadow: `0 1px 3px 0 ${alpha(colorShadow, mid)}, 0 1px 2px -1px ${alpha(colorShadow, mid)}`,
    shadowMd: `0 4px 6px -1px ${alpha(colorShadow, mid)}, 0 2px 4px -2px ${alpha(colorShadow, mid)}`,
    shadowLg: `0 10px 15px -3px ${alpha(colorShadow, mid)}, 0 4px 6px -4px ${alpha(colorShadow, hi)}`,
    shadowInner: `inset 0 2px 4px 0 ${alpha(colorShadow, lo)}`,
  };
}

// ---------------------------------------------------------------------------
// Custom: spacing = size scale / sizeUnit (linear, approximate to Tailwind 4px scale)
// Proportionally consistent with handwritten p-4=16px, gap-2=8px etc.; also includes 0 / px / 0.5
// ---------------------------------------------------------------------------

const SPACING_STEP_EN = [
  "XS",
  "SM",
  "MD",
  "LG",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
  "8XL",
  "9XL",
  "10XL",
  "11XL",
  "12XL",
];
const SPACING_STEP_ZH = [
  "Extra-tight",
  "Compact",
  "Dense",
  "Small",
  "Balanced",
  "Comfortable",
  "Relaxed",
  "Large",
  "Section",
  "Large section",
  "Extra-large",
  "Huge",
  "Ultra-wide",
  "Full-width",
  "Over-full",
  "Maximum",
];

/** Consistent with `genUnifiedSpacingScaleTokens` output key suffixes, for emit sorting */
function deriveSpacingScaleSuffixes(sizeUnit, sizeMap) {
  const suffixes = new Set(["0", "px", "0.5"]);
  for (const v of Object.values(sizeMap)) {
    const px = Number(v);
    if (!Number.isFinite(px) || px <= 0) continue;
    const n = px / sizeUnit;
    if (Math.abs(n - Math.round(n)) < 1e-9) suffixes.add(String(Math.round(n)));
    else suffixes.add(String(n));
  }
  return sortSpacingSuffixesList([...suffixes]);
}

function sortSpacingSuffixesList(arr) {
  const rank = (s) => {
    if (s === "0") return [-1, 0];
    if (s === "px") return [-1, 1];
    if (s === "0.5") return [-1, 2];
    const n = parseFloat(s);
    return Number.isFinite(n) ? [0, n] : [1, 0];
  };
  return arr.sort((a, b) => {
    const [ra, va] = rank(a);
    const [rb, vb] = rank(b);
    if (ra !== rb) return ra - rb;
    return va - vb;
  });
}

/**
 * @param {object} seed
 * @returns {string[]} spacing key suffix sort order (consistent with @theme `--spacing-*`)
 */
export function getSpacingSuffixSortOrderFromSeed(seed) {
  const sizeMap = genSizeMapToken(seed);
  return deriveSpacingScaleSuffixes(seed.sizeUnit, sizeMap);
}

/**
 * `--spacing-{n}` -> Tailwind gap-/p-/m- numeric classes (unique naming; no longer duplicating `--space-*`).
 */
function genUnifiedSpacingScaleTokens(sizeUnit, sizeMap) {
  /** @type {Record<string, string>} */
  const out = {};

  function addSpacing(suffix, value) {
    out[`spacing-${suffix}`] = value;
  }

  const suffixes = deriveSpacingScaleSuffixes(sizeUnit, sizeMap);
  for (const k of suffixes) {
    if (k === "0") {
      addSpacing("0", "0");
      continue;
    }
    if (k === "px") {
      addSpacing("px", "1px");
      continue;
    }
    const m = Number(k);
    const numPx = m * sizeUnit;
    addSpacing(k, `${numPx}px`);
  }
  return out;
}

/**
 * Spacing scale snapshot fully consistent with @theme (for spacing-scale.generated.json, audit controls).
 * @param {object} seed
 */
export function computeSpacingScaleSnapshot(seed) {
  const sizeUnit = Number(seed.sizeUnit ?? 4);
  const sizeStep = Number(seed.sizeStep ?? 4);
  const sizeMap = genSizeMapToken(seed);
  const suffixes = deriveSpacingScaleSuffixes(sizeUnit, sizeMap);
  /** @type {{ suffix: string, px: number, pxStr: string }[]} */
  const entries = [];
  for (const k of suffixes) {
    if (k === "0") entries.push({ suffix: "0", px: 0, pxStr: "0" });
    else if (k === "px") entries.push({ suffix: "px", px: 1, pxStr: "1px" });
    else {
      const m = Number(k);
      const numPx = m * sizeUnit;
      entries.push({ suffix: k, px: numPx, pxStr: `${numPx}px` });
    }
  }

  const stepLabels = entries.map((e) => {
    if (e.suffix === "0") {
      return { suffix: "0", zh: "No spacing", en: "None (0)" };
    }
    if (e.suffix === "px") {
      return { suffix: "px", zh: "1px hairline", en: "1px hairline" };
    }
    if (e.suffix === "0.5") {
      return { suffix: "0.5", zh: `Half-step · ${e.px}px`, en: `Half-step · ${e.px}px` };
    }
    const idx = Math.round(Number(e.suffix)) - 1;
    const en = SPACING_STEP_EN[idx] ?? `Step ${e.suffix}`;
    const zh = SPACING_STEP_ZH[idx] ?? `Step ${e.suffix}`;
    return {
      suffix: e.suffix,
      zh: `${zh} · ${e.px}px`,
      en: `${en} · ${e.px}px`,
    };
  });

  const suffixToPx = Object.fromEntries(entries.map((x) => [x.suffix, x.pxStr]));

  return { sizeUnit, sizeStep, entries, stepLabels, suffixToPx };
}

function mirrorPaddingMarginFromSpacingVars(vars) {
  for (const [k, v] of Object.entries(vars)) {
    if (!k.startsWith("spacing-")) continue;
    const sfx = k.slice("spacing-".length);
    vars[`padding-${sfx}`] = v;
    vars[`margin-${sfx}`] = v;
  }
}

// ---------------------------------------------------------------------------
// Custom: genShadcnAliasTokens (maps antd map tokens → shadcn CSS variable names)
// ---------------------------------------------------------------------------

/**
 * Maps Antd map tokens → shadcn CSS variable names.
 *
 * Independent gray seeds (graySecondary / grayMuted / grayMutedForeground /
 * grayAccent / grayBorder / grayInput) act as user overrides on each
 * semantic slot. When the user leaves a seed empty the Antd derivation
 * (opacity ladder on colorTextBase) wins, so the system stays cohesive
 * by default but every gray slot can be tuned independently when a
 * design calls for distinct gray levels.
 */
function genShadcnAliasTokens(colorMap, seed) {
  const pick = (key, fallback) => {
    const v = seed?.[key];
    return v != null && v !== "" ? v : fallback;
  };
  return {
    background: colorMap.colorBgBase,
    foreground: colorMap.colorText,
    card: colorMap.colorBgContainer,
    "card-foreground": colorMap.colorText,
    popover: colorMap.colorBgElevated,
    "popover-foreground": colorMap.colorText,
    primary: colorMap.colorPrimary,
    "primary-foreground": contrastForeground(colorMap.colorPrimary),
    secondary: pick("graySecondary", colorMap.colorFillSecondary),
    "secondary-foreground": colorMap.colorText,
    muted: pick("grayMuted", colorMap.colorBgLayout),
    "muted-foreground": pick("grayMutedForeground", colorMap.colorTextTertiary),
    accent: pick("grayAccent", colorMap.colorFillSecondary),
    "accent-foreground": colorMap.colorText,
    destructive: colorMap.colorError,
    "destructive-foreground": contrastForeground(colorMap.colorError),
    border: pick("grayBorder", colorMap.colorBorderSecondary),
    input: pick("grayInput", colorMap.colorBorder),
    ring: colorMap.colorPrimary,
  };
}

// ---------------------------------------------------------------------------
// Custom: genSidebarAliasTokens
// ---------------------------------------------------------------------------

function genSidebarAliasTokens(colorMap) {
  return {
    sidebar: colorMap.colorBgElevated,
    "sidebar-foreground": colorMap.colorText,
    "sidebar-primary": colorMap.colorPrimary,
    "sidebar-primary-foreground": contrastForeground(colorMap.colorPrimary),
    "sidebar-accent": colorMap.colorFillSecondary,
    "sidebar-accent-foreground": colorMap.colorText,
    "sidebar-border": colorMap.colorBorderSecondary,
    "sidebar-ring": colorMap.colorPrimary,
  };
}

// ---------------------------------------------------------------------------
// Custom: genZIndexTokens
// ---------------------------------------------------------------------------

function genZIndexTokens() {
  // Z-Index is no longer user-editable — fixed system constants.
  return {
    "z-base": 0,
    "z-dropdown": 1000,
    "z-modal": 1300,
    "z-tooltip": 1070,
  };
}

// ---------------------------------------------------------------------------
// Main export: deriveSeedToMap
// ---------------------------------------------------------------------------

/**
 * @param {object} seed   – full seed object (light or merged light+darkOverrides)
 * @param {object} options
 * @param {boolean} options.dark – if true, generate dark-mode tokens
 * @param {object} options.customSeeds – chart colors etc.
 * @param {object} options.fixedAliases – opacity, fontWeight, ring etc.
 * @returns {Record<string, string|number>} flat map of CSS variable name → value
 */
/**
 * Coerce a numeric seed to a Number. Strips any css unit suffix
 * (px / em / rem / %) and falls back to `fallback` when the value
 * isn't a finite number. Defensive against the Customizer length
 * editor writing "4px" as a string into a slot that downstream math
 * expects to be 4.
 */
function toNumericSeed(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return fallback;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

/** Returns a copy of `seed` with all numeric-typed seeds coerced. */
function normalizeSeed(seed) {
  return {
    ...seed,
    fontSize: toNumericSeed(seed.fontSize, 14),
    borderRadius: toNumericSeed(seed.borderRadius, 8),
    sizeUnit: toNumericSeed(seed.sizeUnit, 4),
    sizeStep: toNumericSeed(seed.sizeStep, 4),
  };
}

export function deriveSeedToMap(rawSeed, { dark = false, customSeeds = {}, fixedAliases = {} } = {}) {
  const seed = normalizeSeed(rawSeed);
  const vars = {};

  // --- Map layer: antd algorithms ---
  const colorMap = genColorMapToken(seed, dark);
  const fontMap = genFontMapToken(seed.fontSize);
  const sizeMap = genSizeMapToken(seed);
  const commonMap = genCommonMapToken(seed);

  // Color map tokens → CSS variables
  const colorVarMap = {
    "color-primary": colorMap.colorPrimary,
    "color-primary-bg": colorMap.colorPrimaryBg,
    "color-primary-bg-hover": colorMap.colorPrimaryBgHover,
    "color-primary-border": colorMap.colorPrimaryBorder,
    "color-primary-border-hover": colorMap.colorPrimaryBorderHover,
    "color-primary-hover": colorMap.colorPrimaryHover,
    "color-primary-active": colorMap.colorPrimaryActive,
    "color-primary-text-hover": colorMap.colorPrimaryTextHover,
    "color-primary-text": colorMap.colorPrimaryText,
    "color-primary-text-active": colorMap.colorPrimaryTextActive,

    "color-success": colorMap.colorSuccess,
    "color-success-bg": colorMap.colorSuccessBg,
    "color-success-bg-hover": colorMap.colorSuccessBgHover,
    "color-success-border": colorMap.colorSuccessBorder,
    "color-success-border-hover": colorMap.colorSuccessBorderHover,
    "color-success-hover": colorMap.colorSuccessHover,
    "color-success-active": colorMap.colorSuccessActive,
    "color-success-text-hover": colorMap.colorSuccessTextHover,
    "color-success-text": colorMap.colorSuccessText,
    "color-success-text-active": colorMap.colorSuccessTextActive,

    "color-warning": colorMap.colorWarning,
    "color-warning-bg": colorMap.colorWarningBg,
    "color-warning-bg-hover": colorMap.colorWarningBgHover,
    "color-warning-border": colorMap.colorWarningBorder,
    "color-warning-border-hover": colorMap.colorWarningBorderHover,
    "color-warning-hover": colorMap.colorWarningHover,
    "color-warning-active": colorMap.colorWarningActive,
    "color-warning-text-hover": colorMap.colorWarningTextHover,
    "color-warning-text": colorMap.colorWarningText,
    "color-warning-text-active": colorMap.colorWarningTextActive,

    "color-error": colorMap.colorError,
    "color-error-bg": colorMap.colorErrorBg,
    "color-error-bg-hover": colorMap.colorErrorBgHover,
    "color-error-bg-active": colorMap.colorErrorBgActive,
    "color-error-border": colorMap.colorErrorBorder,
    "color-error-border-hover": colorMap.colorErrorBorderHover,
    "color-error-hover": colorMap.colorErrorHover,
    "color-error-active": colorMap.colorErrorActive,
    "color-error-text-hover": colorMap.colorErrorTextHover,
    "color-error-text": colorMap.colorErrorText,
    "color-error-text-active": colorMap.colorErrorTextActive,

    "color-info": colorMap.colorInfo,
    "color-info-bg": colorMap.colorInfoBg,
    "color-info-bg-hover": colorMap.colorInfoBgHover,
    "color-info-border": colorMap.colorInfoBorder,
    "color-info-border-hover": colorMap.colorInfoBorderHover,
    "color-info-hover": colorMap.colorInfoHover,
    "color-info-active": colorMap.colorInfoActive,
    "color-info-text-hover": colorMap.colorInfoTextHover,
    "color-info-text": colorMap.colorInfoText,
    "color-info-text-active": colorMap.colorInfoTextActive,

    "color-link": colorMap.colorLink,
    "color-link-hover": colorMap.colorLinkHover,
    "color-link-active": colorMap.colorLinkActive,

    "color-text": colorMap.colorText,
    "color-text-secondary": colorMap.colorTextSecondary,
    "color-text-tertiary": colorMap.colorTextTertiary,
    "color-text-quaternary": colorMap.colorTextQuaternary,

    "color-fill": colorMap.colorFill,
    "color-fill-secondary": colorMap.colorFillSecondary,
    "color-fill-tertiary": colorMap.colorFillTertiary,
    "color-fill-quaternary": colorMap.colorFillQuaternary,

    "color-bg-base": colorMap.colorBgBase,
    "color-bg-layout": colorMap.colorBgLayout,
    "color-bg-container": colorMap.colorBgContainer,
    "color-bg-elevated": colorMap.colorBgElevated,
    "color-bg-spotlight": colorMap.colorBgSpotlight,
    "color-bg-solid": colorMap.colorBgSolid,
    "color-bg-solid-hover": colorMap.colorBgSolidHover,
    "color-bg-solid-active": colorMap.colorBgSolidActive,
    "color-bg-mask": colorMap.colorBgMask,

    "color-border": colorMap.colorBorder,
    "color-border-secondary": colorMap.colorBorderSecondary,
    "color-border-disabled": colorMap.colorBorderDisabled,

    "color-white": colorMap.colorWhite,
    "color-shadow": colorMap.colorShadow,
  };
  Object.assign(vars, colorVarMap);

  // Font map tokens
  const fontVarMap = {
    "font-size-sm": `${fontMap.fontSizeSM}px`,
    "font-size": `${fontMap.fontSize}px`,
    "font-size-lg": `${fontMap.fontSizeLG}px`,
    "font-size-xl": `${fontMap.fontSizeXL}px`,
    "font-size-heading-1": `${fontMap.fontSizeHeading1}px`,
    "font-size-heading-2": `${fontMap.fontSizeHeading2}px`,
    "font-size-heading-3": `${fontMap.fontSizeHeading3}px`,
    "font-size-heading-4": `${fontMap.fontSizeHeading4}px`,
    "font-size-heading-5": `${fontMap.fontSizeHeading5}px`,
    "line-height": fontMap.lineHeight.toFixed(4),
    "line-height-sm": fontMap.lineHeightSM.toFixed(4),
    "line-height-lg": fontMap.lineHeightLG.toFixed(4),
  };
  Object.assign(vars, fontVarMap);

  // Radius tokens
  vars["border-radius"] = `${commonMap.borderRadius}px`;
  vars["border-radius-xs"] = `${commonMap.borderRadiusXS}px`;
  vars["border-radius-sm"] = `${commonMap.borderRadiusSM}px`;
  vars["border-radius-lg"] = `${commonMap.borderRadiusLG}px`;
  vars["border-radius-outer"] = `${commonMap.borderRadiusOuter}px`;
  vars["border-radius-xl"] = `${commonMap.borderRadiusLG + 4}px`;

  // Motion tokens
  vars["motion-duration-fast"] = commonMap.motionDurationFast;
  vars["motion-duration-mid"] = commonMap.motionDurationMid;
  vars["motion-duration-slow"] = commonMap.motionDurationSlow;

  // Line width (fixed system constants — no longer derived from seed)
  vars["line-width"] = "1px";
  vars["line-width-bold"] = `${commonMap.lineWidthBold}px`;

  // --- Alias layer: Tailwind-aligned spacing（`spacing-{n}` + mirror → padding-/margin-）---
  Object.assign(vars, genUnifiedSpacingScaleTokens(seed.sizeUnit, sizeMap));
  mirrorPaddingMarginFromSpacingVars(vars);

  // --- Alias layer: shadcn semantic colors ---
  const shadcnAliases = genShadcnAliasTokens(colorMap, seed);
  for (const [k, v] of Object.entries(shadcnAliases)) {
    vars[k] = v;
  }

  // --- Alias layer: sidebar ---
  const sidebarAliases = genSidebarAliasTokens(colorMap);
  for (const [k, v] of Object.entries(sidebarAliases)) {
    vars[k] = v;
  }

  // --- Alias layer: shadows ---
  const shadowTokens = genShadowTokens(colorMap.colorShadow || "#000", dark);
  const shadowNames = {
    shadowSm: "elevation-sm", shadow: "elevation", shadowMd: "elevation-md",
    shadowLg: "elevation-lg", shadowInner: "elevation-inner",
  };
  for (const [k, v] of Object.entries(shadowTokens)) {
    vars[shadowNames[k] || k] = v;
  }

  // --- Alias layer: z-index (fixed system constants) ---
  const zTokens = genZIndexTokens();
  for (const [k, v] of Object.entries(zTokens)) {
    vars[k] = v;
  }

  // --- Alias layer: chart colors (custom seeds) ---
  for (let i = 1; i <= 5; i++) {
    const lightKey = `chart${i}`;
    const darkKey = `chart${i}Dark`;
    vars[`chart-${i}`] = dark
      ? customSeeds[darkKey] || customSeeds[lightKey] || ""
      : customSeeds[lightKey] || "";
  }

  // --- Alias layer: fixed system constants (no longer user-editable) ---
  // opacity / fontWeight / ring / paddingXXXS / motion-duration extras
  vars["opacity-transparent"] = 0;
  vars["opacity-subtle"] = 0.4;
  vars["opacity-disabled"] = 0.5;
  vars["opacity-muted"] = 0.7;
  vars["opacity-opaque"] = 1;
  vars["font-weight-medium"] = 500;
  vars["font-weight-semibold"] = 600;
  vars["ring-width"] = "2px";
  vars["ring-offset"] = "2px";
  // paddingXXXS — applies to spacing/padding/margin -0.5
  vars["spacing-0.5"] = "2px";
  vars["padding-0.5"] = "2px";
  vars["margin-0.5"] = "2px";
  vars["motion-duration-150"] = "0.15s";
  vars["motion-duration-long"] = "0.5s";
  vars["motion-duration-whole"] = "1s";

  // Suppress unused-import warning since fixedAliases is now no-op
  void fixedAliases;

  // Border width (kept for compatibility; fixed system constants)
  vars["border-width-hairline"] = "1px";
  vars["border-width-0"] = "0";

  // Font family — fixed system constants, no longer user-editable seeds.
  // English defaults to Inter; CJK falls back to PingFang / YaHei (the
  // OS-installed system Chinese fonts) so mixed text renders cleanly.
  vars["font-family"] =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', " +
    "Roboto, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', " +
    "'微软雅黑', Arial, sans-serif";
  vars["font-family-code"] =
    "ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  // Elevation "none" alias
  vars["elevation-none"] = "none";

  // Internal metadata for @theme generation
  vars["__sizeUnit"] = `${seed.sizeUnit}px`;

  return vars;
}
