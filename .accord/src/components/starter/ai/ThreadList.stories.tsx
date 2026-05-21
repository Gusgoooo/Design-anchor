import type { Meta, StoryObj } from "@storybook/react";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./thread-list.tsx?raw";
import { ThreadList } from "./thread-list";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown> & {
  width: number;
};

const meta: Meta<Args> = {
  title: "AI/ThreadList",
  parameters: { layout: "centered" },
  args: {
    width: 280,
    ...audit.args,
  },
  argTypes: {
    width: { control: { type: "range", min: 200, max: 400, step: 10 }, description: "Container width (px)" },
    ...audit.argTypes,
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
