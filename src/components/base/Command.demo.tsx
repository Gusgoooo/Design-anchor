import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./command.tsx?raw";
import * as Comp from "./command";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Base/Command",
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
      <Comp.Command className={"w-[350px] rounded-lg border shadow-md " + (prev.className ?? "")}>
        <Comp.CommandInput placeholder="Type to search..." className={slot[0]} />
        <Comp.CommandList className={slot[1]}>
          <Comp.CommandEmpty>No results found</Comp.CommandEmpty>
          <Comp.CommandGroup heading="Suggestions" className={slot[2]}>
            <Comp.CommandItem className={slot[4]}>Calendar</Comp.CommandItem>
            <Comp.CommandItem className={slot[4]}>Search</Comp.CommandItem>
            <Comp.CommandItem className={slot[4]}>Settings</Comp.CommandItem>
          </Comp.CommandGroup>
        </Comp.CommandList>
      </Comp.Command>
    );
  },
};
