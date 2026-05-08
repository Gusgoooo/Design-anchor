import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
  title: "Tooltip",
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
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger
        className={cn(buttonVariants({ variant: "outline", size: "default" }), "border-dashed")}
      >
        悬停查看
      </TooltipTrigger>
      <TooltipContent>简短说明文案</TooltipContent>
    </Tooltip>
  ),
};
