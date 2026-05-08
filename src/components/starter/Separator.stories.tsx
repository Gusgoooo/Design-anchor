import type { Meta, StoryObj } from "@storybook/react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Separator } from "./separator";

const meta = {
  title: "Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["orientation"],
    }),
  },
  decorators: [
    (Story, ctx) => (
      <PreviewShell args={pickPreviewShellArgs(ctx.args as Record<string, unknown>)}>
        <Story />
      </PreviewShell>
    ),
  ],
  args: {
    ...previewShellDefaults,
    orientation: "horizontal",
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Horizontal: Story = {
  render: (args: any) => (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: cssVar(args.shellGap as string),
      }}
    >
      <p className="text-sm">区块 A</p>
      <Separator orientation={args.orientation} />
      <p className="text-sm">区块 B</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args: any) => (
    <div
      style={{
        display: "flex",
        height: "4rem",
        alignItems: "center",
        gap: cssVar(args.shellGap as string),
      }}
    >
      <span className="text-sm">左</span>
      <Separator orientation={args.orientation} decorative />
      <span className="text-sm">右</span>
    </div>
  ),
};
