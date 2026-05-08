import type { Meta, StoryObj } from "@storybook/react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "RadioGroup",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
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
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {
  render: (args: any) => (
    <RadioGroup
      defaultValue="comfortable"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: cssVar(args.shellGap as string),
        maxWidth: cssVar(args.shellMaxWidth as string),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
        <RadioGroupItem value="default" id="rg-default" />
        <Label htmlFor="rg-default">默认密度</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
        <RadioGroupItem value="comfortable" id="rg-comf" />
        <Label htmlFor="rg-comf">舒适</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: cssVar(args.shellGap as string) }}>
        <RadioGroupItem value="compact" id="rg-compact" />
        <Label htmlFor="rg-compact">紧凑</Label>
      </div>
    </RadioGroup>
  ),
};
