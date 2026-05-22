import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./follow-up-suggestions.tsx?raw";
import { Thread } from "./thread";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown> & {
  userMessage: string;
  assistantReply: string;
};

const meta: Meta<Args> = {
  title: "AI/FollowUpSuggestions",
  parameters: { layout: "fullscreen" },
  args: {
    userMessage: "Tell me about React",
    assistantReply:
      "React is a JavaScript library for building user interfaces. It uses a component-based architecture and a virtual DOM for efficient rendering.",
    ...audit.args,
  },
  argTypes: {
    userMessage: { control: "text", description: "User message" },
    assistantReply: { control: "text", description: "Assistant reply" },
    ...audit.argTypes,
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100%", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const messages: ThreadMessageLike[] = [
      { role: "user", content: args.userMessage },
      { role: "assistant", content: args.assistantReply },
    ];
    return (
      <MockRuntimeProvider messages={messages}>
        <Thread />
      </MockRuntimeProvider>
    );
  },
};
