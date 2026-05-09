import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./slider.tsx?raw";
import { Slider } from "./slider";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Slider",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "defaultValue", "max", "step"] }),
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
      <div className="w-[300px]">
        <Slider defaultValue={[50]} max={100} step={1} className={audit.buildClassName(args as unknown as Record<string, string>)} />
      </div>
    ),
};
