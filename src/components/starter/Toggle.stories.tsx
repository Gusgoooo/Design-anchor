import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./toggle.tsx?raw";
import * as Comp from "./toggle";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Toggle",
  parameters: {
    accordTokenCompliance: storyAccordCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (<Comp.Toggle className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className} aria-label="Toggle"><span className="text-sm">B</span></Comp.Toggle>
    );
  },
};
