import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import * as React from "react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./navigation-menu.tsx?raw";
import * as Comp from "./navigation-menu";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

/** Storybook depends on URL; demo anchors rewrite the hash, breaking routing and easily mistaken for "fullscreen/lost UI" */
function preventStoryNav(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

const meta = {
  title: "Base/NavigationMenu",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <Comp.NavigationMenu className={prev.className}>
        <Comp.NavigationMenuList className={slot[0]}>
          <Comp.NavigationMenuItem>
            <Comp.NavigationMenuLink href="#" onClick={preventStoryNav} className={slot[3]}>
              Home
            </Comp.NavigationMenuLink>
          </Comp.NavigationMenuItem>
          <Comp.NavigationMenuItem>
            <Comp.NavigationMenuLink href="#" onClick={preventStoryNav} className={slot[3]}>
              About
            </Comp.NavigationMenuLink>
          </Comp.NavigationMenuItem>
        </Comp.NavigationMenuList>
      </Comp.NavigationMenu>
    );
  },
};
