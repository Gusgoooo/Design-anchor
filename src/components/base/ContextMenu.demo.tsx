import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./context-menu.tsx?raw";
import * as Comp from "./context-menu";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Base/ContextMenu",
  parameters: {
    layout: "fullscreen",
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
      <div className="flex min-h-screen items-center justify-center">
      <Comp.ContextMenu>
        <Comp.ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">Right-click here</Comp.ContextMenuTrigger>
        <Comp.ContextMenuContent className={slot[1]}>
          <Comp.ContextMenuItem className={slot[2]}>Back</Comp.ContextMenuItem>
          <Comp.ContextMenuItem className={slot[2]}>Forward</Comp.ContextMenuItem>
          <Comp.ContextMenuItem className={slot[2]}>Refresh</Comp.ContextMenuItem>
          <Comp.ContextMenuSeparator className={slot[6]} />
          <Comp.ContextMenuItem className={slot[2]}>View Source</Comp.ContextMenuItem>
        </Comp.ContextMenuContent>
      </Comp.ContextMenu>
      </div>
    );
  },
};
