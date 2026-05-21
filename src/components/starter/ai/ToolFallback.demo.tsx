import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { autoClassControls, spreadAutoPreviewProps } from "@/design-tokens/tw-class-audit";
import componentSrc from "./tool-fallback.tsx?raw";
import {
  ToolFallbackRoot,
  ToolFallbackTrigger,
  ToolFallbackContent,
  ToolFallbackArgs,
  ToolFallbackResult,
  ToolFallbackError,
} from "./tool-fallback";

const audit = autoClassControls(componentSrc);

type Args = Record<string, unknown> & {
  toolName: string;
  statusType: "running" | "complete" | "incomplete";
  argsText: string;
  resultText: string;
  defaultOpen: boolean;
};

const meta: Meta<Args> = {
  title: "AI/ToolFallback",
  parameters: { layout: "centered" },
  args: {
    toolName: "searchDatabase",
    statusType: "complete",
    argsText: '{"query": "latest orders", "limit": 10}',
    resultText: '[{"id": 1, "name": "Order #1001"}, {"id": 2, "name": "Order #1002"}]',
    defaultOpen: true,
    ...audit.args,
  },
  argTypes: {
    toolName: { control: "text" },
    statusType: { control: "select", options: ["running", "complete", "incomplete"] },
    argsText: { control: "text" },
    resultText: { control: "text" },
    defaultOpen: { control: "boolean" },
    ...audit.argTypes,
  },
  render: (args) => {
    const status =
      args.statusType === "incomplete"
        ? { type: "incomplete" as const, reason: "error" as const, error: "Connection failed" }
        : args.statusType === "running"
          ? { type: "running" as const }
          : { type: "complete" as const };
    let result: unknown;
    try { result = JSON.parse(args.resultText); } catch { result = args.resultText; }
    return (
      <div className="w-[400px]">
        <ToolFallbackRoot defaultOpen={args.defaultOpen} {...spreadAutoPreviewProps(audit, args as Record<string, string | number | undefined>)}>
          <ToolFallbackTrigger toolName={args.toolName} status={status} />
          <ToolFallbackContent>
            <ToolFallbackError status={status} />
            <ToolFallbackArgs argsText={args.argsText} />
            <ToolFallbackResult result={result} />
          </ToolFallbackContent>
        </ToolFallbackRoot>
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Running: Story = {
  args: {
    toolName: "fetchWeather",
    statusType: "running",
    argsText: '{"city": "Shanghai"}',
    resultText: "",
  },
};

export const WithError: Story = {
  args: {
    toolName: "callAPI",
    statusType: "incomplete",
    argsText: '{"endpoint": "/api/users"}',
    resultText: "",
  },
};

export const Cancelled: Story = {
  render: () => (
    <div className="w-[400px]">
      <ToolFallbackRoot className="border-muted-foreground/30 bg-muted/30">
        <ToolFallbackTrigger
          toolName="generateReport"
          status={{ type: "incomplete", reason: "cancelled", error: "User cancelled the operation" }}
        />
        <ToolFallbackContent>
          <ToolFallbackError
            status={{ type: "incomplete", reason: "cancelled", error: "User cancelled the operation" }}
          />
          <ToolFallbackArgs argsText='{"type": "monthly"}' className="opacity-60" />
        </ToolFallbackContent>
      </ToolFallbackRoot>
    </div>
  ),
};
