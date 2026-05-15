import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Checkbox } from "@/components/starter/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/starter/table";
import { cn } from "@/lib/utils";

export type CompositeDataColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  /** If set and enableSort is true, this column header is clickable for sorting */
  sortKey?: keyof T;
  align?: "left" | "right";
};

export interface CompositeDataTableProps<T> {
  columns: CompositeDataColumnDef<T>[];
  data: T[];
  density?: "compact" | "comfortable" | "default";
  variant?: "plain" | "striped";
  /** consumer className */
  className?: string;
  /** Outer table container overflow / min-w etc. */
  tableClassName?: string;
  /**
   * Vertical light-band column: column N (0-indexed, data columns only, excludes checkbox column).
   * null / undefined disables; out-of-bounds treated as disabled.
   */
  columnBandIndex?: number | null;
  /** Checkbox column + row selection + select all */
  enableRowSelection?: boolean;
  /** Header sorting (only applies to columns that declare sortKey) */
  enableSort?: boolean;
  /**
   * Unique row key; multi-select and post-sort state depend on stable id. Falls back to index string when not provided (multi-select after sort may misbehave).
   */
  getRowKey?: (row: T) => string;
}

const DENSITY_CLASSES: Record<string, string[]> = {
  compact: ["text-xs", "py-business-table-cell-y-compact", "px-3"],
  default: ["text-sm", "py-business-table-cell-y-default", "px-3"],
  comfortable: ["text-sm", "py-business-table-cell-y-comfortable", "px-4"],
};

function densityCellClasses(density: NonNullable<CompositeDataTableProps<unknown>["density"]>): string {
  return twMerge(...(DENSITY_CLASSES[density] ?? DENSITY_CLASSES.default));
}

/** Checkbox column aligned with data column vertical padding */
function densityCheckColumnClass(d: NonNullable<CompositeDataTableProps<unknown>["density"]>): string {
  const fixed = "w-11 min-w-[2.75rem] max-w-[2.75rem] box-border px-0 text-center align-middle";
  switch (d) {
    case "compact":
      return cn(fixed, "text-xs py-business-table-cell-y-compact");
    case "comfortable":
      return cn(fixed, "text-sm py-business-table-cell-y-comfortable");
    default:
      return cn(fixed, "text-sm py-business-table-cell-y-default");
  }
}

function compareByKey<T>(a: T, b: T, key: keyof T, dir: "asc" | "desc"): number {
  const mul = dir === "asc" ? 1 : -1;
  const va = a[key];
  const vb = b[key];
  if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
  return String(va).localeCompare(String(vb), "zh") * mul;
}

function bandActive(dataColumnIndex: number, band: number | null | undefined, columnCount: number): boolean {
  if (band == null) return false;
  if (!Number.isInteger(band) || band < 0 || band >= columnCount) return false;
  return band === dataColumnIndex;
}

function HeaderSelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const radixChecked: boolean | "indeterminate" = indeterminate
    ? "indeterminate"
    : checked;
  return (
    <Checkbox
      checked={radixChecked}
      onCheckedChange={() => onChange()}
      aria-label="Select all"
    />
  );
}

/**
 * Composite table core: DataTable and KitchenSink share the same density / stripes / optional column-band / sort / multi-select.
 * - Disabling enableRowSelection and enableSort yields the "simplified" display table.
 */
export function CompositeDataTable<T>({
  columns,
  data,
  density = "default",
  variant = "plain",
  className,
  tableClassName,
  columnBandIndex = null,
  enableRowSelection = false,
  enableSort = false,
  getRowKey,
}: CompositeDataTableProps<T>) {
  const textRow = densityCellClasses(density);
  const checkCol = densityCheckColumnClass(density);
  const root = cn("w-full", className);

  const keyOf = React.useCallback(
    (row: T, index: number) => (getRowKey ? getRowKey(row) : String(index)),
    [getRowKey],
  );

  const firstSortable = columns.find((c) => c.sortKey != null)?.sortKey ?? null;
  const [sortKey, setSortKey] = React.useState<keyof T | null>(firstSortable as keyof T | null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  const sorted = React.useMemo(() => {
    if (!enableSort || sortKey == null) return data;
    return [...data].sort((a, b) => compareByKey(a, b, sortKey, sortDir));
  }, [data, enableSort, sortKey, sortDir]);

  const toggleSort = (key: keyof T) => {
    if (!enableSort) return;
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const allSelected =
    enableRowSelection &&
    sorted.length > 0 &&
    sorted.every((r, i) => selected.has(keyOf(r, i)));
  const someSelected =
    enableRowSelection &&
    sorted.some((r, i) => selected.has(keyOf(r, i))) &&
    !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map((r, i) => keyOf(r, i))));
  };

  const toggleRow = (row: T, index: number) => {
    const k = keyOf(row, index);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const SortIcon = ({ column }: { column: keyof T }) => {
    if (!enableSort || sortKey !== column) {
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
    );
  };

  const colCount = columns.length;

  return (
    <div className={cn("w-full overflow-x-auto", root, tableClassName)}>
      <Table>
        <TableHeader>
          <TableRow>
            {enableRowSelection ? (
              <TableHead className={cn(checkCol, "h-auto min-h-0 font-medium text-muted-foreground")}>
                <div className="flex items-center justify-center leading-none">
                  <HeaderSelectAllCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                </div>
              </TableHead>
            ) : null}
            {columns.map((col, colIdx) => {
              const sk = col.sortKey;
              const sortable = Boolean(enableSort && sk != null);
              const band = bandActive(colIdx, columnBandIndex, colCount);
              return (
                <TableHead
                  key={col.id}
                  className={cn(
                    textRow,
                    band && "bg-muted/40",
                    sortable && "cursor-pointer select-none",
                    col.align === "right" && "text-right",
                  )}
                  onClick={sortable && sk ? () => toggleSort(sk) : undefined}
                >
                  {col.header}
                  {sortable && sk ? <SortIcon column={sk} /> : null}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row, i) => (
            <TableRow
              key={keyOf(row, i)}
              className={cn(
                variant === "striped" && i % 2 === 1 ? "bg-muted/40" : undefined,
                enableRowSelection && selected.has(keyOf(row, i)) ? "bg-primary/5" : undefined,
              )}
            >
              {enableRowSelection ? (
                <TableCell className={checkCol}>
                  <div className="flex items-center justify-center leading-none">
                    <Checkbox
                      checked={selected.has(keyOf(row, i))}
                      onCheckedChange={() => toggleRow(row, i)}
                      aria-label="Select row"
                    />
                  </div>
                </TableCell>
              ) : null}
              {columns.map((col, colIdx) => {
                const band = bandActive(colIdx, columnBandIndex, colCount);
                return (
                  <TableCell
                    key={col.id}
                    className={cn(
                      textRow,
                      band && "bg-muted/30",
                      col.align === "right" && "text-right tabular-nums",
                    )}
                  >
                    {col.accessor(row)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

CompositeDataTable.displayName = "CompositeDataTable";
