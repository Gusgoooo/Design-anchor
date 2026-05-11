import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./kbd.tsx?raw";
import * as Comp from "./kbd";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Kbd",
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
      <div className="flex items-center gap-2">
        <Comp.Kbd className={audit.buildClassName(args)}>⌘</Comp.Kbd>
        <span className="text-sm text-muted-foreground">+</span>
        <Comp.Kbd>K</Comp.Kbd>
      </div>
    );
  },
};
