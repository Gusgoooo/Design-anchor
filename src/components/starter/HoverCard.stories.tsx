import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./hover-card.tsx?raw";
import * as Comp from "./hover-card";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/HoverCard",
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
      <Comp.HoverCard>
        <Comp.HoverCardTrigger asChild><button className="text-sm underline">Hover to view</button></Comp.HoverCardTrigger>
        <Comp.HoverCardContent className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Hover Card</h4>
            <p className="text-sm text-muted-foreground">This is the hover card content.</p>
          </div>
        </Comp.HoverCardContent>
      </Comp.HoverCard>
    );
  },
};
