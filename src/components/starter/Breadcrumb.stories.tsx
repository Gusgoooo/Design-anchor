import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./breadcrumb.tsx?raw";
import * as Comp from "./breadcrumb";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const noop = (e: React.MouseEvent) => e.preventDefault();

const meta = {
  title: "Starter/Breadcrumb",
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
      <Comp.Breadcrumb>
        <Comp.BreadcrumbList className={prev.className}>
          <Comp.BreadcrumbItem className={slot[0]}><Comp.BreadcrumbLink href="#" onClick={noop} className={slot[1]}>Home</Comp.BreadcrumbLink></Comp.BreadcrumbItem>
          <Comp.BreadcrumbSeparator className={slot[3]} />
          <Comp.BreadcrumbItem className={slot[0]}><Comp.BreadcrumbLink href="#" onClick={noop} className={slot[1]}>Components</Comp.BreadcrumbLink></Comp.BreadcrumbItem>
          <Comp.BreadcrumbSeparator className={slot[3]} />
          <Comp.BreadcrumbItem className={slot[0]}><Comp.BreadcrumbPage className={slot[2]}>Breadcrumb</Comp.BreadcrumbPage></Comp.BreadcrumbItem>
        </Comp.BreadcrumbList>
      </Comp.Breadcrumb>
    );
  },
};
