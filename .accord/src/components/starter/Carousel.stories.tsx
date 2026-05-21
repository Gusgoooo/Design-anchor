import type { Meta, StoryObj } from "@storybook/react";
import { storyAccordCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./carousel.tsx?raw";
import * as Comp from "./carousel";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Carousel",
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
      <div className="w-[400px]">
      <Comp.Carousel className={"w-full max-w-xs " + (prev.className ?? "")}>
        <Comp.CarouselContent className={slot[0]}>
          {[1,2,3,4,5].map(i => (
            <Comp.CarouselItem key={i} className={slot[1]}>
              <div className="flex aspect-square items-center justify-center rounded-md border bg-muted p-6"><span className="text-3xl font-semibold">{i}</span></div>
            </Comp.CarouselItem>
          ))}
        </Comp.CarouselContent>
        <Comp.CarouselPrevious className={slot[2]} />
        <Comp.CarouselNext className={slot[3]} />
      </Comp.Carousel>
      </div>
    );
  },
};
