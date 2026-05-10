import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input-group.tsx?raw";
import * as Comp from "./input-group";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "InputGroup",
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
  args: {
    shadow: "sm",
    py: "xxxs",
    p: "xxxs"
  },

  render: (args) => {
    return (
      <Comp.InputGroup className={audit.buildClassName(args)}>
        <Comp.InputGroupText>https://</Comp.InputGroupText>
        <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="example.com" />
      </Comp.InputGroup>
    );
  }
};
