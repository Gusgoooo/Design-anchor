import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./avatar.tsx?raw";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Avatar",
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
      <Avatar className={audit.buildClassName(args as unknown as Record<string, string>)}>
        <AvatarImage src="https://github.com/shadcn.png" alt="头像" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    ),
};
