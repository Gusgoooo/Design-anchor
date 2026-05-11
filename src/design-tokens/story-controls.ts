import tokensDoc from "./tokens.json";
import spacingScale from "./spacing-scale.generated.json";
import { DESIGN_TOKENS } from "./token-registry";

/** Story Controls 选项：tokenId 为 Controls 中的值，value 为映射到组件 prop 的字符串 */
export type StoryBindingRow = { tokenId: string; label?: string; value: string };

type TokensRoot = {
  tokens: unknown[];
  storyBindings?: Record<string, StoryBindingRow[]>;
};

const root = tokensDoc as unknown as TokensRoot;

export function storyBindingOptions(key: string): StoryBindingRow[] {
  return root.storyBindings?.[key] ?? [];
}

export function storyBindingTokenIds(key: string): string[] {
  return storyBindingOptions(key).map((o) => o.tokenId);
}

export function mapStoryBinding(key: string, tokenId: string | undefined, fallbackTokenId: string): string {
  const opts = storyBindingOptions(key);
  const fid = tokenId && opts.some((o) => o.tokenId === tokenId) ? tokenId : fallbackTokenId;
  return opts.find((o) => o.tokenId === fid)?.value ?? "";
}

export function mapBooleanFlag(tokenId: string | undefined, fallbackTokenId = "story-bool-false"): boolean {
  return mapStoryBinding("booleanFlag", tokenId, fallbackTokenId) === "true";
}

/** CSS 变量引用（token id 对应 tokens.json 中生成的 --id） */
export function cssVar(tokenId: string): string {
  return `var(--${tokenId})`;
}

/** 透明：非 CSS 变量，供 Controls 选用 */
export const STORY_COLOR_TRANSPARENT = "transparent";

/** `transparent` 或空 → 透明；否则 `var(--tokenId)` */
export function cssVarOrTransparent(tokenId: string | undefined): string {
  if (tokenId == null || tokenId === "" || tokenId === STORY_COLOR_TRANSPARENT) return "transparent";
  return cssVar(tokenId);
}

/**
 * Story Controls 颜色类下拉：语义色 + 图表色 + 全量 antd 色板 map（与 token-registry 同步）。
 */
export function storyColorControlOptions(): string[] {
  const sem = tokenIdsByCategory("semantic");
  const chart = tokenIdsByCategory("chart");
  const col = tokenIdsByCategory("color");
  return [...new Set([...sem, ...chart, ...col])].sort((a, b) => a.localeCompare(b));
}

/** 颜色控件常用：首位为透明，便于「无填充 / 无边框」 */
export function storyColorControlOptionsWithTransparent(): string[] {
  return [STORY_COLOR_TRANSPARENT, ...storyColorControlOptions()];
}

/** 按分类列出可选 token id（供 argTypes.options） */
export function tokenIdsByCategory(category: string): string[] {
  return DESIGN_TOKENS.filter((t) => t.category === category).map((t) => t.id);
}

/** Story 用 Tailwind max-width 工具类（非设计 token；与 emit 中 MAX_WIDTH 语义一致） */
export const STORY_TAILWIND_MAX_WIDTH_CLASSES: string[] = [
  "max-w-none",
  "max-w-xs",
  "max-w-sm",
  "max-w-md",
  "max-w-lg",
  "max-w-xl",
  "max-w-2xl",
  "max-w-3xl",
  "max-w-4xl",
  "max-w-5xl",
  "max-w-6xl",
  "max-w-7xl",
  "max-w-full",
  "max-w-min",
  "max-w-max",
  "max-w-fit",
  "max-w-prose",
];

/** Story 用 Tailwind min-width 工具类（非设计 token） */
export const STORY_TAILWIND_MIN_WIDTH_CLASSES: string[] = [
  "min-w-0",
  "min-w-full",
  "min-w-min",
  "min-w-max",
  "min-w-fit",
  "min-w-xs",
  "min-w-sm",
  "min-w-md",
  "min-w-lg",
  "min-w-xl",
  "min-w-2xl",
  "min-w-3xl",
  "min-w-4xl",
  "min-w-5xl",
  "min-w-6xl",
  "min-w-7xl",
];

/* ------------------------------------------------------------------ */
/*  Story 语义化枚举控件：共享映射表                                    */
/*  每个 MAP 伴随同 key 的 _LABEL：在 Storybook 下拉中显示实际值        */
/* ------------------------------------------------------------------ */

export const TEXT_SIZE_MAP: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};
export const TEXT_SIZE_LABEL: Record<string, string> = {
  xs: "xs · 12px", sm: "sm · 14px", base: "base · 16px", lg: "lg · 16px",
};

export const TONE_MAP: Record<string, string> = {
  muted: "text-muted-foreground",
  default: "text-foreground",
  secondary: "text-secondary-foreground",
  primary: "text-primary",
};
export const TONE_LABEL: Record<string, string> = {
  muted: "muted · 弱化前景",
  default: "default · 默认前景",
  secondary: "secondary · 次级前景",
  primary: "primary · 主色",
};

export const LEADING_MAP: Record<string, string> = {
  tight: "leading-tight",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
};
export const LEADING_LABEL: Record<string, string> = {
  tight: "tight · 1.25", normal: "normal · 1.5", relaxed: "relaxed · 1.625",
};

export const TRIGGER_VARIANTS = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;

export const TRIGGER_SIZES = ["default", "sm", "lg", "icon"] as const;

type SpacingStepLabel = { suffix: string; zh: string; en: string };

/** 与 `@theme --spacing-*` / Modular seed 一致 */
export const SPACING_MAP: Record<string, string> = Object.fromEntries(
  Object.keys(spacingScale.suffixToPx as Record<string, string>).map((k) => [k, k]),
);
export const SPACING_LABEL: Record<string, string> = Object.fromEntries(
  (spacingScale.stepLabels as SpacingStepLabel[]).map((l) => [l.suffix, `${l.zh} / ${l.en}`]),
);

export const BG_MAP: Record<string, string> = {
  transparent: "bg-transparent",
  card: "bg-card",
  muted: "bg-muted",
  background: "bg-background",
  primary: "bg-primary",
};
export const BG_LABEL: Record<string, string> = {
  transparent: "transparent · 透明",
  card: "card · 卡片背景",
  muted: "muted · 弱化背景",
  background: "background · 页面背景",
  primary: "primary · 主色背景",
};

export const SHADOW_MAP: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};
export const SHADOW_LABEL: Record<string, string> = {
  none: "none · 无", sm: "sm · 小", md: "md · 中", lg: "lg · 大",
};

export const RADIUS_MAP: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};
export const RADIUS_LABEL: Record<string, string> = {
  none: "none · 0",
  sm: "sm · 4px",
  md: "md · 6px",
  lg: "lg · 8px",
  xl: "xl · 12px",
  full: "full · 9999px",
};

export const BORDER_STYLE_MAP: Record<string, string> = {
  none: "border-0",
  default: "border",
  dashed: "border border-dashed",
  dotted: "border border-dotted",
};
export const BORDER_STYLE_LABEL: Record<string, string> = {
  none: "none · 无边框",
  default: "default · 实线 1px",
  dashed: "dashed · 虚线 1px",
  dotted: "dotted · 点线 1px",
};

export const FONT_WEIGHT_MAP: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};
export const FONT_WEIGHT_LABEL: Record<string, string> = {
  normal: "normal · 400", medium: "medium · 500", semibold: "semibold · 600", bold: "bold · 700",
};

export const DURATION_MAP: Record<string, string> = {
  fast: "duration-fast",
  "150": "duration-150",
  mid: "duration-mid",
  slow: "duration-slow",
  long: "duration-long",
  whole: "duration-whole",
};
export const DURATION_LABEL: Record<string, string> = {
  fast: "fast · 0.1s",
  "150": "150 · 0.15s",
  mid: "mid · 0.2s",
  slow: "slow · 0.3s",
  long: "long · 0.5s",
  whole: "whole · 1s",
};

export const OPACITY_MAP: Record<string, string> = {
  transparent: "opacity-transparent",
  subtle: "opacity-subtle",
  disabled: "opacity-disabled",
  muted: "opacity-muted",
  opaque: "opacity-opaque",
};
export const OPACITY_LABEL: Record<string, string> = {
  transparent: "transparent · 0",
  subtle: "subtle · 0.4",
  disabled: "disabled · 0.5",
  muted: "muted · 0.7",
  opaque: "opaque · 1",
};

/* ------------------------------------------------------------------ */
/*  tokenControls — 一键生成 args / argTypes / className builder       */
/* ------------------------------------------------------------------ */

type TokenSlot = {
  map: Record<string, string>;
  labels: Record<string, string>;
  default: string;
  label: string;
  category?: string;
  prefix?: string;
};

const TOKEN_SLOT_REGISTRY: Record<string, Omit<TokenSlot, "default">> = {
  borderRadius:  { map: RADIUS_MAP,       labels: RADIUS_LABEL,       label: "圆角" },
  fontSize:      { map: TEXT_SIZE_MAP,     labels: TEXT_SIZE_LABEL,     label: "字号" },
  fontWeight:    { map: FONT_WEIGHT_MAP,   labels: FONT_WEIGHT_LABEL,  label: "字重" },
  shadow:        { map: SHADOW_MAP,        labels: SHADOW_LABEL,       label: "阴影" },
  bgColor:       { map: BG_MAP,           labels: BG_LABEL,           label: "背景色" },
  textColor:     { map: TONE_MAP,         labels: TONE_LABEL,         label: "文字色调" },
  borderStyle:   { map: BORDER_STYLE_MAP, labels: BORDER_STYLE_LABEL, label: "边框样式" },
  duration:      { map: DURATION_MAP,     labels: DURATION_LABEL,     label: "动画时长" },
  leading:       { map: LEADING_MAP,      labels: LEADING_LABEL,      label: "行高" },
};

type TokenControlsConfig = Record<string, string>;

export function tokenControls(config: TokenControlsConfig) {
  const args: Record<string, string> = {};
  const argTypes: Record<string, unknown> = {};
  const slots: Array<{ key: string; slot: Omit<TokenSlot, "default">; prefix?: string }> = [];

  for (const [key, defaultVal] of Object.entries(config)) {
    const baseKey = key.replace(/^(p|px|py|pt|pb|pl|pr|m|mt|mb|ml|mr|mx|my|gap|spaceY)_/, "");
    const prefixMatch = key.match(/^(p|px|py|pt|pb|pl|pr|m|mt|mb|ml|mr|mx|my|gap|spaceY)_/);
    const prefix = prefixMatch?.[1]?.replace("spaceY", "space-y") ?? undefined;

    const reg = prefix
      ? { map: SPACING_MAP, labels: SPACING_LABEL, label: `${prefix} 间距` }
      : TOKEN_SLOT_REGISTRY[baseKey];
    if (!reg) continue;

    args[key] = defaultVal;
    argTypes[key] = {
      control: { type: "select" as const, labels: reg.labels },
      options: Object.keys(reg.map),
      description: reg.label,
      table: { category: "样式令牌" },
    };
    slots.push({ key, slot: reg, prefix });
  }

  function buildClassName(runtimeArgs: Record<string, string>): string {
    return slots
      .map(({ key, slot, prefix }) => {
        const val = runtimeArgs[key];
        if (prefix) {
          const spacing = SPACING_MAP[val];
          return spacing ? `${prefix}-${spacing}` : "";
        }
        return slot.map[val] ?? "";
      })
      .filter(Boolean)
      .join(" ");
  }

  return { args, argTypes, buildClassName };
}

/** 生成带标签的 argType，用于手写控件场景 */
export function labeledSelect(
  map: Record<string, string>,
  labels: Record<string, string>,
  description: string,
  category?: string,
) {
  return {
    control: { type: "select" as const, labels },
    options: Object.keys(map),
    description,
    ...(category ? { table: { category } } : {}),
  };
}
