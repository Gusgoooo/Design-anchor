import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./alert.tsx?raw";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Alert",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["variant", "children"] }),
  },
  args: { variant: "default", ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert variant={args.variant as "default" | "destructive"} className={audit.buildClassName(args as Record<string, string>)}>
      <AlertTitle>提示标题</AlertTitle>
      <AlertDescription>这是一条默认的提示消息，用于展示组件的基本样式。</AlertDescription>
    </Alert>
  ),
};
