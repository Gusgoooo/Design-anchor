import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input.tsx?raw";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

type Args = { disabled: boolean; size: "sm" | "default" | "lg"; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Input",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["children", "id", "type", "placeholder", "disabled", "size"],
    }),
  },
  args: { disabled: false, size: "default", ...audit.args },
  argTypes: {
    disabled: { control: "boolean" },
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
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="email">邮箱</Label>
      <Input
        id="email"
        type="email"
        placeholder="请输入邮箱"
        disabled={args.disabled}
        size={args.size}
        className={audit.buildClassName(args as Record<string, string>)}
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="email-d">邮箱</Label>
      <Input
        id="email-d"
        type="email"
        placeholder="禁用状态"
        disabled={args.disabled}
        size={args.size}
        className={audit.buildClassName(args as Record<string, string>)}
      />
    </div>
  ),
};

/** 与 Button 同档同高，便于表单行内对齐 */
export const AlignWithButtons: Story = {
  render: (args) => (
    <div className="flex w-[min(100%,520px)] flex-col gap-6">
      {(["sm", "default", "lg"] as const).map((sz) => (
        <div key={sz} className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">{sz}</span>
          <Button type="button" size={sz}>
            按钮
          </Button>
          <Input type="text" placeholder="输入" size={sz} disabled={args.disabled} className="max-w-[200px]" />
        </div>
      ))}
    </div>
  ),
};
