import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Slider } from "./slider";

const meta = {
  title: "Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["min", "max", "defaultValue"],
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
    min: 0,
    max: 100,
    defaultValue: 40,
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    defaultValue: { control: { type: "range", min: 0, max: 100 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: "100%" }}>
      <Slider {...args} />
    </div>
  ),
};
