import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./textarea.tsx?raw";
import { Textarea } from "./textarea";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Starter/Textarea",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children", "id", "placeholder", "disabled"] }),
  },
  args: { disabled: false, ...audit.args },
  argTypes: {
    disabled: { control: "boolean" },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
      <div className="grid w-[360px] gap-2">
        <Label htmlFor="msg">Message</Label>
        <Textarea id="msg" placeholder="Enter your message" className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className} />
      </div>
    ),
};
