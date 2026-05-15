import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./alert.tsx?raw";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Starter/Alert",
  parameters: {
    accordTokenCompliance: storyAccordCompliance({ ignoreArgNames: ["variant", "children"] }),
  },
  args: { variant: "default", ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <div className="w-[400px]">
        <Alert variant={args.variant as "default" | "destructive"} className={prev.className}>
          <AlertTitle className={slot[0]}>Notice</AlertTitle>
          <AlertDescription className={slot[1]}>This is a default alert message.</AlertDescription>
        </Alert>
      </div>
    );
  },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <div className="w-[400px]">
        <Alert variant={args.variant as "default" | "destructive"} className={prev.className}>
          <AlertTitle className={slot[0]}>Error</AlertTitle>
          <AlertDescription className={slot[1]}>Operation failed. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  },
};
