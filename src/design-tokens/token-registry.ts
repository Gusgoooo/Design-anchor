import tokensDoc from "./tokens.json";
import { deriveSeedToMap } from "./seed-to-map.mjs";

export type DesignTokenCategory =
  | "semantic"
  | "radius"
  | "radius-scale"
  | "chart"
  | "sidebar"
  | "spacing"
  | "layout"
  | "elevation"
  | "motion"
  | "z-index"
  | "typography"
  | "opacity"
  | "border"
  | "color"
  | "size"
  | "control-height"
  | "padding"
  | "font-weight"
  | "ring"
  | string;

export interface DesignTokenEntry {
  id: string;
  category: DesignTokenCategory;
  light: string;
  dark: string;
  tailwindClass: string;
  usedBy: string[];
  emitCss?: boolean;
}

type TokensV2 = {
  version: number;
  seed: Record<string, string | number>;
  seedDark?: Record<string, string | number>;
  mapOverrides?: { light?: Record<string, string>; dark?: Record<string, string> };
  customSeeds?: Record<string, string>;
  fixedAliases?: Record<string, string | number>;
  storyBindings?: Record<string, unknown>;
};

type TokensV1 = { tokens: DesignTokenEntry[] };

const doc = tokensDoc as unknown as TokensV2 | TokensV1;

function categorize(id: string): DesignTokenCategory {
  if (id.startsWith("layout-")) return "layout";
  if (id.startsWith("color-primary") || id.startsWith("color-success") || id.startsWith("color-warning") || id.startsWith("color-error") || id.startsWith("color-info") || id.startsWith("color-link")) return "color";
  if (id.startsWith("color-text") || id.startsWith("color-fill") || id.startsWith("color-bg") || id.startsWith("color-border") || id === "color-white" || id === "color-shadow") return "color";
  if (id.startsWith("sidebar")) return "sidebar";
  if (id.startsWith("chart-")) return "chart";
  if (id.startsWith("border-radius")) return "radius-scale";
  if (id.startsWith("elevation")) return "elevation";
  if (id.startsWith("motion")) return "motion";
  if (id.startsWith("z-")) return "z-index";
  if (id.startsWith("font-size") || id.startsWith("line-height") || id.startsWith("font-family")) return "typography";
  if (id.startsWith("font-weight")) return "font-weight";
  if (id.startsWith("opacity")) return "opacity";
  if (id.startsWith("ring")) return "ring";
  if (id.startsWith("space-")) return "spacing";
  if (id.startsWith("padding") || id.startsWith("margin")) return "padding";
  if (id.startsWith("size")) return "size";
  if (id.startsWith("control-height")) return "control-height";
  if (id.startsWith("line-width") || id.startsWith("border-width")) return "border";
  if (["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground", "destructive", "border", "input", "ring"].includes(id)) return "semantic";
  return "other";
}

function buildFromV2(v2: TokensV2): DesignTokenEntry[] {
  const entries: DesignTokenEntry[] = [];
  const { seed, seedDark = {}, mapOverrides = {}, customSeeds = {}, fixedAliases = {} } = v2;
  const moL = mapOverrides.light ?? {};
  const moD = mapOverrides.dark ?? {};

  const add = (id: string, light: string, dark: string) => {
    entries.push({ id, category: categorize(id), light, dark, tailwindClass: "", usedBy: [] });
  };

  try {
    const lightVars = deriveSeedToMap(seed, { dark: false, customSeeds, fixedAliases });
    const darkSeed = { ...seed, ...seedDark };
    const darkVars = deriveSeedToMap(darkSeed, { dark: true, customSeeds, fixedAliases });
    const lightMerged = { ...lightVars, ...moL };
    const darkMerged = { ...darkVars, ...moD };

    for (const [name, value] of Object.entries(lightMerged)) {
      if (value === "" || value == null) continue;
      const dv = darkMerged[name];
      add(name, String(value), dv != null ? String(dv) : String(value));
    }
  } catch {
    for (const [key, val] of Object.entries(seed)) {
      const darkVal = seedDark[key] ?? val;
      add(`seed-${key}`, String(val), String(darkVal));
    }
    for (const [key, val] of Object.entries(fixedAliases)) {
      const kebab = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      add(kebab, String(val), String(val));
    }
    for (let i = 1; i <= 5; i++) {
      const l = customSeeds[`chart${i}`] ?? "";
      const d = customSeeds[`chart${i}Dark`] ?? l;
      add(`chart-${i}`, l, d);
    }
  }

  return entries;
}

function resolveTokens(): DesignTokenEntry[] {
  if ("tokens" in doc && Array.isArray((doc as TokensV1).tokens)) {
    return (doc as TokensV1).tokens;
  }
  if ("version" in doc && (doc as TokensV2).version === 2) {
    return buildFromV2(doc as TokensV2);
  }
  return [];
}

export const DESIGN_TOKENS: DesignTokenEntry[] = resolveTokens();

export function tokensByCategory(): Record<string, DesignTokenEntry[]> {
  const map: Record<string, DesignTokenEntry[]> = {};
  for (const t of DESIGN_TOKENS) {
    const k = t.category || "other";
    if (!map[k]) map[k] = [];
    map[k].push(t);
  }
  return map;
}
