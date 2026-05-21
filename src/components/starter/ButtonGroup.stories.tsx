import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./button-group.tsx?raw";
import * as Comp from "./button-group";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/ButtonGroup",
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
      <Comp.ButtonGroup className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">Left</button>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">Center</button>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">Right</button>
      </Comp.ButtonGroup>
    );
  },
};
