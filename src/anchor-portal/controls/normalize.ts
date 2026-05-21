import type { ArgType, ControlShorthand } from "../argTypes-types";

export type NormalizedControl =
  | { kind: "boolean" }
  | { kind: "text"; multiline?: boolean }
  | { kind: "number"; min?: number; max?: number; step?: number }
  | { kind: "range"; min?: number; max?: number; step?: number }
  | { kind: "select"; options: unknown[]; labels?: Record<string, string>; multi?: boolean }
  | { kind: "radio"; options: unknown[]; labels?: Record<string, string>; inline?: boolean }
  | { kind: "check"; options: unknown[]; labels?: Record<string, string>; inline?: boolean }
  | { kind: "color"; presets?: ReadonlyArray<string> }
  | { kind: "date" }
  | { kind: "object" }
  | { kind: "file" }
  | { kind: "disabled" }
  | { kind: "unknown" };

export type NormalizedArgType = {
  argName: string;
  displayName: string;
  description?: string;
  category: string | null;
  subcategory: string | null;
  defaultValueSummary?: string;
  typeSummary?: string;
  control: NormalizedControl;
  raw: ArgType;
  ifExpr?: { arg: string; eq?: unknown; neq?: unknown; truthy?: boolean };
};

function controlObjectToKind(obj: { type?: ControlShorthand; options?: ReadonlyArray<unknown>; labels?: Record<string, string>; min?: number; max?: number; step?: number; presetColors?: ReadonlyArray<string> }, argType: ArgType): NormalizedControl {
  const type: ControlShorthand | undefined = obj.type;
  const options = (obj.options ?? argType.options) as unknown[] | undefined;
  const labels = obj.labels;
  switch (type) {
    case "boolean":
      return { kind: "boolean" };
    case "text":
      return { kind: "text" };
    case "number":
      return { kind: "number", min: obj.min, max: obj.max, step: obj.step };
    case "range":
      return { kind: "range", min: obj.min, max: obj.max, step: obj.step };
    case "select":
    case "multi-select":
      return {
        kind: "select",
        options: options ?? [],
        labels,
        multi: type === "multi-select",
      };
    case "radio":
    case "inline-radio":
      return {
        kind: "radio",
        options: options ?? [],
        labels,
        inline: type === "inline-radio",
      };
    case "check":
    case "inline-check":
      return {
        kind: "check",
        options: options ?? [],
        labels,
        inline: type === "inline-check",
      };
    case "color":
      return { kind: "color", presets: obj.presetColors };
    case "date":
      return { kind: "date" };
    case "object":
      return { kind: "object" };
    case "file":
      return { kind: "file" };
    default:
      // No explicit type; infer from options presence
      if (options && options.length > 0) {
        return { kind: "select", options, labels };
      }
      return { kind: "unknown" };
  }
}

export function normalizeArgType(argName: string, raw: ArgType | undefined): NormalizedArgType | null {
  if (!raw) {
    return {
      argName,
      displayName: argName,
      description: undefined,
      category: null,
      subcategory: null,
      control: { kind: "unknown" },
      raw: {},
    };
  }
  if (raw.table?.disable === true) return null;

  let control: NormalizedControl = { kind: "unknown" };
  if (raw.control === false || raw.control === null) {
    control = { kind: "disabled" };
  } else if (typeof raw.control === "string") {
    control = controlObjectToKind({ type: raw.control }, raw);
  } else if (raw.control && typeof raw.control === "object") {
    control = controlObjectToKind(raw.control, raw);
  } else if (raw.options && (raw.options as unknown[]).length > 0) {
    control = { kind: "select", options: raw.options as unknown[] };
  }

  return {
    argName,
    displayName: (raw.name as string | undefined) ?? argName,
    description: (raw.description as string | undefined) ?? undefined,
    category: (raw.table?.category as string | undefined) ?? null,
    subcategory: (raw.table?.subcategory as string | undefined) ?? null,
    defaultValueSummary: raw.table?.defaultValue?.summary as string | undefined,
    typeSummary: raw.table?.type?.summary as string | undefined,
    control,
    raw,
    ifExpr: raw.if as NormalizedArgType["ifExpr"],
  };
}

export function buildVisibleArgTypes(
  meta: Record<string, ArgType> | undefined,
  story: Record<string, ArgType> | undefined,
  currentArgs: Record<string, unknown>,
): NormalizedArgType[] {
  const merged: Record<string, ArgType> = { ...(meta ?? {}), ...(story ?? {}) };
  const out: NormalizedArgType[] = [];
  for (const [name, raw] of Object.entries(merged)) {
    const n = normalizeArgType(name, raw);
    if (!n) continue;
    if (n.ifExpr && !ifMatches(n.ifExpr, currentArgs)) continue;
    out.push(n);
  }
  return out;
}

function ifMatches(expr: { arg: string; eq?: unknown; neq?: unknown; truthy?: boolean }, args: Record<string, unknown>): boolean {
  const v = args[expr.arg];
  if (expr.eq !== undefined) return v === expr.eq;
  if (expr.neq !== undefined) return v !== expr.neq;
  if (expr.truthy === false) return !v;
  if (expr.truthy === true || expr.truthy === undefined) return Boolean(v);
  return true;
}

/** Group by `table.category` then `subcategory`; uncategorized first */
export type ArgTypeGroup = {
  category: string | null;
  rows: NormalizedArgType[];
};

export function groupByCategory(rows: NormalizedArgType[]): ArgTypeGroup[] {
  const map = new Map<string | null, NormalizedArgType[]>();
  for (const row of rows) {
    const list = map.get(row.category) ?? [];
    list.push(row);
    map.set(row.category, list);
  }
  // Uncategorized first, then alphabetical
  const ordered: ArgTypeGroup[] = [];
  if (map.has(null)) ordered.push({ category: null, rows: map.get(null) ?? [] });
  for (const [cat, list] of [...map.entries()]
    .filter(([k]) => k !== null)
    .sort(([a], [b]) => String(a).localeCompare(String(b)))) {
    ordered.push({ category: cat, rows: list });
  }
  return ordered;
}
