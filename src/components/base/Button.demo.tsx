import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./button.tsx?raw";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; size: string; disabled: boolean; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Base/Button",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["variant", "size", "children", "asChild", "disabled"] }),
  },
  args: { variant: "default", size: "default", disabled: false, ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    disabled: { control: "boolean" },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Button
      variant={args.variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
      size={args.size as "default" | "sm" | "lg" | "icon"}
      disabled={args.disabled}
      className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}
    >
      Button
    </Button>
  ),
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(["default", "destructive", "outline", "secondary", "ghost", "link"] as const).map((v) => (
        <Button key={v} variant={v} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Button size="sm" className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>Small</Button>
      <Button size="default" className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>Default</Button>
      <Button size="lg" className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>Large</Button>
      <Button size="icon" className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>⚡</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="flex gap-2">
      <Button disabled={args.disabled} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>Disabled</Button>
      <Button variant="outline" disabled={args.disabled} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>Disabled Outline</Button>
      <Button variant="destructive" disabled={args.disabled} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className}>Disabled Destructive</Button>
    </div>
  ),
};
