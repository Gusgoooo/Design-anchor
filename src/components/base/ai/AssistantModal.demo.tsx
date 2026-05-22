import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { AssistantModal } from "./assistant-modal";
import { MockRuntimeProvider } from "./_story-runtime";

// AssistantModal doesn't accept a className prop, so autoClassControls
// would generate controls that have no effect. Skipped here.

type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "AI/AssistantModal",
  parameters: { layout: "fullscreen" },
  args: {},
  argTypes: {},
  decorators: [
    (Story) => (
      <MockRuntimeProvider>
        <div style={{ height: "100%", width: "100%", position: "relative" }}>
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
