import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./dropdown-menu.tsx?raw";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./dropdown-menu";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "DropdownMenu",
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">打开菜单</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={audit.buildClassName(args as unknown as Record<string, string>)}>
          <DropdownMenuLabel>我的账户</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>个人设置</DropdownMenuItem>
          <DropdownMenuItem>账单管理</DropdownMenuItem>
          <DropdownMenuItem>团队管理</DropdownMenuItem>
          <DropdownMenuItem>退出登录</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
};
