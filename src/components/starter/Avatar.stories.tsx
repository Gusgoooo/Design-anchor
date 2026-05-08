import type { Meta, StoryObj } from "@storybook/react";
import {
  pickPreviewShellArgs,
  previewShellDefaults,
  PreviewShell,
  storyHarnessCompliance,
} from "@/design-tokens/story-preview-shell";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "Avatar",
  component: Avatar,
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

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="头像" />
      <AvatarFallback>FX</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
  ),
};
