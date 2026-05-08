import type { Meta, StoryObj } from "@storybook/react";
import { cssVar, tokenIdsByCategory } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Skeleton } from "./skeleton";

const spacingOptions = tokenIdsByCategory("spacing");

const meta = {
  title: "Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      extraTokenIds: ["skH1", "skH2", "skH3"],
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
    skH1: "space-2",
    skH2: "space-2",
    skH3: "space-24",
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    skH1: {
      control: "select",
      options: spacingOptions,
      description: "第一行骨架高度（spacing token）",
      table: { category: "骨架" },
    },
    skH2: {
      control: "select",
      options: spacingOptions,
      description: "第二行骨架高度（spacing token）",
      table: { category: "骨架" },
    },
    skH3: {
      control: "select",
      options: spacingOptions,
      description: "第三块骨架高度（spacing token）",
      table: { category: "骨架" },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {
  render: (args: any) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: cssVar(args.shellGap as string),
        width: "100%",
      }}
    >
      <Skeleton style={{ height: cssVar(args.skH1 as string), width: "75%" }} />
      <Skeleton style={{ height: cssVar(args.skH2 as string), width: "100%" }} />
      <Skeleton style={{ height: cssVar(args.skH3 as string), width: "100%" }} />
    </div>
  ),
};
