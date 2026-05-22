import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./attachment.tsx?raw";
import { Thread } from "./thread";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown> & {
  imageUrl: string;
  userText: string;
  assistantReply: string;
};

const meta: Meta<Args> = {
  title: "AI/Attachment",
  parameters: { layout: "fullscreen" },
  args: {
    imageUrl: "https://placehold.co/200x200/eee/999?text=Preview",
    userText: "Can you analyze this image?",
    assistantReply: "I can see the image you uploaded. This appears to be a placeholder image.",
    ...audit.args,
  },
  argTypes: {
    imageUrl: { control: "text", description: "Image URL for the attachment" },
    userText: { control: "text", description: "User message text" },
    assistantReply: { control: "text", description: "Assistant reply text" },
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
      {
        role: "user",
        content: [
          { type: "text", text: args.userText },
          { type: "image", image: args.imageUrl },
        ],
      },
      { role: "assistant", content: args.assistantReply },
    ];
    return (
      <MockRuntimeProvider messages={messages}>
        <Thread />
      </MockRuntimeProvider>
    );
  },
};
