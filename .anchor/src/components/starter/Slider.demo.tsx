import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./slider.tsx?raw";
import { Slider } from "./slider";

const audit = autoClassControls(componentSrc, {
  hidePrefixes: ["w", "h", "rounded", "shadow"],
});

const meta = {
  title: "Starter/Slider",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children", "defaultValue", "max", "step"] }),
  },
  args: { ...audit.args },
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[300px]">
      <Slider defaultValue={[50]} max={100} step={1} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className} />
    </div>
  ),
};
