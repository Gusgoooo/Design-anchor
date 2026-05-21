import type { Meta, StoryObj } from "@storybook/react";
import { autoClassControls, spreadAutoPreviewProps } from "@/design-tokens/tw-class-audit";
import componentSrc from "./tool-group.tsx?raw";
import {
  ToolGroupRoot,
  ToolGroupTrigger,
  ToolGroupContent,
} from "./tool-group";
import {
  ToolFallbackRoot,
  ToolFallbackTrigger,
  ToolFallbackContent,
  ToolFallbackArgs,
  ToolFallbackResult,
} from "./tool-fallback";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown> & {
  count: number;
  active: boolean;
  variant: "outline" | "ghost" | "muted";
  defaultOpen: boolean;
};

const meta: Meta<Args> = {
  title: "AI/ToolGroup",
  parameters: { layout: "centered" },
  args: {
    count: 2,
    active: false,
    variant: "outline",
    defaultOpen: true,
    ...audit.args,
  },
  argTypes: {
    count: { control: { type: "number", min: 1, max: 10 } },
    active: { control: "boolean" },
    variant: { control: "select", options: ["outline", "ghost", "muted"] },
    defaultOpen: { control: "boolean" },
    ...audit.argTypes,
  },
  render: (args) => (
    <div className="w-[420px]">
      <ToolGroupRoot variant={args.variant} defaultOpen={args.defaultOpen} {...spreadAutoPreviewProps(audit, args as Record<string, string | number | undefined>)}>
        <ToolGroupTrigger count={args.count} active={args.active} />
        <ToolGroupContent>
          <ToolFallbackRoot>
            <ToolFallbackTrigger toolName="searchDocs" status={{ type: "complete" }} />
            <ToolFallbackContent>
              <ToolFallbackArgs argsText='{"query": "React hooks"}' />
              <ToolFallbackResult result="Found 3 relevant documents" />
            </ToolFallbackContent>
          </ToolFallbackRoot>
          <ToolFallbackRoot>
            <ToolFallbackTrigger toolName="readFile" status={{ type: "complete" }} />
            <ToolFallbackContent>
              <ToolFallbackArgs argsText='{"path": "src/hooks/useAuth.ts"}' />
              <ToolFallbackResult result="File content loaded (142 lines)" />
            </ToolFallbackContent>
          </ToolFallbackRoot>
        </ToolGroupContent>
      </ToolGroupRoot>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    count: 3,
    active: true,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-4">
      {(["outline", "ghost", "muted"] as const).map((v) => (
        <ToolGroupRoot key={v} variant={v} defaultOpen>
          <ToolGroupTrigger count={1} />
          <ToolGroupContent>
            <ToolFallbackRoot>
              <ToolFallbackTrigger toolName="search" status={{ type: "complete" }} />
            </ToolFallbackRoot>
          </ToolGroupContent>
        </ToolGroupRoot>
      ))}
    </div>
  ),
};
