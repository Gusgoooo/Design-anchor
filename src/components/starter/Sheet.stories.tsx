import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./sheet.tsx?raw";
import * as Comp from "./sheet";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Sheet",
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
      <Comp.Sheet>
        <Comp.SheetTrigger asChild><button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">Open Sheet</button></Comp.SheetTrigger>
        <Comp.SheetContent className={slot[0]}>
          <Comp.SheetHeader className={slot[1]}>
            <Comp.SheetTitle className={slot[3]}>Sheet Title</Comp.SheetTitle>
            <Comp.SheetDescription className={slot[4]}>Sheet description text.</Comp.SheetDescription>
          </Comp.SheetHeader>
          <div className="py-4 text-sm">Sheet content area</div>
        </Comp.SheetContent>
      </Comp.Sheet>
      </div>
    );
  },
};
