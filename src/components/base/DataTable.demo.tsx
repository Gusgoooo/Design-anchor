import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./composite-data-table.tsx?raw";
import { DataTable, type ColumnDef, type DataTableProps } from "./DataTable";
import {
  KitchenSinkDataTable,
  type KitchenSinkRow,
} from "./kitchen-sink-data-table";

const audit = autoClassControls(componentSrc);

type Row = { id: string; name: string; role: string };

const columns: ColumnDef<Row>[] = [
  { id: "name", header: "Name", accessor: (r) => r.name },
  { id: "role", header: "Role", accessor: (r) => r.role },
];

const sampleData: Row[] = [
  { id: "1", name: "Northwind", role: "Customer" },
  { id: "2", name: "Contoso", role: "Channel" },
  { id: "3", name: "Fabrikam", role: "Supplier" },
];

const sinkData: KitchenSinkRow[] = [
  { id: "1", name: "Northwind", role: "Customer", revenue: 128 },
  { id: "2", name: "Contoso", role: "Channel", revenue: 86 },
  { id: "3", name: "Fabrikam", role: "Supplier", revenue: 210 },
  { id: "4", name: "Adventure", role: "Customer", revenue: 54 },
  { id: "5", name: "Litware", role: "Channel", revenue: 92 },
];

type DataTableStoryArgs = {
  columns: ColumnDef<Row>[];
  data: Row[];
  density: "compact" | "comfortable" | "default";
  variant: "plain" | "striped";
  columnBandIndex: number | null;
  className?: string;
  [k: string]: unknown;
};

const meta = {
  title: "Base/Table",
  component: DataTable,
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({
      ignoreArgNames: ["columns", "data", "density", "variant", "columnBandIndex"],
    }),
  },
  args: {
    columns,
    data: sampleData,
    density: "default",
    variant: "plain",
    columnBandIndex: null as null | 0 | 1,
    ...audit.args,
  },
  argTypes: {
    density: {
      control: "select",
      options: ["compact", "comfortable", "default"],
      table: { category: "Table" },
    },
    variant: {
      control: "select",
      options: ["plain", "striped"],
      table: { category: "Table" },
    },
    columnBandIndex: {
      control: "select",
      options: [null, 0, 1],
      description: "Vertical light-band column: column N",
      table: { category: "Table" },
    },
    className: { table: { disable: true } },
    columns: { table: { disable: true } },
    data: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta<DataTableStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  name: "Playground",
  render: (args) => {
    const a = args as DataTableStoryArgs;
    return (
      <DataTable<Row>
        columns={a.columns}
        data={a.data}
        density={a.density}
        variant={a.variant}
        columnBandIndex={a.columnBandIndex}
        className={spreadAutoPreviewProps(audit, a as ClassOverrideArgs).className}
      />
    );
  },
};

export const CompactStriped: Story = {
  name: "Compact + Striped",
  args: {
    density: "compact",
    variant: "striped",
  },
  render: (args) => {
    const a = args as DataTableStoryArgs;
    return (
      <DataTable<Row>
        columns={a.columns}
        data={a.data}
        density={a.density}
        variant={a.variant}
        columnBandIndex={a.columnBandIndex}
        className={spreadAutoPreviewProps(audit, a as ClassOverrideArgs).className}
      />
    );
  },
};

export const Comfortable: Story = {
  name: "Comfortable",
  args: {
    density: "comfortable",
    variant: "plain",
  },
  render: (args) => {
    const a = args as DataTableStoryArgs;
    return (
      <DataTable<Row>
        columns={a.columns}
        data={a.data}
        density={a.density}
        variant={a.variant}
        columnBandIndex={a.columnBandIndex}
        className={spreadAutoPreviewProps(audit, a as ClassOverrideArgs).className}
      />
    );
  },
};

export const SuperComposite: Story = {
  name: "Composite Table",
  args: {
    density: "default",
    variant: "striped",
    columnBandIndex: null,
  },
  render: (args) => {
    const a = args as DataTableStoryArgs;
    return (
      <KitchenSinkDataTable
        data={sinkData}
        density={a.density}
        variant={a.variant}
        columnBandIndex={a.columnBandIndex}
        className={spreadAutoPreviewProps(audit, a as ClassOverrideArgs).className}
      />
    );
  },
};
