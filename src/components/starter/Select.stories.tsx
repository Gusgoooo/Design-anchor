import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./select.tsx?raw";
import { Button } from "./button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";

const audit = autoClassControls(componentSrc);

type Args = { size: "sm" | "default" | "lg"; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Select",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["children", "value", "defaultValue", "onValueChange", "size"],
    }),
  },
  args: { size: "default", ...audit.args },
  argTypes: {
    size: { control: "select", options: ["sm", "default", "lg"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
      <div className="w-[320px]">
        <Select>
          <SelectTrigger
            size={args.size}
            className={audit.buildClassName(args as unknown as Record<string, string>)}
          >
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

export const AlignWithButtons: Story = {
  render: () => (
    <div className="flex w-[min(100%,520px)] flex-col gap-6">
      {(["sm", "default", "lg"] as const).map((sz) => (
        <div key={sz} className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">{sz}</span>
          <Button type="button" size={sz}>
            按钮
          </Button>
          <div className="w-[220px]">
            <Select>
              <SelectTrigger size={sz}>
                <SelectValue placeholder="选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">A</SelectItem>
                <SelectItem value="b">B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  ),
};
