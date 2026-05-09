import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./dialog.tsx?raw";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "./dialog";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Dialog",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "open", "onOpenChange"] }),
  },
  args: { ...audit.args },
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">打开对话框</Button>
        </DialogTrigger>
        <DialogContent className={audit.buildClassName(args as unknown as Record<string, string>)}>
          <DialogHeader>
            <DialogTitle>对话框标题</DialogTitle>
            <DialogDescription>这是一段描述文本。</DialogDescription>
          </DialogHeader>
          <div className="py-base">对话框内容区域</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
};
