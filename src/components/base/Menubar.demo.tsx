import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./menubar.tsx?raw";
import * as Comp from "./menubar";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Base/Menubar",
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
      <Comp.Menubar className={prev.className}>
        <Comp.MenubarMenu>
          <Comp.MenubarTrigger className={slot[0]}>File</Comp.MenubarTrigger>
          <Comp.MenubarContent className={slot[3]}>
            <Comp.MenubarItem className={slot[4]}>New</Comp.MenubarItem>
            <Comp.MenubarItem className={slot[4]}>Open</Comp.MenubarItem>
            <Comp.MenubarSeparator className={slot[8]} />
            <Comp.MenubarItem className={slot[4]}>Exit</Comp.MenubarItem>
          </Comp.MenubarContent>
        </Comp.MenubarMenu>
        <Comp.MenubarMenu>
          <Comp.MenubarTrigger className={slot[0]}>Edit</Comp.MenubarTrigger>
          <Comp.MenubarContent className={slot[3]}>
            <Comp.MenubarItem className={slot[4]}>Undo</Comp.MenubarItem>
            <Comp.MenubarItem className={slot[4]}>Redo</Comp.MenubarItem>
          </Comp.MenubarContent>
        </Comp.MenubarMenu>
      </Comp.Menubar>
    );
  },
};
