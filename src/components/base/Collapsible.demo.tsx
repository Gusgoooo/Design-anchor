import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./collapsible.tsx?raw";
import * as Comp from "./collapsible";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Base/Collapsible",
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
      <Comp.Collapsible className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
        <Comp.CollapsibleTrigger asChild><button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm">Toggle</button></Comp.CollapsibleTrigger>
        <Comp.CollapsibleContent className="mt-2 rounded-md border p-4 text-sm">This is the collapsible content area.</Comp.CollapsibleContent>
      </Comp.Collapsible>
    );
  },
};
