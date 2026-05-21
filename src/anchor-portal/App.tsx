import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  Component as ComponentIcon,
  FileText,
  Sliders,
  Moon,
  Sun,
} from "lucide-react";
import { DarkModeProvider, useTheme } from "./theme/DarkModeProvider";
import { useRoute } from "./router";
import { useRegistry } from "./story-registry";

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
  const registry = useRegistry();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Group id="anchor-portal-h" orientation="horizontal" className="flex h-full w-full">
        <Panel id="sidebar" defaultSize={20} minSize={14} maxSize={36} className="flex flex-col">
          <SidebarStub registryReady={!!registry} count={registry?.length ?? 0} />
        </Panel>
        <Separator className={SEP_H} />
        <Panel id="main" defaultSize={80} minSize={40} className="flex flex-col">
          <Group id="anchor-portal-v" orientation="vertical" className="flex h-full w-full flex-col">
            <Panel id="canvas" defaultSize={62} minSize={20} className="flex flex-col bg-background">
              <CanvasStub route={route} />
            </Panel>
            <Separator className={SEP_V} />
            <Panel id="panel" defaultSize={38} minSize={12} className="flex flex-col">
              <PanelTabs />
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
}

function SidebarStub({ registryReady, count }: { registryReady: boolean; count: number }) {
  const { dark, toggle } = useTheme();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ComponentIcon size={16} className="text-foreground" />
          Design-anchor
        </div>
        <button
          type="button"
          onClick={toggle}
          title={dark ? "Switch to light" : "Switch to dark"}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 text-xs text-muted-foreground space-y-2">
        <p>{registryReady ? `${count} components discovered` : "Scanning *.demo.tsx…"}</p>
        <p className="italic">Sidebar tree — TODO (Stage 2.C)</p>
      </div>
    </div>
  );
}

function CanvasStub({ route }: { route: ReturnType<typeof useRoute> }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <FileText size={14} />
        <span className="font-mono">route: {JSON.stringify(route)}</span>
      </div>
      <div className="flex-1 overflow-auto p-6 text-sm text-muted-foreground">
        Canvas — TODO (Stage 2.D)
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
      <div className="flex-1 overflow-auto p-4 text-xs text-muted-foreground">
        {tab === "controls" ? "Controls — TODO (Stage 2.E)" : "Spec.json — TODO (Stage 2.F)"}
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
