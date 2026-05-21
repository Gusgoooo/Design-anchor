import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input-otp.tsx?raw";
import * as Comp from "./input-otp";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/InputOtp",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <Comp.InputOTP maxLength={6} className={prev.className}>
        <Comp.InputOTPGroup className={slot[1]}>
          <Comp.InputOTPSlot index={0} className={slot[2]} />
          <Comp.InputOTPSlot index={1} className={slot[2]} />
          <Comp.InputOTPSlot index={2} className={slot[2]} />
        </Comp.InputOTPGroup>
        <Comp.InputOTPSeparator />
        <Comp.InputOTPGroup className={slot[1]}>
          <Comp.InputOTPSlot index={3} className={slot[2]} />
          <Comp.InputOTPSlot index={4} className={slot[2]} />
          <Comp.InputOTPSlot index={5} className={slot[2]} />
        </Comp.InputOTPGroup>
      </Comp.InputOTP>
    );
  },
};
