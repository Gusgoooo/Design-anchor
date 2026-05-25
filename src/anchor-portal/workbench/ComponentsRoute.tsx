import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { FileText, Sliders } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider";
import { StorySessionProvider } from "../usePreviewState";
import { Sidebar } from "../sidebar/SidebarTop";
import { Canvas } from "../canvas/Canvas";
import { ControlsPanel } from "../controls/ControlsPanel";
import { SpecPanel } from "../spec-editor/SpecPanel";

const SEP_V = "h-px bg-border hover:bg-foreground/30 data-[dragging]:bg-foreground/40 transition-colors";
const SIDEBAR_WIDTH_PX = 360;

type ComponentsRouteProps = {
  currentStoryId: string | null;
  hasStoryRoute: boolean;
};

export function ComponentsRoute({ currentStoryId, hasStoryRoute }: ComponentsRouteProps) {
  return (
    <StorySessionProvider storyId={currentStoryId}>
      <ComponentsArea currentStoryId={currentStoryId} hasStoryRoute={hasStoryRoute} />
    </StorySessionProvider>
  );
}

function ComponentsArea({
  currentStoryId,
  hasStoryRoute,
}: ComponentsRouteProps) {
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
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-background ring-1 ring-border">
          {showBottomPanel ? (
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
        </div>
      </div>
    </div>
  );
}

type TabKey = "controls" | "spec";

function PanelTabs() {
  const [tab, setTab] = React.useState<TabKey>("controls");
  const { t } = useLocale();
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-2">
        <TabButton
          active={tab === "controls"}
          onClick={() => setTab("controls")}
          icon={<Sliders size={13} />}
          label={t({ en: "Controls", zh: "参数" })}
        />
        <TabButton
          active={tab === "spec"}
          onClick={() => setTab("spec")}
          icon={<FileText size={13} />}
          label="Spec.json"
        />
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
