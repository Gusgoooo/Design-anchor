/**
 * DesignAccord "brain" -- the universal ComponentSpec type system for all components.
 * JSON Spec (`components/*.spec.json`) and TS share the same shape; in JSON `styleLock.blacklist[].pattern` only supports **strings** (regex literals cannot be serialized).
 */

/** Pattern form used by JSON / persistence layer (see StyleLockRule) */
export type StyleLockPatternString = string;

/** Locking strategy for a single Tailwind / arbitrary className field */
export type ClassSource = "consumer" | "internal" | "designToken";

export interface StyleLockRule {
  /** Human-readable description, written into .cursorrules */
  description: string;
  /**
   * Matches a "full class token" or substring.
   * - In **JSON spec**: use only string-form regex source, e.g. `"^p-"`.
   * - In **pure TS** (when using `defineComponentSpec`): can be `RegExp`.
   */
  pattern: StyleLockPatternString | RegExp;
  /** If set, strip from merged result only when className source is consumer */
  stripWhen?: ClassSource[];
}

export interface StyleLock {
  /**
   * Design tokens: internal baseline class names (semantics that cannot be overridden by consumers, derived from density mappings, etc.).
   * Written into component implementation, not hand-written by AI.
   */
  baselineTokens: string[];
  /**
   * Blacklist: rules to strip when merging consumer `className` (spacing, border, brand colors, etc.).
   */
  blacklist: StyleLockRule[];
  /**
   * Safe prefixes that consumers are allowed to append (optional allowlist for progressive tightening).
   * If not set: any "non-conflicting" extension is allowed except those in the blacklist.
   */
  allowedConsumerPrefixes?: string[];
}

/** Props description at the Schema layer (shared by code generation, Portal, and rule copy) */
export interface PropSemanticSpec {
  name: string;
  /** Description for designers / AI */
  description: string;
  /** TS type string, for Portal and documentation generation */
  type: string;
  required: boolean;
  /**
   * Business semantic value -> internal tailwind / token list (locked mapping; AI must not hand-write class names outside this mapping).
   * Uses Partial: different props within the same spec may have different enumMap key sets (e.g. density vs variant).
   */
  enumMap?: Partial<Record<string, readonly string[]>>;
  defaultValue?: string | number | boolean;
}

/** Native HTML tags forbidden in the corresponding business semantic context (drives "Forbidden" and accord-audit) */
export interface ForbiddenPattern {
  /** e.g. table, button */
  htmlTag: string;
  reason: string;
  /** The business component import path to use instead */
  useInstead: string;
}

/** AI correction: violation pattern -> fix guidance */
export interface AiCorrection {
  id: string;
  /** Describes the violation (reusable by linter) */
  violation: string;
  /** Natural language instruction for AI */
  fixPrompt: string;
}

/** Component category in directory / Portal (for extending the full component family) */
export type ComponentCategory =
  | "data-display"
  | "form"
  | "feedback"
  | "navigation"
  | "layout"
  | "action"
  | "other";

/** Upstream sub-component export symbol; can be split from display name, used by Spec / rule copy */
export interface WrapPrimitiveRef {
  /** Symbol consistent with `wraps.module` export, e.g. `DialogContent`, `TableCell` */
  symbol: string;
  /**
   * Human-readable name for collaborators / models (e.g. "Dialog Content", "Table Body Row").
   * When omitted or same as symbol, the persisted JSON can use the string shorthand.
   */
  displayName?: string;
}

/** JSON allows `string` shorthand, equivalent to `{ symbol: thatString }` */
export type WrapPrimitiveInput = string | WrapPrimitiveRef;

export interface WrapsSpec {
  /** For display, e.g. @/components/ui/table */
  module: string;
  /** Composite export list (order is the recommended assembly order) */
  primitives: WrapPrimitiveInput[];
}

export interface ComponentSpecMeta {
  owner?: string;
  tags?: string[];
  /** Default JSON filename opened in Design Portal (corresponds to `components/*.spec.json`) */
  portalConfigFile?: string;
  category?: ComponentCategory;
  /** Lifecycle marker (Portal / docs can filter by this) */
  status?: "experimental" | "stable" | "deprecated";
  /**
   * Optional: declares semantic extension of another spec (for docs and AI prompts; runtime merging must be implemented separately).
   */
  extendsSpecId?: string;
}

/** Short usage examples for AI / designers (not used by linter; `npm run sync:accord` writes to .cursorrules few-shot) */
export interface ComponentExample {
  title: string;
  description?: string;
  /** JSX or JSX-like snippet */
  snippet: string;
}

/**
 * Universal contract for all components: first validated with DataTable (BusinessTable).
 * When adding new components like Button / Input / Form, copy this structure and add a `*.spec.json` to plug into the same sync / audit / Portal pipeline.
 */
export interface ComponentSpec {
  /** Stable id, e.g. data-table */
  id: string;
  /** Exported component name, e.g. DataTable */
  componentName: string;
  version: `${number}.${number}.${number}`;
  /** Business intent: when to use, what problem it solves */
  intent: string;
  /** Wrapped upstream (Shadcn / Radix etc.) */
  wraps: WrapsSpec;
  /** Props that must be explicitly declared and documented from Schema / Props */
  requiredProps: PropSemanticSpec[];
  optionalProps?: PropSemanticSpec[];
  styleLock: StyleLock;
  /**
   * Spec directives: short clauses for code assistants (human-readable, written into .cursorrules).
   * Differs from intent: intent focuses on business scenarios; this field focuses on actionable collaboration constraints (imports, variants, forbidden hand-written classes, etc.).
   */
  aiPrompt: string;
  forbidden?: ForbiddenPattern[];
  corrections?: AiCorrection[];
  /** Reference priority: path prefixes to force lookup */
  referencePriority: string[];
  meta?: ComponentSpecMeta;
  /**
   * Optional override layer for **each Story variant** in the Storybook sidebar (key = `getCurrentStoryData().id`, e.g. `datatable--playground`).
   * Deep-merged with top-level fields for Accord panel editing; undeclared variants inherit the top-level "component baseline".
   * Code-side JSON imports can still read only the top level; the variant layer mainly enters .cursorrules / collaboration prompts.
   */
  storyAccord?: Record<string, Partial<Omit<ComponentSpec, "storyAccord">>>;
  /** Usage examples (optional; for documentation generation and automated prompts) */
  examples?: ComponentExample[];
  /**
   * Aggregated by Portal / sync into `tailwind.accord.generated.ts`, then referenced by root `tailwind.config.ts`.
   * (The planned "update tailwind.config" is implemented in this repo as: update the generated file + config already imports it.)
   */
  tailwindExtend?: {
    spacing?: Record<string, string>;
    colors?: Record<string, string>;
    borderRadius?: Record<string, string>;
  };
}

/** Registry file export shape */
export type ComponentSpecRegistry = Record<string, ComponentSpec>;

/** Enumerates "no-override" categories before merging (for runtime and documentation presets) */
export const STYLE_LOCK_CATEGORY_PRESETS = {
  spacing: [/^p-/, /^px-/, /^py-/, /^pt-/, /^pb-/, /^pl-/, /^pr-/, /^m-/, /^mx-/, /^my-/, /^mt-/, /^mb-/, /^ml-/, /^mr-/, /^gap-/, /^space-[xy]-/, /^scroll-p/],
  border: [/^border/, /^rounded/, /^ring/, /^outline/, /^divide-/],
  brandColor: [
    /^bg-(primary|secondary|destructive|accent|muted|popover|card)/,
    /^text-(primary|secondary|destructive|accent|muted|foreground)/,
    /^border-(primary|secondary|input|ring)/,
    /^from-/, /^to-/, /^via-/,
  ],
} as const;

export function defineComponentSpec(spec: ComponentSpec): ComponentSpec {
  return spec;
}

/** Normalizes JSON primitives into an object array (for editor and merging logic) */
export function normalizePrimitives(list: WrapPrimitiveInput[] | undefined | null): WrapPrimitiveRef[] {
  if (!list?.length) return [];
  const out: WrapPrimitiveRef[] = [];
  for (const p of list) {
    if (typeof p === "string") {
      const symbol = p.trim();
      if (symbol) out.push({ symbol });
    } else if (p && typeof p === "object" && typeof (p as WrapPrimitiveRef).symbol === "string") {
      const symbol = (p as WrapPrimitiveRef).symbol.trim();
      if (!symbol) continue;
      const dn = (p as WrapPrimitiveRef).displayName?.trim();
      if (dn && dn !== symbol) out.push({ symbol, displayName: dn });
      else out.push({ symbol });
    }
  }
  return out;
}

/** When writing back to JSON, prefer string shorthand to minimize diff */
export function serializePrimitives(list: WrapPrimitiveRef[]): WrapPrimitiveInput[] {
  return list.map((p) =>
    p.displayName && p.displayName.trim() && p.displayName.trim() !== p.symbol
      ? { symbol: p.symbol, displayName: p.displayName.trim() }
      : p.symbol,
  );
}

/**
 * Gets the "primary reference path" from spec (for docs / templates; equivalent to `referencePriority[0]`).
 */
export function primaryReference(spec: ComponentSpec): string | undefined {
  return spec.referencePriority[0];
}
