import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Tabs",
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
  render: () => (
    <div style={{ width: "100%" }}>
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">概况</TabsTrigger>
          <TabsTrigger value="b">详情</TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="text-sm text-muted-foreground">
          概况面板内容。
        </TabsContent>
        <TabsContent value="b" className="text-sm text-muted-foreground">
          详情面板内容。
        </TabsContent>
      </Tabs>
    </div>
  ),
};
