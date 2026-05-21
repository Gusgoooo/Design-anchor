import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./progress.tsx?raw";
import { Progress } from "./progress";

const audit = autoClassControls(componentSrc, {
  hidePrefixes: ["duration"],
});

type Args = { value: number; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Starter/Progress",
  parameters: {
    anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["value", "children"] }),
  },
  args: { value: 60, ...audit.args },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    h: "2"
  },

  render: (args) => (
    <div className="w-[360px]">
      <Progress value={args.value} className={spreadAutoPreviewProps(audit, args as ClassOverrideArgs).className} />
    </div>
  )
};
