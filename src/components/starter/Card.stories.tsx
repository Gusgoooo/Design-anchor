import type { Meta, StoryObj } from "@storybook/react";
import { cssVar } from "@/design-tokens/story-controls";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
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
  },
  argTypes: {
    shellPadding: { table: { disable: true } },
    shellMaxWidth: { table: { disable: true } },
    shellGap: { table: { disable: true } },
    shellRadius: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => (
    <Card className="w-full border-border bg-card text-card-foreground shadow">
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>用于分组展示内容与操作区。</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">正文区域。</p>
      </CardContent>
      <CardFooter
        style={{
          display: "flex",
          flexDirection: "row",
          gap: cssVar(pickPreviewShellArgs(args as Record<string, unknown>).shellGap),
        }}
        className="border-0 bg-transparent p-6 pt-0 shadow-none"
      >
        <Button size="sm">确认</Button>
        <Button size="sm" variant="outline">
          取消
        </Button>
      </CardFooter>
    </Card>
  ),
};
