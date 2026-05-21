import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./pagination.tsx?raw";
import * as Comp from "./pagination";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const noop = (e: React.MouseEvent) => e.preventDefault();

const meta = {
  title: "Starter/Pagination",
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
      <Comp.Pagination className={prev.className}>
        <Comp.PaginationContent className={slot[0]}>
          <Comp.PaginationItem className={slot[1]}><Comp.PaginationPrevious href="#" onClick={noop} className={slot[3]} /></Comp.PaginationItem>
          <Comp.PaginationItem className={slot[1]}><Comp.PaginationLink href="#" onClick={noop} className={slot[2]}>1</Comp.PaginationLink></Comp.PaginationItem>
          <Comp.PaginationItem className={slot[1]}><Comp.PaginationLink href="#" onClick={noop} isActive className={slot[2]}>2</Comp.PaginationLink></Comp.PaginationItem>
          <Comp.PaginationItem className={slot[1]}><Comp.PaginationLink href="#" onClick={noop} className={slot[2]}>3</Comp.PaginationLink></Comp.PaginationItem>
          <Comp.PaginationItem className={slot[1]}><Comp.PaginationEllipsis className={slot[5]} /></Comp.PaginationItem>
          <Comp.PaginationItem className={slot[1]}><Comp.PaginationNext href="#" onClick={noop} className={slot[4]} /></Comp.PaginationItem>
        </Comp.PaginationContent>
      </Comp.Pagination>
    );
  },
};
