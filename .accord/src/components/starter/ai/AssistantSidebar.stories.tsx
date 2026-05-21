import type { Meta, StoryObj } from "@storybook/react";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./assistant-sidebar.tsx?raw";
import { AssistantSidebar } from "./assistant-sidebar";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

type Args = ClassOverrideArgs & {
  contentText: string;
};

const meta: Meta<Args> = {
  title: "AI/AssistantSidebar",
  parameters: { layout: "fullscreen" },
  args: {
    contentText: "The assistant chat panel is on the right side, separated by a resizable handle.",
    ...audit.args,
  },
  argTypes: {
    contentText: { control: "text", description: "Main content area text" },
    ...audit.argTypes,
  },
  decorators: [
    (Story) => (
      <MockRuntimeProvider>
        <div style={{ height: "100vh", width: "100%" }}>
          <Story />
        </div>
      </MockRuntimeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AssistantSidebar {...spreadAutoPreviewProps(audit, args)}>
      <div className="flex h-full items-center justify-center bg-muted/30 p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Main Content Area</h2>
          <p className="text-muted-foreground text-sm mt-2">{args.contentText}</p>
        </div>
      </div>
    </AssistantSidebar>
  ),
};
