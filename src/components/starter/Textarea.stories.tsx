import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./textarea.tsx?raw";
import { Textarea } from "./textarea";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Textarea",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "id", "placeholder", "disabled"] }),
  },
  args: { disabled: false, ...audit.args },
  argTypes: {
    disabled: { control: "boolean" },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
      <div className="grid w-[360px] gap-xs">
        <Label htmlFor="msg">消息</Label>
        <Textarea id="msg" placeholder="请输入消息" className={audit.buildClassName(args as unknown as Record<string, string>)} />
      </div>
    ),
};
