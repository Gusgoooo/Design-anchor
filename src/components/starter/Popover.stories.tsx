import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./popover.tsx?raw";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Popover",
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">打开弹出框</Button>
        </PopoverTrigger>
        <PopoverContent className={audit.buildClassName(args as unknown as Record<string, string>)}>
          <div className="grid gap-4">
            <div className="text-sm font-medium">弹出框标题</div>
            <div className="text-sm text-muted-foreground">这是弹出框的内容。</div>
          </div>
        </PopoverContent>
      </Popover>
    ),
};
