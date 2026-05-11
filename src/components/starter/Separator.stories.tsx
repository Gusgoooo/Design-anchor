import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./separator.tsx?raw";
import { Separator } from "./separator";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Separator",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children"] }),
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
      <div className="w-[300px] space-y-4">
        <div className="text-sm font-medium">上方内容</div>
        <Separator className={audit.buildClassName(args as unknown as Record<string, string>)} />
        <div className="text-sm text-muted-foreground">下方内容</div>
      </div>
    ),
};
