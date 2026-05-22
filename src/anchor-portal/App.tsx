import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { FileText, Sliders } from "lucide-react";
import { DarkModeProvider } from "./theme/DarkModeProvider";
import { useRoute } from "./router";
import { TopNav } from "./TopNav";
import { Sidebar } from "./sidebar/SidebarTop";
import { StorySessionProvider } from "./usePreviewState";
import { Canvas } from "./canvas/Canvas";
import { ControlsPanel } from "./controls/ControlsPanel";
import { SpecPanel } from "./spec-editor/SpecPanel";
import { DocsRoute } from "./docs/DocsRoute";
import { DesignTokenRoute } from "./docs/DesignTokenRoute";

export default function App() {
  return (
    <DarkModeProvider>
      <AppShell />
    </DarkModeProvider>
  );
}

const SEP_H = "w-px bg-border hover:bg-foreground/30 data-[dragging]:bg-foreground/40 transition-colors";
const SEP_V = "h-px bg-border hover:bg-foreground/30 data-[dragging]:bg-foreground/40 transition-colors";

function AppShell() {
  const route = useRoute();
  const currentStoryId = route.kind === "story" ? route.storyId : null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <main className="min-h-0 flex-1">
        {route.kind === "docs" ? (
          <DocsRoute />
        ) : route.kind === "designtoken" ? (
          <DesignTokenRoute />
        ) : (
          // components / story / patterns — show sidebar + canvas + bottom panel
          <StorySessionProvider storyId={currentStoryId}>
            <ComponentsArea currentStoryId={currentStoryId} hasStoryRoute={route.kind === "story"} />
          </StorySessionProvider>
        )}
      </main>
    </div>
  );
}

function ComponentsArea({
  currentStoryId,
  hasStoryRoute,
}: {
  currentStoryId: string | null;
  hasStoryRoute: boolean;
}) {
  return (
    <Group id="anchor-portal-h" orientation="horizontal" className="flex h-full w-full">
      <Panel id="sidebar" defaultSize="22%" minSize="16%" maxSize="40%" className="flex flex-col">
        <Sidebar currentStoryId={currentStoryId} />
      </Panel>
      <Separator className={SEP_H} />
      <Panel id="main" defaultSize="78%" minSize="40%" className="flex flex-col">
        {hasStoryRoute ? (
          <Group id="anchor-portal-v" orientation="vertical" className="flex h-full w-full flex-col">
            <Panel id="canvas" defaultSize="62%" minSize="20%" className="flex flex-col bg-background">
              <Canvas />
            </Panel>
            <Separator className={SEP_V} />
            <Panel id="panel" defaultSize="38%" minSize="12%" className="flex flex-col">
              <PanelTabs />
            </Panel>
          </Group>
        ) : (
          <div className="flex h-full w-full flex-col bg-background">
            <Canvas />
          </div>
        )}
      </Panel>
    </Group>
  );
}

type TabKey = "controls" | "spec";

function PanelTabs() {
  const [tab, setTab] = React.useState<TabKey>("controls");
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-2">
        <TabButton active={tab === "controls"} onClick={() => setTab("controls")} icon={<Sliders size={13} />} label="Controls" />
        <TabButton active={tab === "spec"} onClick={() => setTab("spec")} icon={<FileText size={13} />} label="Spec.json" />
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "controls" ? <ControlsPanel /> : <SpecPanel />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
