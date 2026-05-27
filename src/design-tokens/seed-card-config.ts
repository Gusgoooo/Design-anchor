/**
 * Seed groupings for the Create-style token customizer.
 *
 * Each group becomes one card in the left panel. Top of the card lists the
 * editable seeds; underneath is a collapsible "Derived" section listing every
 * tokens.json-derived variable that matches one of the prefixes or exact ids.
 *
 * Source of truth is `tokens.json` (`seed`, `seedDark`, `customSeeds`,
 * `fixedAliases`). The derived prefixes mirror what `seed-to-map.mjs` emits.
 */

export type EditorKind = "color" | "length" | "generic";

/** Where the seed value lives in tokens.json. */
export type SeedSource = "seed" | "customSeeds" | "fixedAliases";

/**
 * Slider config for length seeds whose underlying token is a *multiplier* on
 * the rest of the scale (e.g. sizeUnit). A constrained slider replaces the
 * free-form length input so a careless drag can't 50%-balloon every spacing
 * token at once. Power users can still hand-edit tokens.json beyond range.
 */
export type SliderConfig = {
  min: number;
  max: number;
  step: number;
  labels?: Array<{ value: number; label: string }>;
};

export type SeedDef = {
  key: string;
  label: string;
  source: SeedSource;
  editor: EditorKind;
  slider?: SliderConfig;
};

export type DerivedFilter = {
  /** Prefix match against token id. */
  prefixes?: string[];
  /** Exact id match. */
  exactIds?: string[];
};

export type SeedGroup = {
  title: string;
  seeds: SeedDef[];
  derived: DerivedFilter;
  /** Optional sub-grouping of derived rows (Text / Border / Fill / Background, etc.). */
  derivedSubGroups?: { title: string; match: (id: string) => boolean }[];
};

export const SEED_GROUPS: SeedGroup[] = [
  {
    title: "Brand · Primary",
    seeds: [{ key: "colorPrimary", label: "colorPrimary", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-primary"] },
  },
  {
    title: "Success",
    seeds: [{ key: "colorSuccess", label: "colorSuccess", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-success"] },
  },
  {
    title: "Warning",
    seeds: [{ key: "colorWarning", label: "colorWarning", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-warning"] },
  },
  {
    title: "Error",
    seeds: [{ key: "colorError", label: "colorError", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-error"] },
  },
  {
    // Info covers both info-* and link-* derived tokens — seed-to-map's
    // genColorMapToken falls back `colorLink || colorInfo` so removing the
    // separate Link seed makes link three-states (link / link-hover /
    // link-active) automatically follow Info's hue. Most products use the
    // same color for both anyway.
    title: "Info",
    seeds: [{ key: "colorInfo", label: "colorInfo", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-info", "color-link"] },
  },
  {
    // Surfaces owns the ink (colorTextBase) + canvas (colorBgBase) seeds.
    // Derived block surfaces only the 11 shadcn semantic slots that designers
    // actually micro-tune (card / popover / muted / accent / border / input /
    // ring + secondary pair). The antd color-bg-* / color-text-* / color-fill-*
    // / color-border-* ladders and the redundant background/foreground/primary/
    // destructive aliases are still emitted by seed-to-map (so components keep
    // working) but hidden from the Customizer to avoid choice overload.
    title: "Surfaces",
    seeds: [
      { key: "colorBgBase", label: "colorBgBase", source: "seed", editor: "color" },
      { key: "colorTextBase", label: "colorTextBase", source: "seed", editor: "color" },
    ],
    derived: {
      exactIds: [
        "card", "popover",
        "secondary", "secondary-foreground",
        "muted", "muted-foreground",
        "accent", "accent-foreground",
        "border", "input", "ring",
      ],
    },
  },
  {
    title: "Radius",
    seeds: [{ key: "borderRadius", label: "borderRadius", source: "seed", editor: "length" }],
    derived: { prefixes: ["border-radius"] },
  },
  {
    title: "Charts",
    seeds: [
      { key: "chart1", label: "chart1", source: "customSeeds", editor: "color" },
      { key: "chart2", label: "chart2", source: "customSeeds", editor: "color" },
      { key: "chart3", label: "chart3", source: "customSeeds", editor: "color" },
      { key: "chart4", label: "chart4", source: "customSeeds", editor: "color" },
      { key: "chart5", label: "chart5", source: "customSeeds", editor: "color" },
    ],
    derived: { prefixes: ["chart-"] },
  },
  {
    title: "Typography",
    seeds: [
      { key: "fontSize", label: "fontSize", source: "seed", editor: "length" },
    ],
    derived: { prefixes: ["font-size", "line-height", "font-weight"] },
    derivedSubGroups: [
      { title: "Font Size", match: (id) => id.startsWith("font-size") },
      { title: "Line Height", match: (id) => id.startsWith("line-height") },
      { title: "Font Weight", match: (id) => id.startsWith("font-weight") },
    ],
  },
  {
    title: "Spacing",
    seeds: [
      {
        key: "sizeUnit",
        label: "sizeUnit",
        source: "seed",
        editor: "length",
        slider: {
          min: 3.5,
          max: 5,
          step: 0.25,
          labels: [
            { value: 3.5, label: "Compact" },
            { value: 4, label: "Default" },
            { value: 5, label: "Spacious" },
          ],
        },
      },
    ],
    derived: { prefixes: ["spacing-"] },
  },
  {
    title: "Shadow",
    seeds: [],
    derived: { prefixes: ["elevation"] },
  },
];

/** Localized group titles (Chinese). Falls back to the English title key when missing. */
export const SEED_GROUP_TITLE_ZH: Record<string, string> = {
  "Brand · Primary": "品牌主色",
  "Success": "成功色",
  "Warning": "警告色",
  "Error": "错误色",
  "Info": "信息 / 链接色",
  "Surfaces": "表面",
  "Radius": "圆角",
  "Charts": "图表",
  "Typography": "字号",
  "Spacing": "间距",
  "Shadow": "阴影",
};

export function matchesDerivedFilter(id: string, filter: DerivedFilter): boolean {
  if (filter.exactIds?.includes(id)) return true;
  if (filter.prefixes?.some((p) => id.startsWith(p))) return true;
  return false;
}
