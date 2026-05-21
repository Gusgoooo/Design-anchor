import * as React from "react";
import { Moon, Palette, Plus, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../theme/DarkModeProvider";
import { navigateTo } from "../router";
import { useRegistry } from "../story-registry";
import { SidebarTree } from "./SidebarTree";

type Props = {
  currentStoryId: string | null;
  onAddComponent?: () => void;
};

export function Sidebar({ currentStoryId, onAddComponent }: Props) {
  const { dark, toggle } = useTheme();
  const registry = useRegistry();

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
            onClick={onAddComponent}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity",
              onAddComponent ? "hover:opacity-90" : "cursor-not-allowed opacity-60",
            )}
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
    </div>
  );
}
