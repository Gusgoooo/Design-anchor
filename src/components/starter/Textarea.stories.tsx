import type { Meta, StoryObj } from "@storybook/react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = {
  title: "Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["placeholder", "rows", "disabled"],
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
    placeholder: "多行内容…",
    rows: 4,
    disabled: false,
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    rows: { control: "number" },
    disabled: { control: "boolean" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args: any) => (
    <div
      style={{
        display: "grid",
        width: "100%",
        gap: cssVar(args.shellGap as string),
      }}
    >
      <Label htmlFor="t">备注</Label>
      <Textarea id="t" {...args} />
    </div>
  ),
};
