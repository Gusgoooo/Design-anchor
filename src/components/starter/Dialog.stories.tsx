import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Dialog",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["defaultOpen"],
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
    defaultOpen: false,
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    defaultOpen: { control: "boolean", table: { category: "演示" } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Basic: Story = {
  render: (args: any) => (
    <Dialog defaultOpen={args.defaultOpen as boolean}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
        打开对话框
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认操作</DialogTitle>
          <DialogDescription>此处可放置说明文案；点击遮罩或按 Esc 关闭。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
            取消
          </DialogClose>
          <Button type="button">确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
