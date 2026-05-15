import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./separator.tsx?raw";
import { Separator } from "./separator";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Starter/Separator",
  parameters: {
    accordTokenCompliance: storyAccordCompliance({ ignoreArgNames: ["children"] }),
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
      <div className="w-[300px] space-y-4">
        <div className="text-sm font-medium">Content above</div>
        <Separator className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className} />
        <div className="text-sm text-muted-foreground">Content below</div>
      </div>
    ),
};
