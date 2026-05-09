import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./progress.tsx?raw";
import { Progress } from "./progress";

const audit = autoClassControls(componentSrc);

type Args = { value: number; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Progress",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["value", "children"] }),
  },
  args: { value: 60, ...audit.args },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[360px]">
      <Progress value={args.value} className={audit.buildClassName(args as Record<string, string>)} />
    </div>
  ),
};
