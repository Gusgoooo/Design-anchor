import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import { cn } from "@/lib/utils";
import componentSrc from "./table.tsx?raw";
import * as Comp from "./table";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Table",
  parameters: {
    accordTokenCompliance: storyAccordCompliance({}),
  },
  args: { ...audit.args },
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    const slot = prev.previewCnSlotOverrides ?? [];
    // table.tsx cn() order: Table(#0), TableHeader(#1), TableBody(#2), TableFooter(#3), TableRow(#4), TableHead(#5), TableCell(#6), TableCaption(#7)
    return (
      <Comp.Table className={prev.className}>
        <Comp.TableHeader className={slot[0]}>
          <Comp.TableRow className={slot[3]}>
            <Comp.TableHead className={slot[4]}>Name</Comp.TableHead>
            <Comp.TableHead className={slot[4]}>Status</Comp.TableHead>
            <Comp.TableHead className={cn(slot[4], "text-right")}>Amount</Comp.TableHead>
          </Comp.TableRow>
        </Comp.TableHeader>
        <Comp.TableBody className={slot[1]}>
          <Comp.TableRow className={slot[3]}>
            <Comp.TableCell className={cn(slot[5], "font-medium")}>Order 001</Comp.TableCell>
            <Comp.TableCell className={slot[5]}>Completed</Comp.TableCell>
            <Comp.TableCell className={cn(slot[5], "text-right")}>¥250.00</Comp.TableCell>
          </Comp.TableRow>
          <Comp.TableRow className={slot[3]}>
            <Comp.TableCell className={cn(slot[5], "font-medium")}>Order 002</Comp.TableCell>
            <Comp.TableCell className={slot[5]}>Processing</Comp.TableCell>
            <Comp.TableCell className={cn(slot[5], "text-right")}>¥150.00</Comp.TableCell>
          </Comp.TableRow>
        </Comp.TableBody>
      </Comp.Table>
    );
  },
};
