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
          <DialogTrigger asChild>
            <Button variant="outline">打开对话框</Button>
          </DialogTrigger>
        </div>
        <DialogContent className={audit.buildClassName(args)}>
          <DialogHeader>
            <DialogTitle>对话框标题</DialogTitle>
            <DialogDescription>这是一段描述文本。点击遮罩或按 Esc 关闭。</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm">对话框内容区域</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button type="button">确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
