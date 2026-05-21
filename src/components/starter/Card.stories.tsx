import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./card.tsx?raw";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Starter/Card",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children"] }),
  },
  args: { ...audit.args },
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    /** Matches the 2nd–6th `className={cn(` in `card.tsx` (root Card uses `prev.className`) */
    const slot = prev.previewCnSlotOverrides ?? [];
    return (
      <div className="w-[360px]">
        <Card className={prev.className}>
          <CardHeader className={slot[0]}>
            <CardTitle className={slot[1]}>Card Title</CardTitle>
            <CardDescription className={slot[2]}>Card description text</CardDescription>
          </CardHeader>
          <CardContent className={slot[3]}>
            <p>This is the main content area of the card.</p>
          </CardContent>
          <CardFooter className={slot[4]}>
            <p>Footer info</p>
          </CardFooter>
        </Card>
      </div>
    );
  },
};
