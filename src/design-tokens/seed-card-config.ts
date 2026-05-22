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

export type SeedDef = {
  key: string;
  label: string;
  source: SeedSource;
  editor: EditorKind;
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
    title: "Info",
    seeds: [{ key: "colorInfo", label: "colorInfo", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-info"] },
  },
  {
    title: "Link",
    seeds: [{ key: "colorLink", label: "colorLink", source: "seed", editor: "color" }],
    derived: { prefixes: ["color-link"] },
  },
  {
    // Surfaces owns the ink (colorTextBase) + canvas (colorBgBase) seeds.
    // All derived neutrals — antd's color-bg-* / color-text-* / color-fill-*
    // / color-border-* ladder AND shadcn's 18 semantic names (background /
    // foreground / primary / muted / accent / border / ring / …) — flow
    // from those two seeds and live under this card's Derived block. Any
    // semantic slot can be individually tuned by opening its Derived row
    // (writes to mapOverrides[branch] under the hood).
    title: "Surfaces",
    seeds: [
      { key: "colorBgBase", label: "colorBgBase", source: "seed", editor: "color" },
      { key: "colorTextBase", label: "colorTextBase", source: "seed", editor: "color" },
    ],
    derived: {
      prefixes: ["color-bg", "color-text", "color-border", "color-fill", "color-white", "color-shadow"],
      exactIds: [
        "background", "foreground", "card", "card-foreground",
        "popover", "popover-foreground", "primary", "primary-foreground",
        "secondary", "secondary-foreground", "muted", "muted-foreground",
        "accent", "accent-foreground", "destructive",
        "border", "input", "ring",
      ],
    },
    derivedSubGroups: [
      { title: "Semantic", match: (id) => [
        "background", "foreground", "card", "card-foreground",
        "popover", "popover-foreground", "primary", "primary-foreground",
        "secondary", "secondary-foreground", "muted", "muted-foreground",
        "accent", "accent-foreground", "destructive",
        "border", "input", "ring",
      ].includes(id) },
      { title: "Text", match: (id) => id.startsWith("color-text") },
      { title: "Border", match: (id) => id.startsWith("color-border") },
      { title: "Fill", match: (id) => id.startsWith("color-fill") },
      { title: "Background", match: (id) => id.startsWith("color-bg") },
      { title: "Other", match: (id) => id === "color-white" || id === "color-shadow" },
    ],
  },
  {
    title: "Radius",
    seeds: [{ key: "borderRadius", label: "borderRadius", source: "seed", editor: "length" }],
    derived: { prefixes: ["border-radius"] },
  },
  {
    title: "Sidebar",
    seeds: [],
    derived: { prefixes: ["sidebar"] },
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
      { key: "sizeUnit", label: "sizeUnit", source: "seed", editor: "length" },
    ],
    derived: { prefixes: ["spacing-"] },
  },
  {
    title: "Shadow",
    seeds: [],
    derived: { prefixes: ["elevation"] },
  },
];

export function matchesDerivedFilter(id: string, filter: DerivedFilter): boolean {
  if (filter.exactIds?.includes(id)) return true;
  if (filter.prefixes?.some((p) => id.startsWith(p))) return true;
  return false;
}
