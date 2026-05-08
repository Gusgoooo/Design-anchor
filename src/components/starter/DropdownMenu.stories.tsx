import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { buttonVariants } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "DropdownMenu",
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
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "default" })}>
        菜单 ▾
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>复制</DropdownMenuItem>
        <DropdownMenuItem>重命名</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>删除</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
