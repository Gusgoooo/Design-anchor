import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./resizable.tsx?raw";
import * as Comp from "./resizable";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Resizable",
  tags: ["autodocs"],
  parameters: {
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
      <Comp.ResizablePanelGroup orientation="horizontal" className={"min-h-[200px] max-w-md rounded-lg border " + audit.buildClassName(args)}>
        <Comp.ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center p-6"><span className="font-semibold">左侧</span></div></Comp.ResizablePanel>
        <Comp.ResizableHandle />
        <Comp.ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center p-6"><span className="font-semibold">右侧</span></div></Comp.ResizablePanel>
      </Comp.ResizablePanelGroup>
    );
  },
};
