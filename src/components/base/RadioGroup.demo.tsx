import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./radio-group.tsx?raw";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Base/RadioGroup",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children", "defaultValue", "value", "onValueChange"] }),
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
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <RadioGroup defaultValue="option-b" className={prev.className}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option-a" id="r1" className={slot[0]} />
          <Label htmlFor="r1">Option A</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option-b" id="r2" className={slot[0]} />
          <Label htmlFor="r2">Option B</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option-c" id="r3" className={slot[0]} />
          <Label htmlFor="r3">Option C</Label>
        </div>
      </RadioGroup>
    );
  },
};
