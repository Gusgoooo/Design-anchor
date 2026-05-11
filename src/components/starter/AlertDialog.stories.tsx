import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./alert-dialog.tsx?raw";
import * as Comp from "./alert-dialog";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "AlertDialog",
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
      <Comp.AlertDialog>
        <Comp.AlertDialogTrigger asChild><button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">打开</button></Comp.AlertDialogTrigger>
        <Comp.AlertDialogContent className={audit.buildClassName(args)}>
          <Comp.AlertDialogHeader>
            <Comp.AlertDialogTitle>确认操作？</Comp.AlertDialogTitle>
            <Comp.AlertDialogDescription>此操作不可撤销。</Comp.AlertDialogDescription>
          </Comp.AlertDialogHeader>
          <Comp.AlertDialogFooter>
            <Comp.AlertDialogCancel>取消</Comp.AlertDialogCancel>
            <Comp.AlertDialogAction>继续</Comp.AlertDialogAction>
          </Comp.AlertDialogFooter>
        </Comp.AlertDialogContent>
      </Comp.AlertDialog>
      </div>
    );
  },
};
