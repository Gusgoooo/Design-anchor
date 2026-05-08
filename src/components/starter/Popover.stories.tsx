import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { buttonVariants } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
  title: "Popover",
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
    <Popover>
      <PopoverTrigger className={buttonVariants({ variant: "outline", size: "default" })}>
        打开 Popover
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-muted-foreground">可放置过滤器、附加表单等。</p>
      </PopoverContent>
    </Popover>
  ),
};
