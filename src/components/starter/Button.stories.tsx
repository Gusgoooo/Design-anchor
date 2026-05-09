import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./button.tsx?raw";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; size: string; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Button",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["variant", "size", "children", "asChild"] }),
  },
  args: { variant: "default", size: "default", ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Button
      variant={args.variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
      size={args.size as "default" | "sm" | "lg" | "icon"}
      className={audit.buildClassName(args as Record<string, string>)}
    >
      按钮
    </Button>
  ),
};
