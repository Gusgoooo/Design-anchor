import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input.tsx?raw";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

type Args = { disabled: boolean; size: "sm" | "default" | "lg"; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Base/Input",
  tags: ["autodocs"],
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({
      ignoreArgNames: ["children", "id", "type", "placeholder", "disabled", "size"],
    }),
  },
  args: { disabled: false, size: "default", ...audit.args },
  argTypes: {
    disabled: { control: "boolean" },
    size: { control: "select", options: ["sm", "default", "lg"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        disabled={args.disabled}
        size={args.size}
        className={audit.buildClassName(args as Record<string, string>)}
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="email-d">Email</Label>
      <Input
        id="email-d"
        type="email"
        placeholder="Disabled"
        disabled={args.disabled}
        size={args.size}
        className={audit.buildClassName(args as Record<string, string>)}
      />
    </div>
  ),
};

/** Same height tiers as Button, for inline form alignment */
export const AlignWithButtons: Story = {
  render: (args) => (
    <div className="flex w-[min(100%,520px)] flex-col gap-6">
      {(["sm", "default", "lg"] as const).map((sz) => (
        <div key={sz} className="flex flex-nowrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">{sz}</span>
          <Button type="button" size={sz} className="shrink-0">
            Button
          </Button>
          <div className="w-[200px] min-w-0 shrink-0">
            <Input
              type="text"
              placeholder="Input"
              size={sz}
              disabled={args.disabled}
              className={`w-full ${audit.buildClassName(args as Record<string, string>)}`}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};
