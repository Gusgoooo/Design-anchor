import * as React from "react";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorySession } from "../usePreviewState";
import {
  buildVisibleArgTypes,
  groupByCategory,
  type NormalizedArgType,
} from "./normalize";
import { ControlInput } from "./controls/ControlInput";

export function ControlsPanel() {
  const { session } = useStorySession();

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
        Select a story from the sidebar to see its controls.
      </div>
    );
  }

  const visible = buildVisibleArgTypes(
    session.meta.argTypes,
    session.storyObj.argTypes,
    session.draftArgs,
  );

  const hasControls = visible.length > 0;
  const groups = groupByCategory(visible);
  const { isDirty, dirtyKeys } = session;

  // Apply / Discard via keyboard while the panel is focused.
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !isDirty) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const editing = target && (target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        session!.applyDraft();
      } else if (e.key === "Escape" && !editing) {
        e.preventDefault();
        session!.discardDraft();
      }
    }
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [isDirty, session]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col"
      tabIndex={-1}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-1.5 text-[11px]">
        <span className="text-muted-foreground">
          {hasControls ? `${visible.length} control${visible.length === 1 ? "" : "s"}` : "No controls"}
          {isDirty ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded-sm bg-primary/15 px-1.5 py-px font-medium text-[10px] text-primary">
              {dirtyKeys.size} pending
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={session.resetArgs}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Reset all args to defaults"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </header>

      {!hasControls ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8 text-center text-xs text-muted-foreground">
          This story has no editable args.
        </div>
      ) : (
        <div className={cn("flex-1 overflow-y-auto", isDirty && "pb-14")}>
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-background text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="w-[42%] px-3 py-1.5 text-left font-semibold">Name</th>
                <th className="px-3 py-1.5 pr-4 text-right font-semibold">Control</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <React.Fragment key={g.category ?? "_default"}>
                  {g.category ? (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={2} className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {g.category}
                      </td>
                    </tr>
                  ) : null}
                  {g.rows.map((row) => (
                    <ArgRow
                      key={`${g.category ?? "_"}::${row.argName}`}
                      row={row}
                      value={session.draftArgs[row.argName]}
                      dirty={dirtyKeys.has(row.argName)}
                      onChange={(v) => session.setDraftArg(row.argName, v)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasControls ? (
        <DraftFooter
          isDirty={isDirty}
          count={dirtyKeys.size}
          onApply={session.applyDraft}
          onDiscard={session.discardDraft}
        />
      ) : null}
    </div>
  );
}

function DraftFooter({
  isDirty,
  count,
  onApply,
  onDiscard,
}: {
  isDirty: boolean;
  count: number;
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Pending changes"
      aria-hidden={!isDirty}
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 py-2 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.12)] backdrop-blur transition-all duration-200 ease-out",
        isDirty
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "translate-y-full opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          <span>
            <span className="font-medium text-foreground">{count}</span>{" "}
            pending change{count === 1 ? "" : "s"} — preview is showing the previous values
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Discard pending changes (Esc)"
          >
            <Undo2 size={12} /> Discard
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            title="Apply changes to preview (⌘/Ctrl+Enter)"
          >
            <Check size={12} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function ArgRow({
  row,
  value,
  dirty,
  onChange,
}: {
  row: NormalizedArgType;
  value: unknown;
  dirty: boolean;
  onChange: (v: unknown) => void;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border/60 align-top transition-colors hover:bg-muted/20",
        dirty && "bg-primary/5",
      )}
    >
      <td className="px-3 py-2 align-top">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            {row.displayName}
            {dirty ? (
              <span
                aria-label="pending"
                className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              />
            ) : null}
          </span>
          {row.typeSummary ? (
            <span className="font-mono text-[10px] text-muted-foreground/80">{row.typeSummary}</span>
          ) : null}
          {row.description ? (
            <span className="text-[11px] leading-snug text-muted-foreground">{row.description}</span>
          ) : null}
          {row.defaultValueSummary ? (
            <span className="text-[10px] text-muted-foreground/70">
              Default: <code className="font-mono">{row.defaultValueSummary}</code>
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2 pr-4 align-top">
        <div className="ml-auto max-w-[280px]">
          <ControlInput control={row.control} value={value} onChange={onChange} argName={row.argName} />
        </div>
      </td>
    </tr>
  );
}
