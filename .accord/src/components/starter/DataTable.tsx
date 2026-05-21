import * as React from "react";
import {
  CompositeDataTable,
  type CompositeDataColumnDef,
  type CompositeDataTableProps,
} from "@/components/starter/composite-data-table";

export type { CompositeDataColumnDef, CompositeDataTableProps };
export { CompositeDataTable };

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
   * Vertical light-band column: column N (0-indexed). Semantically consistent with CompositeDataTable.
   * null / undefined disables; out-of-bounds treated as disabled.
   */
  columnBandIndex?: number | null;
  /** Stable row key (recommended for pagination and partial updates) */
  getRowKey?: (row: T) => string;
}

/**
 * BusinessTable: simplified version of CompositeDataTable (no checkboxes, no header sorting); density/stripes/column-band share the same source as KitchenSink.
 * Schema is the single source of truth (aiPrompt, styleLock participate in generate-cursorrules).
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

DataTable.displayName = "DataTable";
