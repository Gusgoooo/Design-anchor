import type { Meta, StoryObj } from "@storybook/react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["disabled", "defaultChecked"],
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
    disabled: false,
    defaultChecked: false,
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {
  render: (args: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
      <Checkbox id="cb-demo" {...args} />
      <Label htmlFor="cb-demo">同意条款</Label>
    </div>
  ),
};

export const Checked: Story = {
  args: { defaultChecked: true },
  render: (args: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
      <Checkbox id="cb-checked" {...args} />
      <Label htmlFor="cb-checked">已选中</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
      <Checkbox id="cb-disabled" {...args} />
      <Label htmlFor="cb-disabled">不可用</Label>
    </div>
  ),
};
