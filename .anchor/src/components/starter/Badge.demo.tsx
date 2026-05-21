import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./badge.tsx?raw";
import { Badge } from "./badge";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Starter/Badge",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["variant", "children"] }),
  },
  args: { variant: "default", ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rounded: "sm"
  },

  render: (args) => (
    <Badge variant={args.variant as "default" | "secondary" | "destructive" | "outline"} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
      Badge
    </Badge>
  )
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex gap-2">
      {(["default", "secondary", "destructive", "outline"] as const).map((v) => (
        <Badge key={v} variant={v} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
