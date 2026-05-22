import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { ThreadList } from "./thread-list";
import { MockRuntimeProvider } from "./_story-runtime";

// ThreadList doesn't accept className overrides — auto class controls
// would have no visible effect. The width arg below DOES work.

type Args = {
  width: number;
};

const meta: Meta<Args> = {
  title: "AI/ThreadList",
  parameters: { layout: "centered" },
  args: {
    width: 280,
  },
  argTypes: {
    width: { control: { type: "range", min: 200, max: 400, step: 10 }, description: "Container width (px)" },
  },
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
  render: (args) => (
    <div style={{ width: args.width, padding: 8 }}>
      <ThreadList />
    </div>
  ),
};
