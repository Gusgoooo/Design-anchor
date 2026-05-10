import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./command.tsx?raw";
import * as Comp from "./command";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Command",
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
      <Comp.Command className={"w-[350px] rounded-lg border shadow-md " + audit.buildClassName(args)}>
        <Comp.CommandInput placeholder="输入搜索…" />
        <Comp.CommandList>
          <Comp.CommandEmpty>未找到结果</Comp.CommandEmpty>
          <Comp.CommandGroup heading="建议">
            <Comp.CommandItem>日历</Comp.CommandItem>
            <Comp.CommandItem>搜索</Comp.CommandItem>
            <Comp.CommandItem>设置</Comp.CommandItem>
          </Comp.CommandGroup>
        </Comp.CommandList>
      </Comp.Command>
    );
  },
};
