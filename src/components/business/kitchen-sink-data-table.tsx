import {
  CompositeDataTable,
  type CompositeDataColumnDef,
  type CompositeDataTableProps,
} from "@/components/business/composite-data-table";

export type KitchenSinkRow = {
  id: string;
  name: string;
  role: string;
  revenue: number;
};

const KITCHEN_COLUMNS: CompositeDataColumnDef<KitchenSinkRow>[] = [
  { id: "name", header: "名称", accessor: (r) => r.name, sortKey: "name" },
  { id: "role", header: "角色", accessor: (r) => r.role, sortKey: "role" },
  {
    id: "revenue",
    header: "营收（万）",
    accessor: (r) => r.revenue.toLocaleString("zh-CN"),
    sortKey: "revenue",
    align: "right",
  },
];

export type KitchenSinkDataTableProps = Omit<
  CompositeDataTableProps<KitchenSinkRow>,
  "columns" | "enableRowSelection" | "enableSort" | "getRowKey"
>;

/**
 * Storybook 复合表：与 {@link CompositeDataTable} / {@link DataTable} 同一内核；
 * 开启排序 + 行选 + 全选。业务列表请用 `DataTable`。
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
