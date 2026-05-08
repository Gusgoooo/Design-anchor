import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Badge } from "./badge";

const meta = {
  title: "Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["children", "variant"],
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
    children: "Badge",
    variant: "default",
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
    children: { control: "text" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "次要" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "危险" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "线框" },
};
