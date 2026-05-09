import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./select.tsx?raw";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Select",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "value", "defaultValue", "onValueChange"] }),
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
      <div className="w-[320px]">
        <Select>
          <SelectTrigger className={audit.buildClassName(args as unknown as Record<string, string>)}>
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">选项 A</SelectItem>
            <SelectItem value="b">选项 B</SelectItem>
            <SelectItem value="c">选项 C</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
};
