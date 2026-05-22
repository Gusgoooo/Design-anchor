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

// Separator sits in the gap between the two rounded panels; gets thicker
// on hover and during drag so it's clearly grabbable.
const SEP_V_FLOATING =
  "my-1 h-2 rounded-full bg-transparent hover:bg-foreground/15 data-[dragging]:bg-foreground/25 transition-colors";

/** Shared with the Design Token customizer so both pages line up. */
const SIDEBAR_WIDTH_PX = 360;

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
  // Every story route shows the bottom Controls/Spec panel — AI demos
  // included. AI's position:fixed overlays stay contained to the Canvas
  // card (own rounded container with overflow-hidden + a translateZ(0)
  // containing block in canvas/Canvas.tsx).
  const showBottomPanel = hasStoryRoute;

  return (
    <div className="h-full w-full bg-muted/30 p-4 dark:bg-background/40">
      <div className="flex h-full gap-4">
        <div
          className="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-border"
          style={{ width: SIDEBAR_WIDTH_PX }}
        >
          <Sidebar currentStoryId={currentStoryId} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {showBottomPanel ? (
            <Group id="anchor-portal-v" orientation="vertical" className="flex h-full w-full flex-col">
              <Panel
                id="canvas"
                defaultSize="62%"
                minSize="20%"
                className="flex flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-border"
              >
                <Canvas />
              </Panel>
              <Separator className={SEP_V_FLOATING} />
              <Panel
                id="panel"
                defaultSize="38%"
                minSize="12%"
                className="flex flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-border"
              >
                <PanelTabs />
              </Panel>
            </Group>
          ) : (
            <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-border">
              <Canvas />
            </div>
          )}
        </div>
      </div>
    </div>
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
