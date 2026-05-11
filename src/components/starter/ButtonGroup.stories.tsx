import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./button-group.tsx?raw";
import * as Comp from "./button-group";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "ButtonGroup",
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
      <Comp.ButtonGroup className={audit.buildClassName(args)}>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">左</button>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">中</button>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">右</button>
      </Comp.ButtonGroup>
    );
  },
};
