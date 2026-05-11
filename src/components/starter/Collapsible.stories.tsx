import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./collapsible.tsx?raw";
import * as Comp from "./collapsible";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Collapsible",
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
      <Comp.Collapsible className={audit.buildClassName(args)}>
        <Comp.CollapsibleTrigger asChild><button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">切换</button></Comp.CollapsibleTrigger>
        <Comp.CollapsibleContent className="mt-2 rounded-md border p-4 text-sm">这是可折叠的内容区域。</Comp.CollapsibleContent>
      </Comp.Collapsible>
    );
  },
};
