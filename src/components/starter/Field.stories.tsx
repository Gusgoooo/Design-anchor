import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./field.tsx?raw";
import * as Comp from "./field";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Field",
  parameters: {
    accordTokenCompliance: storyAccordCompliance({}),
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
      <Comp.Field className={slot[2]}>
        <Comp.FieldLabel className={slot[4]}>Email</Comp.FieldLabel>
        <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="your@email.com" />
        <Comp.FieldDescription className={slot[6]}>Please enter a valid email address.</Comp.FieldDescription>
      </Comp.Field>
    );
  },
};
