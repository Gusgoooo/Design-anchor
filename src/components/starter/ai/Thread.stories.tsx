import type { Meta, StoryObj } from "@storybook/react";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./thread.tsx?raw";
import { Thread } from "./thread";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "AI/Thread",
  parameters: { layout: "fullscreen" },
  args: {
    ...audit.args,
  },
  argTypes: audit.argTypes as Meta<Args>["argTypes"],
  decorators: [
    (Story) => (
      <MockRuntimeProvider>
        <Story />
      </MockRuntimeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Thread />,
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <MockRuntimeProvider messages={[]}>
        <Story />
      </MockRuntimeProvider>
    ),
  ],
  render: () => <Thread />,
};

const longConversation: ThreadMessageLike[] = [
  { role: "user", content: "What is TypeScript?" },
  {
    role: "assistant",
    content:
      "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds optional static typing, classes, and interfaces to JavaScript.",
  },
  { role: "user", content: "How do I get started?" },
  {
    role: "assistant",
    content:
      "To get started with TypeScript:\n\n1. Install it: `npm install -g typescript`\n2. Create a `.ts` file\n3. Compile with `tsc yourfile.ts`\n4. Run the generated `.js` file\n\nYou can also use `ts-node` to run TypeScript directly without a separate compile step.",
  },
  { role: "user", content: "What are generics?" },
  {
    role: "assistant",
    content:
      "Generics allow you to write reusable, type-safe code. They let you create components that work with multiple types rather than a single one.\n\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n```\n\nHere `T` is a type variable that captures the type provided by the caller.",
  },
];

export const LongConversation: Story = {
  decorators: [
    (Story) => (
      <MockRuntimeProvider messages={longConversation}>
        <Story />
      </MockRuntimeProvider>
    ),
  ],
  render: () => <Thread />,
};
