import type { Meta, StoryObj } from "@storybook/react";
import { cssVar, tokenIdsByCategory } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { ScrollArea } from "./scroll-area";

const spacingOptions = tokenIdsByCategory("spacing");

const meta = {
  title: "ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      extraTokenIds: ["scrollMinHeight", "scrollPadding"],
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
    scrollMinHeight: "space-32",
    scrollPadding: "space-3",
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
    scrollMinHeight: {
      control: "select",
      options: spacingOptions,
      description: "滚动区最小高度（spacing token）",
      table: { category: "演示" },
    },
    scrollPadding: {
      control: "select",
      options: spacingOptions,
      description: "滚动区内边距（spacing token）",
      table: { category: "演示" },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<Record<string, any>>;

export const Default: Story = {
  render: (args: any) => (
    <ScrollArea
      className="rounded-md border border-border"
      style={{
        minHeight: cssVar(args.scrollMinHeight as string),
        maxWidth: cssVar(args.shellMaxWidth as string),
        borderRadius: cssVar(args.shellRadius as string),
        padding: cssVar(args.scrollPadding as string),
      }}
    >
      {Array.from({ length: 24 }, (_, i) => (
        <p key={i} className="text-sm leading-relaxed">
          第 {i + 1} 行 — 滚动区域使用原生 overflow-auto，无额外依赖。
        </p>
      ))}
    </ScrollArea>
  ),
};
