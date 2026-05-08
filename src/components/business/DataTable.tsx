import * as React from "react";
import {
  CompositeDataTable,
  type CompositeDataColumnDef,
  type CompositeDataTableProps,
} from "@/components/business/composite-data-table";
import type { ComponentSpec } from "@/harness/schema/types";
import dataTableSpec from "@/harness/schema/components/data-table.spec.json";

export type { CompositeDataColumnDef, CompositeDataTableProps };
export { CompositeDataTable };

const spec = dataTableSpec as ComponentSpec;

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
};

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  density?: "compact" | "comfortable" | "default";
  variant?: "plain" | "striped";
  className?: string;
  /**
   * 纵向浅底条带：第 N 列（0 起算）。与复合表格语义一致。
   * null / undefined 关闭；越界视为关闭。
   */
  columnBandIndex?: number | null;
  /** 稳定行键（分页、局部更新时建议提供） */
  getRowKey?: (row: T) => string;
}

/**
 * BusinessTable：复合表格的简化版（无复选框、无表头排序），密度/斑马纹/列条带与 KitchenSink 同源。
 * Schema 即单一事实来源（aiPrompt、styleLock 同步参与 generate-cursorrules）。
 */
export function DataTable<T>({
  columns,
  data,
  density = "default",
  variant = "plain",
  className,
  columnBandIndex,
  getRowKey,
}: DataTableProps<T>) {
  const compositeColumns = React.useMemo<CompositeDataColumnDef<T>[]>(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: c.header,
        accessor: c.accessor ?? (() => null),
      })),
    [columns],
  );

  return (
    <CompositeDataTable<T>
      columns={compositeColumns}
      data={data}
      density={density}
      variant={variant}
      className={className}
      columnBandIndex={columnBandIndex}
      enableRowSelection={false}
      enableSort={false}
      getRowKey={getRowKey}
    />
  );
}

DataTable.displayName = spec.componentName;
