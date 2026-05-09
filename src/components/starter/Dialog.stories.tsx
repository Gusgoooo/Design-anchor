import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import dialogSrc from "./dialog.tsx?raw";
import { Button } from "./button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "./dialog";

const audit = autoClassControls(dialogSrc);

type DialogStoryArgs = {
  defaultOpen: boolean;
  [k: string]: unknown;
};

const meta = {
  title: "Dialog",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["defaultOpen"],
    }),
  },
  args: {
    defaultOpen: false,
    ...audit.args,
  },
  argTypes: {
    defaultOpen: { control: "boolean", description: "初始打开状态" },
    ...audit.argTypes,
  },
} satisfies Meta<DialogStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_a) => {
    const args = _a as unknown as DialogStoryArgs & Record<string, string>;
    return (
      <Dialog defaultOpen={args.defaultOpen}>
        <div className="flex min-h-screen items-center justify-center">
        <DialogTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent">
          打开对话框
        </DialogTrigger>
        </div>
        <DialogContent className={audit.buildClassName(args)}>
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>此处可放置说明文案；点击遮罩或按 Esc 关闭。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent">
              取消
            </DialogClose>
            <Button type="button">确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
