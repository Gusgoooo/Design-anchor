import {
  CompositeDataTable,
  type CompositeDataColumnDef,
  type CompositeDataTableProps,
} from "@/components/base/composite-data-table";

export type KitchenSinkRow = {
  id: string;
  name: string;
  role: string;
  revenue: number;
};

const KITCHEN_COLUMNS: CompositeDataColumnDef<KitchenSinkRow>[] = [
  { id: "name", header: "Name", accessor: (r) => r.name, sortKey: "name" },
  { id: "role", header: "Role", accessor: (r) => r.role, sortKey: "role" },
  {
    id: "revenue",
    header: "Revenue (10K)",
    accessor: (r) => r.revenue.toLocaleString("en-US"),
    sortKey: "revenue",
    align: "right",
  },
];

export type KitchenSinkDataTableProps = Omit<
  CompositeDataTableProps<KitchenSinkRow>,
  "columns" | "enableRowSelection" | "enableSort" | "getRowKey"
>;

/**
 * Storybook composite table: shares the same core as {@link CompositeDataTable} / {@link DataTable};
 * enables sorting + row selection + select all. Use `DataTable` for business lists.
 */
export function KitchenSinkDataTable({ data, ...rest }: KitchenSinkDataTableProps) {
  return (
    <CompositeDataTable<KitchenSinkRow>
      columns={KITCHEN_COLUMNS}
      data={data}
      enableRowSelection
      enableSort
      getRowKey={(r) => r.id}
      {...rest}
    />
  );
}
