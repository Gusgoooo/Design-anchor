import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./empty.tsx?raw";
import * as Comp from "./empty";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Empty",
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
      <Comp.Empty className={prev.className}>
        <Comp.EmptyMedia className={slot[1]} />
        <Comp.EmptyHeader className={slot[0]}>
          <Comp.EmptyTitle className={slot[2]}>No Data</Comp.EmptyTitle>
          <Comp.EmptyDescription className={slot[3]}>There is no content here yet.</Comp.EmptyDescription>
        </Comp.EmptyHeader>
      </Comp.Empty>
    );
  },
};
