import * as React from "react";
import { RotateCcw } from "lucide-react";
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
    session.args,
  );

  const hasControls = visible.length > 0;
  const groups = groupByCategory(visible);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-1.5 text-[11px]">
        <span className="text-muted-foreground">
          {hasControls ? `${visible.length} control${visible.length === 1 ? "" : "s"}` : "No controls"}
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
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-background text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="w-[42%] px-3 py-1.5 text-left font-semibold">Name</th>
                <th className="px-3 py-1.5 pr-4 text-right font-semibold">Control</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, gi) => (
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
                      value={session.args[row.argName]}
                      onChange={(v) => session.setArg(row.argName, v)}
                    />
                  ))}
                  {gi < groups.length - 1 ? null : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ArgRow({
  row,
  value,
  onChange,
}: {
  row: NormalizedArgType;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <tr className={cn("border-b border-border/60 align-top hover:bg-muted/20")}>
      <td className="px-3 py-2 align-top">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{row.displayName}</span>
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
