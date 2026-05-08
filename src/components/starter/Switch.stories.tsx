import type { Meta, StoryObj } from "@storybook/react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { Switch } from "./switch";

const meta = {
  title: "Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["disabled"],
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
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    disabled: { control: "boolean" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
      <Switch id="sw" {...args} />
      <Label htmlFor="sw">启用通知</Label>
    </div>
  ),
};
