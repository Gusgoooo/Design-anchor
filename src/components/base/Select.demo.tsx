import { useState } from "react";
import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./select.tsx?raw";
import { Button } from "./button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";
import {
  SelectRoot as AuiSelectRoot,
  SelectTrigger as AuiSelectTrigger,
  SelectContent as AuiSelectContent,
  SelectItem as AuiSelectItem,
  SelectLabel as AuiSelectLabel,
  SelectGroup as AuiSelectGroup,
  SelectSeparator as AuiSelectSeparator,
} from "./ai/select";

const audit = autoClassControls(componentSrc);

type Args = { size: "sm" | "default" | "lg"; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Base/Select",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    anchorTokenCompliance: storyAnchorCompliance({
      ignoreArgNames: ["children", "value", "defaultValue", "onValueChange", "size"],
    }),
  },
  args: { size: "default", ...audit.args },
  argTypes: {
    size: { control: "select", options: ["sm", "default", "lg"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <Select>
        <SelectTrigger
          size={args.size}
          className={audit.buildClassName(args as unknown as Record<string, string>)}
        >
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
          <SelectItem value="c">Option C</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const AlignWithButtons: Story = {
  render: () => (
    <div className="flex w-[min(100%,520px)] flex-col gap-6">
      {(["sm", "default", "lg"] as const).map((sz) => (
        <div key={sz} className="flex flex-nowrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">{sz}</span>
          <Button type="button" size={sz} className="shrink-0">
            Button
          </Button>
          <div className="w-[220px]">
            <Select>
              <SelectTrigger size={sz}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">A</SelectItem>
                <SelectItem value="b">B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  ),
};

const auiOptions = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

function AuiControlledSelect({ variant, size }: { variant: "outline" | "ghost" | "muted"; size: "sm" | "default" | "lg" }) {
  const [value, setValue] = useState("react");
  return (
    <AuiSelectRoot value={value} onValueChange={setValue}>
      <AuiSelectTrigger variant={variant} size={size}>
        {auiOptions.find((o) => o.value === value)?.label}
      </AuiSelectTrigger>
      <AuiSelectContent>
        {auiOptions.map((o) => (
          <AuiSelectItem key={o.value} value={o.value}>{o.label}</AuiSelectItem>
        ))}
      </AuiSelectContent>
    </AuiSelectRoot>
  );
}

export const AuiTriggerVariants: Story = {
  name: "AI · Trigger Variants",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["outline", "ghost", "muted"] as const).map((v) => (
        <AuiSelectRoot key={v} defaultValue="react">
          <AuiSelectTrigger variant={v}>{v}</AuiSelectTrigger>
          <AuiSelectContent>
            {auiOptions.map((o) => (
              <AuiSelectItem key={o.value} value={o.value}>{o.label}</AuiSelectItem>
            ))}
          </AuiSelectContent>
        </AuiSelectRoot>
      ))}
    </div>
  ),
};

export const AuiSizes: Story = {
  name: "AI · Sizes",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "default", "lg"] as const).map((s) => (
        <AuiControlledSelect key={s} variant="outline" size={s} />
      ))}
    </div>
  ),
};

export const AuiWithGroups: Story = {
  name: "AI · With Groups",
  render: () => (
    <AuiSelectRoot defaultValue="react">
      <AuiSelectTrigger variant="outline">
        Choose framework
      </AuiSelectTrigger>
      <AuiSelectContent>
        <AuiSelectGroup>
          <AuiSelectLabel>Frontend</AuiSelectLabel>
          <AuiSelectItem value="react">React</AuiSelectItem>
          <AuiSelectItem value="vue">Vue</AuiSelectItem>
          <AuiSelectItem value="svelte">Svelte</AuiSelectItem>
        </AuiSelectGroup>
        <AuiSelectSeparator />
        <AuiSelectGroup>
          <AuiSelectLabel>Backend</AuiSelectLabel>
          <AuiSelectItem value="express">Express</AuiSelectItem>
          <AuiSelectItem value="fastify">Fastify</AuiSelectItem>
        </AuiSelectGroup>
      </AuiSelectContent>
    </AuiSelectRoot>
  ),
};
