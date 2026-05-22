import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./assistant-modal.tsx?raw";
import { AssistantModal } from "./assistant-modal";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "AI/AssistantModal",
  parameters: { layout: "fullscreen" },
  args: {
    ...audit.args,
  },
  argTypes: audit.argTypes as Meta<Args>["argTypes"],
  decorators: [
    (Story) => (
      <MockRuntimeProvider>
        <div style={{ height: "100vh", width: "100%", position: "relative" }}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Click the bot icon in the bottom-right corner
          </div>
          <Story />
        </div>
      </MockRuntimeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <AssistantModal />,
};
