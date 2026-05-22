import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./toggle-group.tsx?raw";
import * as Comp from "./toggle-group";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Base/ToggleGroup",
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
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <Comp.ToggleGroup type="single" className={prev.className}>
        <Comp.ToggleGroupItem value="bold" aria-label="Bold" className={slot[0]}><span className="text-sm font-bold">B</span></Comp.ToggleGroupItem>
        <Comp.ToggleGroupItem value="italic" aria-label="Italic" className={slot[0]}><span className="text-sm italic">I</span></Comp.ToggleGroupItem>
        <Comp.ToggleGroupItem value="underline" aria-label="Underline" className={slot[0]}><span className="text-sm underline">U</span></Comp.ToggleGroupItem>
      </Comp.ToggleGroup>
    );
  },
};
