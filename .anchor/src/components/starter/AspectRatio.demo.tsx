import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./aspect-ratio.tsx?raw";
import * as Comp from "./aspect-ratio";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/AspectRatio",
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
    return (
      <div className="w-[450px]">
        <Comp.AspectRatio ratio={16 / 9} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
          <div className="flex h-full w-full items-center justify-center rounded-md bg-muted text-muted-foreground">16:9</div>
        </Comp.AspectRatio>
      </div>
    );
  },
};
