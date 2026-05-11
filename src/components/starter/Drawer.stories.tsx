import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./drawer.tsx?raw";
import * as Comp from "./drawer";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Drawer",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    harnessTokenCompliance: storyHarnessCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <div className="flex min-h-screen items-center justify-center">
      <Comp.Drawer>
        <Comp.DrawerTrigger asChild><button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">打开抽屉</button></Comp.DrawerTrigger>
        <Comp.DrawerContent className={audit.buildClassName(args)}>
          <Comp.DrawerHeader>
            <Comp.DrawerTitle>编辑内容</Comp.DrawerTitle>
            <Comp.DrawerDescription>修改后点击保存。</Comp.DrawerDescription>
          </Comp.DrawerHeader>
          <div className="p-4 text-sm">抽屉内容区域</div>
          <Comp.DrawerFooter>
            <Comp.DrawerClose asChild><button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">关闭</button></Comp.DrawerClose>
          </Comp.DrawerFooter>
        </Comp.DrawerContent>
      </Comp.Drawer>
      </div>
    );
  },
};
