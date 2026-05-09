import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./card.tsx?raw";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Card",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children"] }),
  },
  args: { ...audit.args },
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
      <div className="w-[360px]">
        <Card className={audit.buildClassName(args as unknown as Record<string, string>)}>
          <CardHeader>
            <CardTitle>卡片标题</CardTitle>
            <CardDescription>卡片描述文本</CardDescription>
          </CardHeader>
          <CardContent>
            <p>这是卡片的主要内容区域。</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">页脚信息</p>
          </CardFooter>
        </Card>
      </div>
    ),
};
