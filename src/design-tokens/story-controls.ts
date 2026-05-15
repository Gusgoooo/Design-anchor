import tokensDoc from "./tokens.json";
import spacingScale from "./spacing-scale.generated.json";
import { DESIGN_TOKENS } from "./token-registry";
import { spacingUtilityPrefixLabelZh } from "./tw-class-audit";

/** Story Controls options: tokenId is the value in Controls, value is the string mapped to component prop */
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

/** CSS variable reference (token id corresponds to --id generated in tokens.json) */
export function cssVar(tokenId: string): string {
  return `var(--${tokenId})`;
}

/** Transparent: not a CSS variable, for Controls selection */
export const STORY_COLOR_TRANSPARENT = "transparent";

/** `transparent` or empty -> transparent; otherwise `var(--tokenId)` */
export function cssVarOrTransparent(tokenId: string | undefined): string {
  if (tokenId == null || tokenId === "" || tokenId === STORY_COLOR_TRANSPARENT) return "transparent";
  return cssVar(tokenId);
}

/**
 * Story Controls color dropdown: semantic colors + chart colors + full antd palette map (synced with token-registry).
 */
export function storyColorControlOptions(): string[] {
  const sem = tokenIdsByCategory("semantic");
  const chart = tokenIdsByCategory("chart");
  const col = tokenIdsByCategory("color");
  return [...new Set([...sem, ...chart, ...col])].sort((a, b) => a.localeCompare(b));
}

/** Common color controls: transparent first, for "no fill / no border" */
export function storyColorControlOptionsWithTransparent(): string[] {
  return [STORY_COLOR_TRANSPARENT, ...storyColorControlOptions()];
}

/** List selectable token ids by category (for argTypes.options) */
export function tokenIdsByCategory(category: string): string[] {
  return DESIGN_TOKENS.filter((t) => t.category === category).map((t) => t.id);
}

/** Tailwind max-width utility classes for Story use (not design tokens; semantically consistent with MAX_WIDTH in emit) */
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

/** Tailwind min-width utility classes for Story use (not design tokens) */
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
/*  Story semantic enum controls: shared mapping tables                 */
/*  Each MAP has a corresponding _LABEL with same keys: shown in       */
/*  Storybook dropdown with actual values                              */
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
  muted: "muted · Muted foreground",
  default: "default · Default foreground",
  secondary: "secondary · Secondary foreground",
  primary: "primary · Primary",
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

/** Consistent with `@theme --spacing-*` / Modular seed */
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
  transparent: "transparent · Transparent",
  card: "card · Card background",
  muted: "muted · Muted background",
  background: "background · Page background",
  primary: "primary · Primary background",
};

export const SHADOW_MAP: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};
export const SHADOW_LABEL: Record<string, string> = {
  none: "none · None", sm: "sm · Small", md: "md · Medium", lg: "lg · Large",
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
  none: "none · No border",
  default: "default · Solid 1px",
  dashed: "dashed · Dashed 1px",
  dotted: "dotted · Dotted 1px",
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
/*  tokenControls — generate args / argTypes / className builder       */
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
  borderRadius:  { map: RADIUS_MAP,       labels: RADIUS_LABEL,       label: "Border Radius" },
  fontSize:      { map: TEXT_SIZE_MAP,     labels: TEXT_SIZE_LABEL,     label: "Font Size" },
  fontWeight:    { map: FONT_WEIGHT_MAP,   labels: FONT_WEIGHT_LABEL,  label: "Font Weight" },
  shadow:        { map: SHADOW_MAP,        labels: SHADOW_LABEL,       label: "Shadow" },
  bgColor:       { map: BG_MAP,           labels: BG_LABEL,           label: "Background" },
  textColor:     { map: TONE_MAP,         labels: TONE_LABEL,         label: "Text Tone" },
  borderStyle:   { map: BORDER_STYLE_MAP, labels: BORDER_STYLE_LABEL, label: "Border Style" },
  duration:      { map: DURATION_MAP,     labels: DURATION_LABEL,     label: "Duration" },
  leading:       { map: LEADING_MAP,      labels: LEADING_LABEL,      label: "Line Height" },
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
      ? { map: SPACING_MAP, labels: SPACING_LABEL, label: `${prefix} spacing` }
      : TOKEN_SLOT_REGISTRY[baseKey];
    if (!reg) continue;

    const controlDisplayName = prefix
      ? spacingUtilityPrefixLabelZh(prefix)
      : reg.label;

    args[key] = defaultVal;
    argTypes[key] = {
      name: controlDisplayName,
      control: { type: "select" as const, labels: reg.labels },
      options: Object.keys(reg.map),
      description: reg.label,
      table: { category: "Style Tokens" },
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

/** Generate a labeled argType for manually written control scenarios */
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
