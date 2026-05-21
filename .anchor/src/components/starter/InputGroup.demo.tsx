import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input-group.tsx?raw";
import * as Comp from "./input-group";

const audit = autoClassControls(componentSrc, {
  hidePrefixes: ["shadow", "rounded", "border"],
});

type Args = { [k: string]: string };

const meta = {
  title: "Starter/InputGroup",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    h: "7"
  },

  render: (args) => {
    const prev = spreadAutoPreviewProps(audit, args as ClassOverrideArgs);
    return (
      <Comp.InputGroup className={prev.className}>
        <Comp.InputGroupAddon>
          <Comp.InputGroupText>https://</Comp.InputGroupText>
        </Comp.InputGroupAddon>
        <Comp.InputGroupInput placeholder="example.com" />
      </Comp.InputGroup>
    );
  }
};
