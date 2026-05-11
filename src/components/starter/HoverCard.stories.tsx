import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./hover-card.tsx?raw";
import * as Comp from "./hover-card";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "HoverCard",
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
      <Comp.HoverCard>
        <Comp.HoverCardTrigger asChild><button className="text-sm underline">悬停查看</button></Comp.HoverCardTrigger>
        <Comp.HoverCardContent className={audit.buildClassName(args)}>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Hover Card</h4>
            <p className="text-sm text-muted-foreground">这是悬浮卡片的内容。</p>
          </div>
        </Comp.HoverCardContent>
      </Comp.HoverCard>
    );
  },
};
