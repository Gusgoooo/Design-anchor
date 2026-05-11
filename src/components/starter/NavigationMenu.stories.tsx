import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./navigation-menu.tsx?raw";
import * as Comp from "./navigation-menu";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "NavigationMenu",
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
      <Comp.NavigationMenu className={audit.buildClassName(args)}>
        <Comp.NavigationMenuList>
          <Comp.NavigationMenuItem>
            <Comp.NavigationMenuLink className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium">首页</Comp.NavigationMenuLink>
          </Comp.NavigationMenuItem>
          <Comp.NavigationMenuItem>
            <Comp.NavigationMenuLink className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium">关于</Comp.NavigationMenuLink>
          </Comp.NavigationMenuItem>
        </Comp.NavigationMenuList>
      </Comp.NavigationMenu>
    );
  },
};
