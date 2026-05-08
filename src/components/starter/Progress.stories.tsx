import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Progress } from "./progress";

const meta = {
  title: "Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["value", "max"],
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
    value: 45,
    max: 100,
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    value: { control: { type: "range", min: 0, max: 100 } },
    max: { control: "number" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {
  render: (args: any) => (
    <div style={{ width: "100%" }}>
      <Progress {...args} />
    </div>
  ),
};

function ProgressAnimatedDemo({ shellGap }: { shellGap: string }) {
  const [v, setV] = React.useState(10);
  React.useEffect(() => {
    const t = window.setInterval(() => setV((x) => (x >= 100 ? 10 : x + 5)), 400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: cssVar(shellGap),
      }}
    >
      <Progress value={v} />
      <p className="text-xs text-muted-foreground">{v}%</p>
    </div>
  );
}

export const AnimatedDemo: Story = {
  render: (args: any) => <ProgressAnimatedDemo shellGap={args.shellGap as string} />,
};
