import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Checkbox } from "@/components/starter/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { mergeWithBusinessSpec } from "@/components/business/business-style";
import dataTableSpec from "@/harness/schema/components/data-table.spec.json";
import type { ComponentSpec } from "@/harness/schema/types";

const spec = dataTableSpec as ComponentSpec;

export type CompositeDataColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  /** 若设置且 enableSort，该列表头可点击排序 */
  sortKey?: keyof T;
  align?: "left" | "right";
};

export interface CompositeDataTableProps<T> {
  columns: CompositeDataColumnDef<T>[];
  data: T[];
  density?: "compact" | "comfortable" | "default";
  variant?: "plain" | "striped";
  /** consumer className：经 mergeWithBusinessSpec + styleLock */
  className?: string;
  /** 表格外层 overflow / min-w 等 */
  tableClassName?: string;
  /**
   * 纵向浅底条带：第 N 列（0 起算，仅数据列，不含复选框列）。
   * null / undefined 关闭；越界视为关闭。
   */
  columnBandIndex?: number | null;
  /** 复选框列 + 行选 + 全选 */
  enableRowSelection?: boolean;
  /** 表头排序（仅对声明了 sortKey 的列生效） */
  enableSort?: boolean;
  /**
   * 行唯一键，多选与排序后状态依赖稳定 id；未传时退化为索引字符串（排序后多选可能异常）。
   */
  getRowKey?: (row: T) => string;
}

function densityCellClasses(density: NonNullable<CompositeDataTableProps<unknown>["density"]>): string {
  const map = spec.optionalProps?.find((p) => p.name === "density")?.enumMap;
  if (!map) return twMerge("text-sm", "py-3", "px-3");
  const key = density ?? "default";
  return twMerge(...(map[key] ?? map.default ?? []));
}

/** 与数据列垂直 padding 对齐的复选框列 */
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
      aria-label="全选"
    />
  );
}

/**
 * 复合表格内核：DataTable 与 KitchenSink 共用同一套密度 / 斑马纹 / 可选列条带 / 排序 / 多选。
 * - 关闭 enableRowSelection、enableSort 即为「简化版」展示表。
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
  const root = mergeWithBusinessSpec(className, spec);

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
                      aria-label="选择行"
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
