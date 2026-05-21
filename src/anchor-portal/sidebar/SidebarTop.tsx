import * as React from "react";
import { Moon, Palette, Plus, Sun } from "lucide-react";
import { useTheme } from "../theme/DarkModeProvider";
import { navigateTo } from "../router";
import { useRegistry } from "../story-registry";
import { SidebarTree } from "./SidebarTree";
import { AddComponentDialog } from "./AddComponentDialog";
import { ComponentContextMenu } from "./ContextMenu";

type Props = {
  currentStoryId: string | null;
};

export function Sidebar({ currentStoryId }: Props) {
  const { dark, toggle } = useTheme();
  const registry = useRegistry();
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-border px-3 pb-3 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <a
            href="#/"
            className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-foreground no-underline hover:opacity-80"
          >
            Design-anchor
          </a>
          <button
            type="button"
            onClick={toggle}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus size={13} /> Add Component
          </button>
          <button
            type="button"
            onClick={() => navigateTo({ kind: "designtoken" })}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Palette size={13} /> DesignToken
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {registry == null ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Scanning <code className="font-mono">*.demo.tsx</code>…
          </div>
        ) : (
          <SidebarTree entries={registry} currentStoryId={currentStoryId} />
        )}
      </div>

      <AddComponentDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ComponentContextMenu />
    </div>
  );
}
