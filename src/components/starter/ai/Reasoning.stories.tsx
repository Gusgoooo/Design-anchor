import type { Meta, StoryObj } from "@storybook/react";
import { autoClassControls, spreadAutoPreviewProps } from "@/design-tokens/tw-class-audit";
import componentSrc from "./reasoning.tsx?raw";
import {
  ReasoningRoot,
  ReasoningTrigger,
  ReasoningContent,
  ReasoningText,
} from "./reasoning";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown> & {
  variant: "outline" | "ghost" | "muted";
  defaultOpen: boolean;
  active: boolean;
  duration: number;
};

const meta: Meta<Args> = {
  title: "AI/Reasoning",
  parameters: { layout: "centered" },
  args: {
    variant: "outline",
    defaultOpen: true,
    active: false,
    duration: 0,
    ...audit.args,
  },
  argTypes: {
    variant: { control: "select", options: ["outline", "ghost", "muted"] },
    defaultOpen: { control: "boolean" },
    active: { control: "boolean" },
    duration: { control: { type: "number", min: 0, max: 120 } },
    ...audit.argTypes,
  },
  render: (args) => (
    <div className="w-[500px]">
      <ReasoningRoot variant={args.variant} defaultOpen={args.defaultOpen} {...spreadAutoPreviewProps(audit, args as Record<string, string | number | undefined>)}>
        <ReasoningTrigger active={args.active} duration={args.duration || undefined} />
        <ReasoningContent>
          <ReasoningText>
            <p>The user is asking about React hooks. Let me think about the best way to explain this...</p>
            <p>First, I should cover useState and useEffect as they are the most commonly used hooks.</p>
            <p>Then I can mention useCallback and useMemo for optimization.</p>
          </ReasoningText>
        </ReasoningContent>
      </ReasoningRoot>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: { defaultOpen: false },
};

export const Active: Story = {
  args: { active: true },
};

export const WithDuration: Story = {
  args: { duration: 12, defaultOpen: false },
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[500px] flex-col gap-4">
      {(["outline", "ghost", "muted"] as const).map((v) => (
        <ReasoningRoot key={v} variant={v} defaultOpen>
          <ReasoningTrigger />
          <ReasoningContent>
            <ReasoningText>
              <p>{v} variant</p>
            </ReasoningText>
          </ReasoningContent>
        </ReasoningRoot>
      ))}
    </div>
  ),
};
