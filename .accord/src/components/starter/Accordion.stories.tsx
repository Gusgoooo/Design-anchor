import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./accordion.tsx?raw";
import * as Comp from "./accordion";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Accordion",
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
      <Comp.Accordion type="single" collapsible>
        <Comp.AccordionItem value="item-1" className={prev.className}>
          <Comp.AccordionTrigger className={slot[0]}>Item One</Comp.AccordionTrigger>
          <Comp.AccordionContent className={slot[1]}>This is the content of item one.</Comp.AccordionContent>
        </Comp.AccordionItem>
        <Comp.AccordionItem value="item-2" className={prev.className}>
          <Comp.AccordionTrigger className={slot[0]}>Item Two</Comp.AccordionTrigger>
          <Comp.AccordionContent className={slot[1]}>This is the content of item two.</Comp.AccordionContent>
        </Comp.AccordionItem>
        <Comp.AccordionItem value="item-3" className={prev.className}>
          <Comp.AccordionTrigger className={slot[0]}>Item Three</Comp.AccordionTrigger>
          <Comp.AccordionContent className={slot[1]}>This is the content of item three.</Comp.AccordionContent>
        </Comp.AccordionItem>
      </Comp.Accordion>
    );
  },
};
