/**
 * Tailwind ClassName → Token 自动审计（Storybook「Token 修改」控件）
 *
 * 用法：
 *   import src from './button.tsx?raw';
 *   const audit = autoClassControls(src);
 *   // audit.args / argTypes：已映射刻度 → `Token 修改 · 已绑定`（select）；
 *   //   未映射 → `Token 修改 · 未映射（可输入）`（text + 可选 token 下拉，可不绑定）；
 *   //   数字类但不在设计 spacing 刻度 → `Token 修改 · 未使用令牌（px 微调）`（number，提示未引用 token）
 *   // audit.buildClassName(args) → 根据控件值拼出覆盖 class 串
 *   // audit.entries → 完整审计（含非 token），nonTokenCount 供合规统计
 */

import spacingScale from "./spacing-scale.generated.json";

/* ================================================================== */
/*  1. Token 定义（与 @theme 保持一致）                                 */
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

/** Tailwind 数字间距 → px（与 `spacing-scale.generated.json` / Modular seed 同源） */
const TW_NUM_SPACING_PX: Record<string, string> = spacingScale.suffixToPx as Record<string, string>;

/** Tailwind 默认圆角 → px */
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

/** @theme 注册的语义色名（bg-primary, text-foreground 等） */
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
/*  2. 类名提取                                                        */
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
/*  3. 类名分类 & Token 匹配                                           */
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

/** 在给定语义 token→px 映射中，选择与目标最接近的 key；并列时优先较大 px（「就近偏大」）。 */
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

/** 不透明度的绝对值在 [0,1]，并列时优先较大的语义值（更「实」的一侧）。 */
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

/** 动画时长就近语义（并列取较大时长）。 */
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

/** 字号：px 映射上的就近偏大（仅用于非精确匹配）。 */
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

/** 字重数值就近语义（并列取较大粗细）。 */
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
 * Tailwind 默认 spacing(n)=n×0.25rem；在 16px root 下即 n×4px。
 * 用于「刻度后缀不在 design spacing-scale 内」时的 px 估算与 Storybook 微调。
 */
function tailwindDefaultSpacingToPx(n: number): number {
  return n * 4;
}

/** 数字刻度类（如 h-9、gap-7）但后缀不在 `spacing-scale.generated` 中时，视为未引用 spacing 设计令牌。 */
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

  // --- Spacing / sizing utilities（与 `@theme --spacing-{n}` 数字刻度一致）
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
    return { raw: cls, category: "textColor", prefix: "text", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: false };
  }

  // --- Background Color ---
  const bgM = cls.match(/^bg-([\w-]+?)(?:\/([\d]+))?$/);
  if (bgM) {
    const val = bgM[1];
    const isToken = SEMANTIC_COLORS.has(val);
    return { raw: cls, category: "bgColor", prefix: "bg", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: false };
  }

  // --- Border Color ---
  const bcM = cls.match(/^border-([\w-]+?)(?:\/([\d]+))?$/);
  if (bcM && !["solid", "dashed", "dotted", "0", "2", "4", "8"].includes(bcM[1])) {
    const val = bcM[1];
    const isToken = SEMANTIC_COLORS.has(val);
    return { raw: cls, category: "borderColor", prefix: "border", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: false };
  }

  return null;
}

function arb(
  raw: string, category: AuditCategory, prefix: string, val: string,
): AuditEntry {
  return { raw, category, prefix, value: val, isToken: false, cssValue: val, equivalentToken: null, adjustable: false };
}

/* ================================================================== */
/*  4. 自动生成 Storybook Controls                                     */
/* ================================================================== */

type CategoryMeta = {
  tokens: Record<string, string>;
  label: string;
  /** 生成 className，e.g. (prefix, key) => `${prefix}-${key}` */
  makeClass: (prefix: string, key: string) => string;
};

const CATEGORY_BOUND = "Token 修改 · 已绑定";
const CATEGORY_UNMAPPED = "Token 修改 · 未映射（可输入）";
const CATEGORY_LAYOUT_NON_TOKEN = "Token 修改 · 未使用令牌（px 微调）";
const TOKEN_SELECT_NONE = "";

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

/** 允许在「未映射」文本框中填写的 Tailwind 刻度后缀 / arbitrary 片段（防注入） */
function isSafeTailwindSuffix(s: string): boolean {
  return /^[\w.[\]\/-]+$/.test(s);
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  spacing: {
    tokens: TW_NUM_SPACING_PX,
    label: "间距",
    makeClass: (p, k) =>
      k === "0" ? `${p}-0` : k === "px" ? `${p}-px` : `${p}-${k}`,
  },
  radius: {
    tokens: TOKEN_RADIUS,
    label: "圆角",
    makeClass: (p, k) => (k === "none" ? `${p}-none` : k === "full" ? `${p}-full` : `${p}-${k}`),
  },
  shadow: {
    tokens: TOKEN_SHADOW,
    label: "阴影",
    makeClass: (_p, k) => (k === "none" ? "shadow-none" : k === "DEFAULT" ? "shadow" : `shadow-${k}`),
  },
  fontSize: {
    tokens: TOKEN_FONT_SIZE,
    label: "字号",
    makeClass: (_p, k) => `text-${k}`,
  },
  fontWeight: {
    tokens: TOKEN_FONT_WEIGHT,
    label: "字重",
    makeClass: (_p, k) => `font-${k}`,
  },
  opacity: {
    tokens: TOKEN_OPACITY,
    label: "透明度",
    makeClass: (_p, k) => `opacity-${k}`,
  },
  duration: {
    tokens: TOKEN_DURATION,
    label: "动画时长",
    makeClass: (_p, k) => `duration-${k}`,
  },
};

function makeLabels(
  tokens: Record<string, string>,
  equivalentToken: string | null,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) {
    let lbl = `${k} · ${v}`;
    if (equivalentToken === k) lbl += " ← 等值";
    labels[k] = lbl;
  }
  return labels;
}

/** Storybook `args` 传入 `buildClassName` 时的形状（含 number 控件的运行时值） */
export type ClassOverrideArgs = Record<string, string | number | undefined>;

export type AutoControlsResult = {
  entries: AuditEntry[];
  /** 与 Meta.args 兼容：全部为 string，避免与 `[k: string]: string` 冲突 */
  args: Record<string, string>;
  argTypes: Record<string, unknown>;
  buildClassName: (runtimeArgs: ClassOverrideArgs) => string;
  resolveArgTypes: (runtimeArgs: ClassOverrideArgs) => Record<string, unknown>;
  /** 非 token 条目总数 */
  nonTokenCount: number;
};

type SlotMeta =
  | { mode: "mapped"; controlId: string; entry: AuditEntry; catMeta: CategoryMeta }
  | {
      mode: "unmapped";
      controlId: string;
      rawControlId: string;
      tokenControlId: string;
      entry: AuditEntry;
      catMeta: CategoryMeta;
    }
  | {
      mode: "layoutPx";
      controlId: string;
      entry: AuditEntry;
      defaultPx: number;
    };

export function autoClassControls(source: string): AutoControlsResult {
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
        : `${e.category}::${e.prefix}`;
    if (seen.has(slotKey)) continue;
    seen.add(slotKey);
    adjustable.push(e);
  }

  const args: Record<string, string> = {};
  const argTypes: Record<string, unknown> = {};
  const slotMeta: SlotMeta[] = [];

  for (const entry of adjustable) {
    if (entry.category === "layout") {
      const px = parsePx(entry.cssValue);
      if (px == null) continue;
      const controlId = `layout_${entry.prefix.replace(/-/g, "_")}_${String(entry.value).replace(/\./g, "_")}`;
      const suggest =
        entry.equivalentToken != null
          ? `\n设计 spacing 刻度中与当前最接近的后缀：${entry.equivalentToken}（${TW_NUM_SPACING_PX[entry.equivalentToken] ?? "?"}）`
          : "";
      const desc =
        `【未引用 spacing 设计令牌】源码类 ${entry.raw}（按 Tailwind 默认换算约 ${entry.cssValue}）。` +
        `下方用像素数微调预览，会追加 arbitrary 类覆盖；与 tokens.json 无直接绑定。${suggest}`;
      args[controlId] = String(px);
      argTypes[controlId] = {
        name: controlId,
        control: { type: "number" as const, min: 0, max: 512, step: 1 },
        description: desc,
        table: { category: CATEGORY_LAYOUT_NON_TOKEN },
      };
      slotMeta.push({ mode: "layoutPx", controlId, entry, defaultPx: px });
      continue;
    }

    const catMeta = CATEGORY_META[entry.category];
    if (!catMeta) continue;

    const controlId = entry.prefix.replace(/-/g, "_");
    const defaultKey = entry.value;
    const tokenKeys = Object.keys(catMeta.tokens);
    const labels = makeLabels(catMeta.tokens, null);

    if (entry.isToken) {
      const desc = `${catMeta.label} · 已对齐设计刻度 · ${entry.raw}`;
      args[controlId] = defaultKey;
      argTypes[controlId] = {
        control: { type: "select" as const, labels },
        options: [...tokenKeys],
        description: desc,
        table: { category: CATEGORY_BOUND },
      };
      slotMeta.push({ mode: "mapped", controlId, entry, catMeta });
      continue;
    }

    const rawControlId = `${controlId}_raw`;
    const tokenControlId = `${controlId}_token`;
    const equivLine = entry.equivalentToken
      ? `\n建议近似 token：${entry.equivalentToken}`
      : "";
    const desc =
      `${entry.raw}${entry.cssValue && entry.cssValue !== "?" ? ` · ${entry.cssValue}` : ""}${equivLine}\n` +
      "可不绑定 token；文本框填写 Tailwind 刻度后缀或 arbitrary 片段；下拉可选令牌覆盖。";

    args[rawControlId] = defaultKey;
    args[tokenControlId] = TOKEN_SELECT_NONE;

    const tokenOptions = [TOKEN_SELECT_NONE, ...tokenKeys];
    const tokenLabels: Record<string, string> = {
      [TOKEN_SELECT_NONE]: "（不绑定）",
      ...labels,
    };

    argTypes[rawControlId] = {
      control: "text",
      description: desc,
      table: { category: CATEGORY_UNMAPPED },
    };
    argTypes[tokenControlId] = {
      control: { type: "select" as const, labels: tokenLabels },
      options: tokenOptions,
      description: `${catMeta.label} · 令牌覆盖（可选）· ${entry.raw}`,
      table: { category: CATEGORY_UNMAPPED },
    };

    slotMeta.push({
      mode: "unmapped",
      controlId,
      rawControlId,
      tokenControlId,
      entry,
      catMeta,
    });
  }

  function buildClassName(runtimeArgs: ClassOverrideArgs): string {
    const parts: string[] = [];
    for (const slot of slotMeta) {
      if (slot.mode === "layoutPx") {
        const n = readPxArg(runtimeArgs[slot.controlId]);
        if (n == null || n === slot.defaultPx) continue;
        const cls = makeLayoutPxClass(slot.entry.prefix, n);
        if (cls) parts.push(cls);
        continue;
      }
      if (slot.mode === "mapped") {
        const selected = runtimeArgs[slot.controlId];
        if (selected == null || selected === "" || selected === slot.entry.value) continue;
        parts.push(slot.catMeta.makeClass(slot.entry.prefix, String(selected)));
        continue;
      }
      const tokenPick = runtimeArgs[slot.tokenControlId];
      if (tokenPick && String(tokenPick) !== TOKEN_SELECT_NONE) {
        parts.push(slot.catMeta.makeClass(slot.entry.prefix, String(tokenPick)));
        continue;
      }
      const raw = runtimeArgs[slot.rawControlId];
      if (
        raw != null &&
        String(raw) !== slot.entry.value &&
        isSafeTailwindSuffix(String(raw))
      ) {
        parts.push(slot.catMeta.makeClass(slot.entry.prefix, String(raw)));
      }
    }
    return parts.join(" ");
  }

  function resolveArgTypes(_runtimeArgs: ClassOverrideArgs): Record<string, unknown> {
    return { ...argTypes };
  }

  const nonTokenCount = allEntries.filter((e) => !e.isToken).length;

  return { entries: allEntries, args, argTypes, buildClassName, resolveArgTypes, nonTokenCount };
}
