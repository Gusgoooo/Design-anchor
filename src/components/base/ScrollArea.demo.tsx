import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./scroll-area.tsx?raw";
import { ScrollArea } from "./scroll-area";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Base/ScrollArea",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children"] }),
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
  args: {
    rounded: "md",
    p: "0.5"
  },

  render: (args) => (
      <ScrollArea className={["h-[200px] w-[350px] rounded-md border p-4", spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className].filter(Boolean).join(" ")}>
        <div className="space-y-4">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="text-sm">Item {i + 1}</div>
          ))}
        </div>
      </ScrollArea>
    )
};
