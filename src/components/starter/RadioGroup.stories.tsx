import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./radio-group.tsx?raw";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "RadioGroup",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "defaultValue", "value", "onValueChange"] }),
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
      <RadioGroup defaultValue="option-b" className={audit.buildClassName(args as unknown as Record<string, string>)}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option-a" id="r1" />
          <Label htmlFor="r1">选项 A</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option-b" id="r2" />
          <Label htmlFor="r2">选项 B</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option-c" id="r3" />
          <Label htmlFor="r3">选项 C</Label>
        </div>
      </RadioGroup>
    ),
};
