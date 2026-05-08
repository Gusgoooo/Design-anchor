import type { Meta, StoryObj } from "@storybook/react";
import { cssVar, layoutMaxWidthTokenIds } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { Select } from "./select";

const meta = {
  title: "Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      extraTokenIds: ["selectMaxW"],
      ignoreArgNames: ["id", "defaultValue", "children"],
    }),
  },
  decorators: [
    (Story, ctx) => (
      <PreviewShell args={pickPreviewShellArgs(ctx.args as Record<string, unknown>)}>
        <Story />
      </PreviewShell>
    ),
  ],
  args: {
    ...previewShellDefaults,
    selectMaxW: "layout-max-w-sm",
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    selectMaxW: {
      control: "select",
      options: layoutMaxWidthTokenIds(),
      description: "演示区选择器最大宽度（layout token）",
      table: { category: "演示" },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Native: Story = {
  render: (args: any) => (
    <div
      style={{
        display: "grid",
        width: "100%",
        maxWidth: cssVar(args.selectMaxW as string),
        gap: cssVar(args.shellGap as string),
      }}
    >
      <Label htmlFor="sel">选项</Label>
      <Select id="sel" defaultValue="b">
        <option value="a">选项 A</option>
        <option value="b">选项 B</option>
        <option value="c">选项 C</option>
      </Select>
    </div>
  ),
};
