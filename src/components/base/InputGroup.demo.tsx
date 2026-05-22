import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input-group.tsx?raw";
import * as Comp from "./input-group";

const audit = autoClassControls(componentSrc, {
  // shadow / rounded / border / pX / pt / pb / pl / pr / py / mr / ml are
  // all inside scoped descendant selectors in input-group.tsx (e.g.
  // `has-[>[data-align=block-start]]:[&>input]:pb-3`). Overriding them
  // via the root className doesn't replace the scoped class — it just
  // adds an extra root-level rule that does nothing visible. Hide them
  // from the panel to avoid confusion.
  hidePrefixes: ["shadow", "rounded", "border", "p", "px", "py", "pt", "pb", "pl", "pr", "mr", "ml"],
});

type Args = { [k: string]: string };

const meta = {
  title: "Base/InputGroup",
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
