import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./tabs.tsx?raw";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "Tabs",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "defaultValue", "value", "onValueChange"] }),
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
      <div className="w-[400px]">
        <Tabs defaultValue="account" className={audit.buildClassName(args as unknown as Record<string, string>)}>
          <TabsList>
            <TabsTrigger value="account">账户</TabsTrigger>
            <TabsTrigger value="password">密码</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <p className="text-sm text-muted-foreground">在这里管理您的账户设置。</p>
          </TabsContent>
          <TabsContent value="password">
            <p className="text-sm text-muted-foreground">在这里修改您的密码。</p>
          </TabsContent>
        </Tabs>
      </div>
    ),
};
