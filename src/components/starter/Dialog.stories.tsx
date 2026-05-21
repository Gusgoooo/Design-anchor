import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import dialogSrc from "./dialog.tsx?raw";
import { Button } from "./button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "./dialog";

const audit = autoClassControls(dialogSrc);

type DialogStoryArgs = {
  defaultOpen: boolean;
  [k: string]: unknown;
};

const meta = {
  title: "Starter/Dialog",
  parameters: {
    layout: "fullscreen",
    anchorTokenCompliance: storyAnchorCompliance({
      ignoreArgNames: ["defaultOpen"],
    }),
  },
  args: {
    defaultOpen: false,
    ...audit.args,
  },
  argTypes: {
    defaultOpen: { control: "boolean", description: "Initially open state" },
    ...audit.argTypes,
  },
} satisfies Meta<DialogStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_a) => {
    const args = _a as unknown as DialogStoryArgs & Record<string, string>;
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <Dialog defaultOpen={args.defaultOpen}>
        <div className="flex min-h-screen items-center justify-center">
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
        </div>
        <DialogContent className={prev.className}>
          <DialogHeader className={slot[1]}>
            <DialogTitle className={slot[3]}>Dialog Title</DialogTitle>
            <DialogDescription className={slot[4]}>This is a description. Click the overlay or press Esc to close.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm">Dialog content area</div>
          <DialogFooter className={slot[2]}>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
