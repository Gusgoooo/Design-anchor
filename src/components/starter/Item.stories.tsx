import type { Meta, StoryObj } from "@storybook/react";
import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./item.tsx?raw";
import * as Comp from "./item";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Starter/Item",
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
      <div className="w-full max-w-md">
        <Comp.ItemGroup className={prev.className}>
          <Comp.Item variant="outline" className={slot[1]}>
            <Comp.ItemMedia variant="icon" className={slot[2]}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
            </Comp.ItemMedia>
            <Comp.ItemContent className={slot[3]}>
              <Comp.ItemTitle className={slot[4]}>Design System</Comp.ItemTitle>
              <Comp.ItemDescription className={slot[5]}>Manage component tokens and style specs</Comp.ItemDescription>
            </Comp.ItemContent>
            <Comp.ItemActions className={slot[6]}>
              <span className="text-xs text-muted-foreground">3 min ago</span>
            </Comp.ItemActions>
          </Comp.Item>
          <Comp.ItemSeparator />
          <Comp.Item variant="outline" className={slot[1]}>
            <Comp.ItemMedia variant="icon" className={slot[2]}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/></svg>
            </Comp.ItemMedia>
            <Comp.ItemContent className={slot[3]}>
              <Comp.ItemTitle className={slot[4]}>Component Preview</Comp.ItemTitle>
              <Comp.ItemDescription className={slot[5]}>View component style changes live in Storybook</Comp.ItemDescription>
            </Comp.ItemContent>
            <Comp.ItemActions className={slot[6]}>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </Comp.ItemActions>
          </Comp.Item>
          <Comp.ItemSeparator />
          <Comp.Item variant="outline" className={slot[1]}>
            <Comp.ItemMedia variant="icon" className={slot[2]}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
            </Comp.ItemMedia>
            <Comp.ItemContent className={slot[3]}>
              <Comp.ItemTitle className={slot[4]}>Token Mapping</Comp.ItemTitle>
              <Comp.ItemDescription className={slot[5]}>Bind design tokens to Tailwind classes</Comp.ItemDescription>
            </Comp.ItemContent>
            <Comp.ItemActions className={slot[6]}>
              <span className="text-xs text-muted-foreground">Yesterday</span>
            </Comp.ItemActions>
          </Comp.Item>
        </Comp.ItemGroup>
      </div>
    );
  },
};
