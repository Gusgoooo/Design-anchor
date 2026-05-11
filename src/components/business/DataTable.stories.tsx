import type { Meta, StoryObj } from "@storybook/react";
import {
  cssVar,
  cssVarOrTransparent,
  STORY_TAILWIND_MAX_WIDTH_CLASSES,
  STORY_TAILWIND_MIN_WIDTH_CLASSES,
  storyColorControlOptionsWithTransparent,
  tokenIdsByCategory,
} from "@/design-tokens/story-controls";
import { cn } from "@/lib/utils";
import { DataTable, type ColumnDef, type DataTableProps } from "./DataTable";
import {
  KitchenSinkDataTable,
  type KitchenSinkDataTableProps,
  type KitchenSinkRow,
} from "./kitchen-sink-data-table";

type Row = { id: string; name: string; role: string };

const columns: ColumnDef<Row>[] = [
  { id: "name", header: "名称", accessor: (r) => r.name },
  { id: "role", header: "角色", accessor: (r) => r.role },
];

const sampleData: Row[] = [
  { id: "1", name: "Northwind", role: "客户" },
  { id: "2", name: "Contoso", role: "渠道" },
  { id: "3", name: "Fabrikam", role: "供应商" },
];

const sinkData: KitchenSinkRow[] = [
  { id: "1", name: "Northwind", role: "客户", revenue: 128 },
  { id: "2", name: "Contoso", role: "渠道", revenue: 86 },
  { id: "3", name: "Fabrikam", role: "供应商", revenue: 210 },
  { id: "4", name: "Adventure", role: "客户", revenue: 54 },
  { id: "5", name: "Litware", role: "渠道", revenue: 92 },
];

/* ─── 画布装饰层 ─── */

interface PreviewFrameProps {
  outerPadding: string;
  cardPadding: string;
  borderRadius: string;
  /** Tailwind max-width 工具类，如 max-w-5xl */
  maxWidthClass: string;
  /** Tailwind min-width 工具类，如 min-w-0 */
  minWidthClass: string;
  shadow: string;
  showBorder: boolean;
  cardBackgroundToken: string;
  cardBorderToken: string;
  children: React.ReactNode;
}

function PreviewFrame({
  outerPadding,
  cardPadding,
  borderRadius,
  maxWidthClass,
  minWidthClass,
  shadow,
  showBorder,
  cardBackgroundToken,
  cardBorderToken,
  children,
}: PreviewFrameProps) {
  const borderColor = cssVarOrTransparent(cardBorderToken);
  return (
    <div
      className="flex w-full items-start justify-center bg-transparent"
      style={{ padding: cssVar(outerPadding) }}
    >
      <div
        className={cn(
          "box-border w-full border-0",
          maxWidthClass,
          "mx-auto overflow-hidden",
        )}
        style={{
          padding: cssVar(cardPadding),
          borderRadius: cssVar(borderRadius),
          boxShadow: cssVar(shadow),
          backgroundColor: cssVarOrTransparent(cardBackgroundToken),
          ...(showBorder && borderColor !== "transparent"
            ? { borderWidth: 1, borderStyle: "solid" as const, borderColor }
            : {}),
        }}
      >
        <div className={cn("w-full overflow-x-auto", minWidthClass)}>
          {children}
        </div>
      </div>
    </div>
  );
}

const layoutArgTypes = {
  outerPadding: {
    control: "select",
    options: tokenIdsByCategory("spacing"),
    description: "外层间距（spacing token）",
    table: { category: "布局" },
  },
  cardPadding: {
    control: "select",
    options: tokenIdsByCategory("spacing"),
    description: "卡片内边距",
    table: { category: "布局" },
  },
  borderRadius: {
    control: "select",
    options: tokenIdsByCategory("radius-scale"),
    description: "卡片圆角",
    table: { category: "布局" },
  },
  maxWidthClass: {
    control: "select",
    options: STORY_TAILWIND_MAX_WIDTH_CLASSES,
    description: "最大宽度（Tailwind 工具类，非设计 token）",
    table: { category: "布局" },
  },
  minWidthClass: {
    control: "select",
    options: STORY_TAILWIND_MIN_WIDTH_CLASSES,
    description: "表格区域最小宽度（Tailwind 工具类）",
    table: { category: "布局" },
  },
  shadow: {
    control: "select",
    options: tokenIdsByCategory("elevation"),
    description: "阴影",
    table: { category: "布局" },
  },
  showBorder: {
    control: "boolean",
    description: "显示卡片描边",
    table: { category: "布局" },
  },
  cardBackgroundToken: {
    control: "select",
    options: storyColorControlOptionsWithTransparent(),
    description: "表格外层卡片背景色（token）",
    table: { category: "颜色" },
  },
  cardBorderToken: {
    control: "select",
    options: storyColorControlOptionsWithTransparent(),
    description: "表格外层卡片边框色（token；透明=无边框）",
    table: { category: "颜色" },
  },
} as const;

const layoutDefaults = {
  outerPadding: "spacing-6",
  cardPadding: "spacing-6",
  borderRadius: "border-radius-xl",
  maxWidthClass: "max-w-5xl",
  minWidthClass: "min-w-lg",
  shadow: "elevation-sm",
  showBorder: true,
  cardBackgroundToken: "background",
  cardBorderToken: "border",
};

/* ─── 基础 DataTable（与复合表格共用 PreviewFrame + 布局 token）─── */

type DataTableStoryArgs = DataTableProps<Row> & typeof layoutDefaults;

const meta = {
  title: "Table",
  component: DataTable,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: {
      sidebarStatus: "full",
      tokenIdArgs: [
        "outerPadding",
        "cardPadding",
        "borderRadius",
        "shadow",
        "cardBackgroundToken",
        "cardBorderToken",
      ],
    },
  },
  args: {
    columns,
    data: sampleData,
    density: "default",
    variant: "plain",
    columnBandIndex: null as null | 0 | 1,
    ...layoutDefaults,
  },
  argTypes: {
    density: {
      control: "select",
      options: ["compact", "comfortable", "default"],
      table: { category: "表格" },
    },
    variant: {
      control: "select",
      options: ["plain", "striped"],
      table: { category: "表格" },
    },
    columnBandIndex: {
      control: "select",
      options: [null, 0, 1],
      description: "纵向浅底条带：第 N 列（0 起算，与复合表格一致）。",
      table: { category: "表格" },
    },
    className: { table: { disable: true } },
    columns: { table: { disable: true } },
    data: { table: { disable: true } },
    ...layoutArgTypes,
  },
  render: (args: DataTableStoryArgs) => (
    <PreviewFrame
      outerPadding={args.outerPadding}
      cardPadding={args.cardPadding}
      borderRadius={args.borderRadius}
      maxWidthClass={args.maxWidthClass}
      minWidthClass={args.minWidthClass}
      shadow={args.shadow}
      showBorder={args.showBorder}
      cardBackgroundToken={args.cardBackgroundToken}
      cardBorderToken={args.cardBorderToken}
    >
      <DataTable<Row>
        columns={args.columns}
        data={args.data}
        density={args.density}
        variant={args.variant}
        columnBandIndex={args.columnBandIndex}
        className={args.className}
      />
    </PreviewFrame>
  ),
} satisfies Meta<DataTableStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    outerPadding: "spacing-0",
    cardPadding: "spacing-0",
    cardBackgroundToken: "color-bg-container"
  },

  name: "交互画布"
};

export const CompactStriped: Story = {
  name: "紧凑 + 斑马纹",
  args: {
    density: "compact",
    variant: "striped",
    outerPadding: "spacing-0",
    cardPadding: "spacing-0",
    minWidthClass: "min-w-xs",
    shadow: "elevation-none"
  },
};

export const Comfortable: Story = {
  name: "宽松",
  args: {
    density: "comfortable",
    variant: "plain",
    outerPadding: "spacing-0",
    cardPadding: "spacing-0"
  },
};

/* ─── 复合表格（KitchenSink + 画布装饰）─── */

type SinkArgs = Pick<KitchenSinkDataTableProps, "density" | "variant" | "columnBandIndex"> & typeof layoutDefaults;

export const SuperComposite: StoryObj<SinkArgs> = {
  name: "复合表格（排序 + 多选 + 可调边距）",
  args: {
    density: "default",
    variant: "striped",

    /** 演示：第 2 列文本列纵向浅底（与列标题文案无关，AI 换列序后仍按索引生效） */
    columnBandIndex: null,

    ...layoutDefaults,
    outerPadding: "spacing-0",
    cardPadding: "spacing-0",
    shadow: "elevation-none",
    cardBackgroundToken: "color-bg-container"
  },
  argTypes: {
    density: {
      control: "select",
      options: ["compact", "comfortable", "default"],
      table: { category: "表格" },
    },
    variant: {
      control: "select",
      options: ["plain", "striped"],
      table: { category: "表格" },
    },
    columnBandIndex: {
      control: "select",
      options: [null, 0, 1, 2],
      description:
        "纵向浅底条带：复选框列后的第 N 列（0=首列文本，1=第二列…）；与列业务含义无关。选「无」关闭。",
      table: { category: "表格" },
    },
    ...layoutArgTypes,
  },
  render: (args) => (
    <PreviewFrame
      outerPadding={args.outerPadding}
      cardPadding={args.cardPadding}
      borderRadius={args.borderRadius}
      maxWidthClass={args.maxWidthClass}
      minWidthClass={args.minWidthClass}
      shadow={args.shadow}
      showBorder={args.showBorder}
      cardBackgroundToken={args.cardBackgroundToken}
      cardBorderToken={args.cardBorderToken}
    >
      <KitchenSinkDataTable
        data={sinkData}
        density={args.density}
        variant={args.variant}
        columnBandIndex={args.columnBandIndex}
      />
    </PreviewFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "演示用复合表：点击表头排序、行/全选 checkbox。颜色/圆角/阴影等从设计 token 选取；最大/最小宽度为 Tailwind 工具类。",
      },
    },
  },
};
