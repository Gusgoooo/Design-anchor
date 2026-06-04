import * as React from "react";
import { Plus, Search, X } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider";
import { useRegistry } from "../story-registry";
import { SidebarTree } from "./SidebarTree";
import { AddComponentDialog } from "./AddComponentDialog";
import { ComponentContextMenu } from "./ContextMenu";

type Props = {
  currentStoryId: string | null;
};

export function Sidebar({ currentStoryId }: Props) {
  const { t } = useLocale();
  const registry = useRegistry();
  const [addOpen, setAddOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
        >
          <Plus size={13} /> {t({ en: "Add Component", zh: "添加组件" })}
        </button>

        <div className="relative">
          <Search
            size={12}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ en: "Search components", zh: "搜索组件" })}
            className="h-7 w-full rounded-md border border-border bg-background pl-7 pr-7 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              title={t({ en: "Clear search", zh: "清空搜索" })}
            >
              <X size={10} />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {registry == null ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            {t({ en: "Scanning", zh: "扫描" })} <code className="font-mono">*.demo.tsx</code>…
          </div>
        ) : (
          <SidebarTree entries={registry} currentStoryId={currentStoryId} searchQuery={query} />
        )}
      </div>

      <AddComponentDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ComponentContextMenu />
    </div>
  );
}
