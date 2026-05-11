import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./field.tsx?raw";
import * as Comp from "./field";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Field",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <Comp.Field className={audit.buildClassName(args)}>
        <Comp.FieldLabel>邮箱</Comp.FieldLabel>
        <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="your@email.com" />
        <Comp.FieldDescription>请输入有效的邮箱地址。</Comp.FieldDescription>
      </Comp.Field>
    );
  },
};
