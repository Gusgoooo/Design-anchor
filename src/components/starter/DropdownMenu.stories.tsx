import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./dropdown-menu.tsx?raw";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./dropdown-menu";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Starter/DropdownMenu",
  parameters: {
    accordTokenCompliance: storyAccordCompliance({ ignoreArgNames: ["children"] }),
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
  args: {
    bg_muted: "border"
  },

  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={slot[1]}>
          <DropdownMenuLabel className={slot[5]}>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className={slot[6]} />
          <DropdownMenuItem className={slot[2]}>Profile</DropdownMenuItem>
          <DropdownMenuItem className={slot[2]}>Billing</DropdownMenuItem>
          <DropdownMenuItem className={slot[2]}>Team</DropdownMenuItem>
          <DropdownMenuItem className={slot[2]}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
};
