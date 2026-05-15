import type { Meta, StoryObj } from "@storybook/react";
import { CopyIcon, RefreshCwIcon, CheckIcon, TrashIcon } from "lucide-react";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./tooltip-icon-button.tsx?raw";
import { TooltipIconButton } from "./tooltip-icon-button";

const audit = autoClassControls(componentSrc);

type Args = ClassOverrideArgs & {
  tooltip: string;
  side: "top" | "bottom" | "left" | "right";
  variant: "ghost" | "outline" | "default" | "destructive";
};

const meta: Meta<Args> = {
  title: "AI/TooltipIconButton",
  parameters: { layout: "centered" },
  args: {
    tooltip: "Copy",
    side: "bottom",
    variant: "ghost",
    ...audit.args,
  },
  argTypes: {
    tooltip: { control: "text" },
    side: { control: "select", options: ["top", "bottom", "left", "right"] },
    variant: { control: "select", options: ["ghost", "outline", "default", "destructive"] },
    ...audit.argTypes,
  },
  render: (args) => (
    <TooltipIconButton
      tooltip={args.tooltip}
      side={args.side}
      variant={args.variant}
      {...spreadAutoPreviewProps(audit, args)}
    >
      <CopyIcon />
    </TooltipIconButton>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <TooltipIconButton tooltip="Copy" variant="ghost" side={args.side} {...spreadAutoPreviewProps(audit, args)}>
        <CopyIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="Refresh" variant="outline" side={args.side} {...spreadAutoPreviewProps(audit, args)}>
        <RefreshCwIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="Confirm" variant="default" side={args.side} {...spreadAutoPreviewProps(audit, args)}>
        <CheckIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="Delete" variant="destructive" side={args.side} {...spreadAutoPreviewProps(audit, args)}>
        <TrashIcon />
      </TooltipIconButton>
    </div>
  ),
};

export const Sides: Story = {
  render: (args) => (
    <div className="flex items-center gap-8 p-16">
      <TooltipIconButton tooltip="Top" side="top" variant={args.variant} {...spreadAutoPreviewProps(audit, args)}>
        <CopyIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="Bottom" side="bottom" variant={args.variant} {...spreadAutoPreviewProps(audit, args)}>
        <CopyIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="Left" side="left" variant={args.variant} {...spreadAutoPreviewProps(audit, args)}>
        <CopyIcon />
      </TooltipIconButton>
      <TooltipIconButton tooltip="Right" side="right" variant={args.variant} {...spreadAutoPreviewProps(audit, args)}>
        <CopyIcon />
      </TooltipIconButton>
    </div>
  ),
};
