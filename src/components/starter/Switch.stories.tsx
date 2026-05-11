import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./switch.tsx?raw";
import { Switch } from "./switch";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Switch",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "id"] }),
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
      <div className="flex items-center gap-2">
        <Switch id="airplane" className={audit.buildClassName(args as unknown as Record<string, string>)} />
        <Label htmlFor="airplane">飞行模式</Label>
      </div>
    ),
};
