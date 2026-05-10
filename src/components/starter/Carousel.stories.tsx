import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./carousel.tsx?raw";
import * as Comp from "./carousel";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Carousel",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    top: "xxxs"
  },

  render: (args) => {
    return (
      <div className="w-[400px]">
      <Comp.Carousel className={"w-full max-w-xs " + audit.buildClassName(args)}>
        <Comp.CarouselContent>
          {[1,2,3,4,5].map(i => (
            <Comp.CarouselItem key={i}>
              <div className="flex aspect-square items-center justify-center rounded-md border bg-muted p-6"><span className="text-3xl font-semibold">{i}</span></div>
            </Comp.CarouselItem>
          ))}
        </Comp.CarouselContent>
        <Comp.CarouselPrevious />
        <Comp.CarouselNext />
      </Comp.Carousel>
      </div>
    );
  }
};
