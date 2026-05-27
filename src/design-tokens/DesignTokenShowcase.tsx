import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DesignTokenEntry } from "./token-registry";
import spacingScale from "./spacing-scale.generated.json";

type SpacingStepLabelJson = { suffix: string; zh: string; en: string };

/* ────────────────────────────────────────────────────────────────────────── */
/*  Chinese label mapping for all derived (map/alias) tokens                 */
/* ────────────────────────────────────────────────────────────────────────── */

const TOKEN_ZH: Record<string, string> = {
  // Primary
  "color-primary-bg": "Primary light background",
  "color-primary-bg-hover": "Primary light background hover",
  "color-primary-border": "Primary border",
  "color-primary-border-hover": "Primary border hover",
  "color-primary-hover": "Primary hover",
  "color-primary": "Brand primary",
  "color-primary-active": "Primary active",
  "color-primary-text-hover": "Primary text hover",
  "color-primary-text": "Primary text",
  "color-primary-text-active": "Primary text active",

  // Success
  "color-success-bg": "Success light background",
  "color-success-bg-hover": "Success light background hover",
  "color-success-border": "Success border",
  "color-success-border-hover": "Success border hover",
  "color-success-hover": "Success dark hover",
  "color-success": "Success",
  "color-success-active": "Success dark active",
  "color-success-text-hover": "Success text hover",
  "color-success-text": "Success text default",
  "color-success-text-active": "Success text active",

  // Warning
  "color-warning-bg": "Warning light background",
  "color-warning-bg-hover": "Warning light background hover",
  "color-warning-border": "Warning border",
  "color-warning-border-hover": "Warning border hover",
  "color-warning-hover": "Warning dark hover",
  "color-warning": "Warning",
  "color-warning-active": "Warning dark active",
  "color-warning-text-hover": "Warning text hover",
  "color-warning-text": "Warning text default",
  "color-warning-text-active": "Warning text active",

  // Error
  "color-error-bg": "Error light background",
  "color-error-bg-hover": "Error light background hover",
  "color-error-bg-active": "Error light background active",
  "color-error-border": "Error border",
  "color-error-border-hover": "Error border hover",
  "color-error-hover": "Error dark hover",
  "color-error": "Error",
  "color-error-active": "Error dark active",
  "color-error-text-hover": "Error text hover",
  "color-error-text": "Error text default",
  "color-error-text-active": "Error text active",

  // Info
  "color-info-bg": "Info light background",
  "color-info-bg-hover": "Info light background hover",
  "color-info-border": "Info border",
  "color-info-border-hover": "Info border hover",
  "color-info-hover": "Info dark hover",
  "color-info": "Info",
  "color-info-active": "Info dark active",
  "color-info-text-hover": "Info text hover",
  "color-info-text": "Info text default",
  "color-info-text-active": "Info text active",

  // Link
  "color-link": "Link",
  "color-link-hover": "Link hover",
  "color-link-active": "Link active",

  // Neutral — text
  "color-text": "Primary text",
  "color-text-secondary": "Secondary text",
  "color-text-tertiary": "Tertiary text",
  "color-text-quaternary": "Quaternary text",
  // Neutral — border
  "color-border": "Primary border",
  "color-border-secondary": "Secondary border",
  // Neutral — fill
  "color-fill": "Primary fill",
  "color-fill-secondary": "Secondary fill",
  "color-fill-tertiary": "Tertiary fill",
  "color-fill-quaternary": "Quaternary fill",
  // Neutral — bg
  "color-bg-base": "Base background",
  "color-bg-layout": "Layout background",
  "color-bg-container": "Container background",
  "color-bg-elevated": "Elevated container background",
  "color-bg-spotlight": "Spotlight background",
  "color-bg-solid": "Solid background",
  "color-bg-solid-hover": "Solid background hover",
  "color-bg-solid-active": "Solid background active",
  "color-bg-mask": "Overlay mask background",
  "color-border-disabled": "Disabled border",
  "color-white": "Pure white",
  "color-shadow": "Shadow color",

  // Semantic (shadcn)
  background: "Global background",
  foreground: "Global foreground text",
  card: "Card background",
  "card-foreground": "Card text",
  popover: "Popover background",
  "popover-foreground": "Popover text",
  primary: "Primary",
  "primary-foreground": "Primary foreground",
  secondary: "Secondary fill",
  "secondary-foreground": "Secondary foreground",
  muted: "Muted background",
  "muted-foreground": "Muted text",
  accent: "Accent fill",
  "accent-foreground": "Accent foreground",
  destructive: "Destructive",
  border: "Border",
  input: "Input border",
  ring: "Focus ring",

  // Sidebar
  sidebar: "Sidebar background",
  "sidebar-foreground": "Sidebar text",
  "sidebar-primary": "Sidebar primary",
  "sidebar-primary-foreground": "Sidebar primary foreground",
  "sidebar-accent": "Sidebar accent fill",
  "sidebar-accent-foreground": "Sidebar accent text",
  "sidebar-border": "Sidebar border",
  "sidebar-ring": "Sidebar focus ring",

  // Typography
  "font-size-sm": "Small font size",
  "font-size": "Default font size",
  "font-size-lg": "Large font size",
  "font-size-xl": "Extra-large font size",
  "font-size-heading-1": "Heading 1 font size",
  "font-size-heading-2": "Heading 2 font size",
  "font-size-heading-3": "Heading 3 font size",
  "font-size-heading-4": "Heading 4 font size",
  "font-size-heading-5": "Heading 5 font size",
  "line-height": "Default line height",
  "line-height-sm": "Small line height",
  "line-height-lg": "Large line height",
  "font-weight-medium": "Medium font weight",
  "font-weight-semibold": "Semibold font weight",
  "font-family": "Body font family",
  "font-family-code": "Code font family",

  // Radius
  "border-radius": "Base border radius",
  "border-radius-xs": "XS border radius",
  "border-radius-sm": "SM border radius",
  "border-radius-lg": "LG border radius",
  "border-radius-xl": "XL border radius",
  "border-radius-outer": "Outer border radius",

  // spacing-/padding-/margin-: spacingTokenZh
  // Shadow
  "elevation-sm": "Shadow level 1",
  elevation: "Shadow level 2",
  "elevation-md": "Shadow level 3",
  "elevation-lg": "Shadow level 4",
  "elevation-inner": "Inner shadow",

  // Motion
  "motion-duration-fast": "Fast motion",
  "motion-duration-150": "Transition 150ms",
  "motion-duration-mid": "Medium motion",
  "motion-duration-slow": "Slow motion",

  // Border
  "line-width": "Line width",
  "line-width-bold": "Bold line width",
  "border-width-hairline": "Hairline border",
  "border-width-0": "Zero border",
  "ring-width": "Focus ring width",
  "ring-offset": "Focus ring offset",

  // Opacity
  "opacity-disabled": "Disabled opacity",
  "opacity-muted": "Muted opacity",
  "opacity-subtle": "Subtle opacity",

  // Z-index
  "z-base": "Base z-index",
  "z-dropdown": "Dropdown z-index",
  "z-modal": "Modal z-index",
  "z-tooltip": "Tooltip z-index",

  // Chart
  "chart-1": "Chart color 1",
  "chart-2": "Chart color 2",
  "chart-3": "Chart color 3",
  "chart-4": "Chart color 4",
  "chart-5": "Chart color 5",

  "elevation-none": "No shadow",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Seed category definition — maps each seed key to its derived tokens      */
/* ────────────────────────────────────────────────────────────────────────── */

type SeedSection = {
  title: string;
  seedKeys: string[];
  editorType: "color" | "number" | "text";
  mapTokenPrefixes: string[];
  exactTokenIds?: string[];
  mapSubGroups?: { title: string; filter: (id: string) => boolean }[];
};

const SEED_SECTIONS: SeedSection[] = [
  {
    title: "Brand Color",
    seedKeys: ["colorPrimary"],
    editorType: "color",
    mapTokenPrefixes: ["color-primary"],
    mapSubGroups: undefined,
  },
  {
    title: "Success Color",
    seedKeys: ["colorSuccess"],
    editorType: "color",
    mapTokenPrefixes: ["color-success"],
  },
  {
    title: "Warning Color",
    seedKeys: ["colorWarning"],
    editorType: "color",
    mapTokenPrefixes: ["color-warning"],
  },
  {
    title: "Error Color",
    seedKeys: ["colorError"],
    editorType: "color",
    mapTokenPrefixes: ["color-error"],
  },
  {
    title: "Info Color",
    seedKeys: ["colorInfo"],
    editorType: "color",
    mapTokenPrefixes: ["color-info"],
  },
  {
    title: "Link Color",
    seedKeys: ["colorLink"],
    editorType: "color",
    mapTokenPrefixes: ["color-link"],
  },
  {
    title: "Neutral Colors",
    seedKeys: ["colorTextBase", "colorBgBase"],
    editorType: "color",
    mapTokenPrefixes: ["color-text", "color-fill", "color-bg", "color-border", "color-white", "color-shadow"],
    mapSubGroups: [
      { title: "Text", filter: (id) => id.startsWith("color-text") },
      { title: "Border", filter: (id) => id.startsWith("color-border") },
      { title: "Fill", filter: (id) => id.startsWith("color-fill") },
      { title: "Background", filter: (id) => id.startsWith("color-bg") },
      { title: "Other", filter: (id) => id === "color-white" || id === "color-shadow" },
    ],
  },
  {
    title: "Semantic Color Mapping",
    seedKeys: [],
    editorType: "color",
    mapTokenPrefixes: [],
    exactTokenIds: [
      "background", "foreground", "card", "card-foreground",
      "popover", "popover-foreground", "primary", "primary-foreground",
      "secondary", "secondary-foreground", "muted", "muted-foreground",
      "accent", "accent-foreground", "destructive",
      "border", "input", "ring",
    ],
  },
  {
    title: "Sidebar Colors",
    seedKeys: [],
    editorType: "color",
    mapTokenPrefixes: ["sidebar"],
  },
  {
    title: "Chart Colors",
    seedKeys: [],
    editorType: "color",
    mapTokenPrefixes: ["chart-"],
  },
  {
    title: "Typography",
    seedKeys: ["fontSize"],
    editorType: "number",
    mapTokenPrefixes: ["font-size", "line-height", "font-weight", "font-family"],
    mapSubGroups: [
      { title: "Font Size", filter: (id) => id.startsWith("font-size") },
      { title: "Line Height", filter: (id) => id.startsWith("line-height") },
      { title: "Font Weight", filter: (id) => id.startsWith("font-weight") },
      { title: "Font Family", filter: (id) => id.startsWith("font-family") },
    ],
  },
  {
    title: "Spacing",
    seedKeys: ["sizeStep", "sizeUnit"],
    editorType: "number",
    mapTokenPrefixes: ["spacing-"],
  },
  {
    title: "Border Radius",
    seedKeys: ["borderRadius"],
    editorType: "number",
    mapTokenPrefixes: ["border-radius"],
  },
  {
    title: "Shadow",
    seedKeys: [],
    editorType: "text",
    mapTokenPrefixes: ["elevation"],
  },
  {
    title: "Motion",
    seedKeys: ["motionUnit", "motionBase"],
    editorType: "number",
    mapTokenPrefixes: ["motion-duration"],
  },
  {
    title: "Border",
    seedKeys: ["lineWidth"],
    editorType: "number",
    mapTokenPrefixes: ["line-width", "border-width", "ring-width", "ring-offset"],
  },
  {
    title: "Opacity",
    seedKeys: [],
    editorType: "number",
    mapTokenPrefixes: ["opacity"],
  },
  {
    title: "Z-Index",
    seedKeys: ["zIndexBase", "zIndexPopupBase"],
    editorType: "number",
    mapTokenPrefixes: ["z-"],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Inline color swatch                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function isColor(v: string): boolean {
  if (!v) return false;
  return /^(#|rgb|rgba|hsl|hsla|oklch|oklab)/.test(v.trim());
}

function ColorSwatch({ value, size = 32 }: { value: string; size?: number }) {
  const transparent = !value || !isColor(value);
  return (
    <div
      className="shrink-0 rounded border border-border"
      style={{
        width: size,
        height: size,
        background: transparent
          ? "repeating-conic-gradient(#e5e7eb 0% 25%,transparent 0% 50%) 0 0 / 8px 8px"
          : value,
      }}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Derived token row                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** spacing / padding / margin numeric step label */
function spacingTokenZh(id: string): string {
  const m = id.match(/^(spacing|space|padding|margin)-(.+)$/);
  if (!m) return "";
  const [, kind, rawSuf] = m;
  const suffix = rawSuf.replace(/\\\./g, ".");
  const labels = spacingScale.stepLabels as SpacingStepLabelJson[];
  const row = labels.find((l) => l.suffix === suffix);
  const pair = row ? `${row.zh} / ${row.en}` : null;
  const kindHint = kind === "padding" ? "padding" : kind === "margin" ? "margin" : "spacing";
  if (pair) return `${kindHint} · ${pair}`;
  return `${kindHint} · ${suffix}`;
}

function MapTokenRow({
  token,
  darkMode,
  onEdit,
}: {
  token: DesignTokenEntry;
  darkMode?: boolean;
  onEdit?: (t: DesignTokenEntry) => void;
}) {
  const zh = TOKEN_ZH[token.id] ?? spacingTokenZh(token.id);
  const val = darkMode ? token.dark : token.light;
  const color = isColor(val);

  return (
    <div
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onClick={onEdit ? () => onEdit(token) : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit(token);
              }
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors",
        onEdit && "cursor-pointer",
      )}
    >
      <span className="min-w-0 flex-1 text-sm text-foreground truncate">
        {zh ? <>{zh} <span className="text-muted-foreground">{token.id}</span></> : token.id}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums max-w-[140px] truncate text-right" title={val}>
        {val}
      </span>
      {color ? (
        <ColorSwatch value={val} size={28} />
      ) : /^\d/.test(val) && (val.endsWith("px") || !val.includes(" ")) ? (
        <div
          className="shrink-0 rounded bg-primary/20 border border-primary/30"
          style={{
            width: Math.min(Math.max(parseFloat(val) || 0, 4), 48),
            height: 28,
          }}
        />
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Collapsible sub-group within map tokens                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function MapSubGroup({
  title,
  tokens,
  darkMode,
  onTokenEdit,
}: {
  title: string;
  tokens: DesignTokenEntry[];
  darkMode?: boolean;
  onTokenEdit?: (t: DesignTokenEntry) => void;
}) {
  const [open, setOpen] = React.useState(true);
  if (!tokens.length) return null;
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && tokens.map((t) => <MapTokenRow key={t.id} token={t} darkMode={darkMode} onEdit={onTokenEdit} />)}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Seed editor controls (inline in the card header)                         */
/* ────────────────────────────────────────────────────────────────────────── */

function SeedColorInput({
  seedKey,
  displayLabel,
  value,
  onChange,
}: {
  seedKey: string;
  displayLabel: string;
  value: string;
  onChange: (seedKey: string, val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground min-w-0 max-w-[220px] leading-snug">{displayLabel}</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2">
        <input
          type="color"
          value={value.startsWith("#") ? value.slice(0, 7) : "#000000"}
          onChange={(e) => onChange(seedKey, e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(seedKey, e.target.value)}
          className="w-24 border-0 bg-transparent font-mono text-sm text-foreground outline-none"
        />
      </div>
    </div>
  );
}

function SeedNumberInput({
  seedKey,
  displayLabel,
  value,
  onChange,
}: {
  seedKey: string;
  displayLabel: string;
  value: number | string;
  onChange: (seedKey: string, val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground min-w-0 max-w-[220px] leading-snug">{displayLabel}</span>
      <input
        type="number"
        value={value}
        step="any"
        onChange={(e) => onChange(seedKey, e.target.value)}
        className="w-24 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Seed section card                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function SeedSectionCard({
  section,
  seeds,
  allTokens,
  onSeedChange,
  darkMode,
  onTokenEdit,
}: {
  section: SeedSection;
  seeds: Record<string, string | number>;
  allTokens: DesignTokenEntry[];
  onSeedChange: (seedKey: string, value: string) => void;
  darkMode?: boolean;
  onTokenEdit?: (t: DesignTokenEntry) => void;
}) {
  const [mapOpen, setMapOpen] = React.useState(false);

  const mapTokens = React.useMemo(() => {
    const exactSet = section.exactTokenIds ? new Set(section.exactTokenIds) : null;
    return allTokens.filter((t) => {
      if (t.category === "seed") return false;
      if (exactSet?.has(t.id)) return true;
      return section.mapTokenPrefixes.some((prefix) => t.id.startsWith(prefix));
    });
  }, [allTokens, section.mapTokenPrefixes, section.exactTokenIds]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header: title left, controls right, vertically centered */}
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <h3 className="shrink-0 text-sm font-medium text-foreground">{section.title}</h3>
        {section.seedKeys.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-4">
            {section.seedKeys.map((key) => {
              const val = seeds[key];
              if (val === undefined) return null;
              const displayLabel = key;
              if (section.editorType === "color") {
                return (
                  <SeedColorInput
                    key={key}
                    seedKey={key}
                    displayLabel={displayLabel}
                    value={String(val)}
                    onChange={onSeedChange}
                  />
                );
              }
              return (
                <SeedNumberInput
                  key={key}
                  seedKey={key}
                  displayLabel={displayLabel}
                  value={val}
                  onChange={onSeedChange}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Map tokens collapsible */}
      {mapTokens.length > 0 && (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
            onClick={() => setMapOpen(!mapOpen)}
          >
            {mapOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Derived Map Tokens</span>
            <span className="ml-auto text-xs tabular-nums">{mapTokens.length}</span>
          </button>
          {mapOpen && (
            <div className="border-t border-border/50 bg-muted/5">
              {section.mapSubGroups ? (
                section.mapSubGroups.map((sg) => {
                  const filtered = mapTokens.filter((t) => sg.filter(t.id));
                  return (
                    <MapSubGroup
                      key={sg.title}
                      title={sg.title}
                      tokens={filtered}
                      darkMode={darkMode}
                      onTokenEdit={onTokenEdit}
                    />
                  );
                })
              ) : (
                mapTokens.map((t) => (
                  <MapTokenRow key={t.id} token={t} darkMode={darkMode} onEdit={onTokenEdit} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Public API                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export type DesignTokenShowcaseProps = {
  embedded?: boolean;
  liveTokens?: DesignTokenEntry[] | null;
  seeds?: Record<string, string | number>;
  onSeedChange?: (seedKey: string, value: string) => void;
  darkMode?: boolean;
  /** Click on a derived token row: writes to mapOverrides.light / .dark based on current darkMode */
  onTokenEdit?: (token: DesignTokenEntry) => void;
  onColorPick?: (token: DesignTokenEntry, field: "light" | "dark") => void;
  colorSelection?: { tokenId: string; field: "light" | "dark" } | null;
};

export function DesignTokenShowcase({
  embedded,
  liveTokens,
  seeds,
  onSeedChange,
  darkMode,
  onTokenEdit,
}: DesignTokenShowcaseProps) {
  const allTokens = liveTokens ?? [];
  const seedMap = seeds ?? {};
  const handleSeedChange = onSeedChange ?? (() => {});

  return (
    <div
      className={cn(
        "w-full min-w-0 bg-background text-foreground dark:bg-card",
        embedded ? "" : "min-h-screen px-4 py-8 sm:px-6 lg:px-8",
      )}
    >
      <div className="flex w-full min-w-0 flex-col gap-5">
        {SEED_SECTIONS.map((section) => (
          <SeedSectionCard
            key={section.title}
            section={section}
            seeds={seedMap}
            allTokens={allTokens}
            onSeedChange={handleSeedChange}
            darkMode={darkMode}
            onTokenEdit={onTokenEdit}
          />
        ))}
      </div>
    </div>
  );
}
