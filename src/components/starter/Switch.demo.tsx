import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import * as React from "react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./switch.tsx?raw";
import { Switch } from "./switch";
import { Label } from "./label";

/** Switch track/thumb dimensions, pill radius, and thumb shadow are locked by implementation; not mapped in Controls for spacing / radius / shadow */
const audit = autoClassControls(componentSrc, {
  hidePrefixes: ["w", "h", "rounded", "shadow"],
});

type SwitchArgs = {
  checked: boolean;
  disabled: boolean;
};

const meta = {
  title: "Starter/Switch",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children", "id"] }),
  },
  args: {
    checked: false,
    disabled: false,
    ...audit.args,
  },
  argTypes: {
    checked: {
      control: "boolean",
      description: "Controlled demo: whether on",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta<SwitchArgs & Record<string, unknown>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const { checked, disabled, ...rest } = args as SwitchArgs & Record<string, unknown>;
    const [on, setOn] = React.useState(checked);
    React.useEffect(() => {
      setOn(checked);
    }, [checked]);
    return (
      <div className="flex items-center gap-2">
        <Switch
          id="airplane"
          checked={on}
          onCheckedChange={setOn}
          disabled={disabled}
          className={spreadAutoPreviewProps(audit, rest as ClassOverrideArgs).className}
        />
        <Label htmlFor="airplane">Airplane Mode</Label>
      </div>
    );
  },
};
