import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./markdown-text.tsx?raw";
import { Thread } from "./thread";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

const defaultMarkdown = `# Heading 1
## Heading 2
### Heading 3

Regular paragraph with **bold**, *italic*, and \`inline code\`.

> This is a blockquote with important information.

- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item
2. Another item

| Column A | Column B | Column C |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

\`\`\`typescript
function greet(name: string): string {
  return \\\`Hello, \\\${name}!\\\`;
}
\`\`\`

Here is a [link](https://example.com) and a horizontal rule:

---

That's all the markdown!`;

type Args = Record<string, unknown> & {
  markdownContent: string;
};

const meta: Meta<Args> = {
  title: "AI/MarkdownText",
  parameters: { layout: "fullscreen" },
  args: {
    markdownContent: defaultMarkdown,
    ...audit.args,
  },
  argTypes: {
    markdownContent: { control: "text", description: "Markdown content to render in the assistant message" },
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
      { role: "user", content: "Show me a markdown example" },
      { role: "assistant", content: args.markdownContent },
    ];
    return (
      <MockRuntimeProvider messages={messages}>
        <Thread />
      </MockRuntimeProvider>
    );
  },
};
