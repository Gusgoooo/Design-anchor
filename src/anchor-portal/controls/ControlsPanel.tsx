import * as React from "react";
import { Check, Info, RotateCcw, Sliders, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";
import { useStorySession } from "../usePreviewState";
import {
  buildVisibleArgTypes,
  groupByCategory,
  type NormalizedArgType,
} from "./normalize";
import { ControlInput } from "./ControlInput";

export function ControlsPanel() {
  const { t } = useLocale();
  const { session } = useStorySession();

  if (!session) {
    return (
      <EmptyState
        icon={<Sliders size={16} />}
        title={t({ en: "No story selected", zh: "未选中组件" })}
        hint={t({ en: "Pick a component from the sidebar to see its controls.", zh: "从侧边栏选一个组件看它的参数。" })}
      />
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
    <div ref={containerRef} className="relative flex h-full flex-col" tabIndex={-1}>
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Sliders size={11} />
          <span className="font-medium text-foreground/85">
            {hasControls
              ? t({
                  en: `${visible.length} control${visible.length === 1 ? "" : "s"}`,
                  zh: `${visible.length} 项参数`,
                })
              : t({ en: "No controls", zh: "无参数" })}
          </span>
          {isDirty ? (
            <span className="ml-1 inline-flex h-4 items-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold tabular-nums text-primary">
              {t({ en: `${dirtyKeys.size} pending`, zh: `${dirtyKeys.size} 项待应用` })}
            </span>
          ) : null}
        </div>
        {hasControls ? (
          <button
            type="button"
            onClick={session.resetArgs}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={t({ en: "Reset all args to defaults", zh: "全部重置为默认值" })}
          >
            <RotateCcw size={11} /> {t({ en: "Reset", zh: "重置" })}
          </button>
        ) : null}
      </header>

      {!hasControls ? (
        <EmptyState
          icon={<Sliders size={16} />}
          title={t({ en: "No editable args", zh: "无可调参数" })}
          hint={t({ en: "This story doesn't expose any controls.", zh: "该 story 没有暴露任何参数。" })}
        />
      ) : (
        <div className={cn("flex-1 overflow-y-auto px-3 pb-3", isDirty && "pb-16")}>
          <div className="space-y-3">
            {groups.map((g) => (
              <section key={g.category ?? "_default"}>
                {g.category ? (
                  <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {g.category}
                  </h3>
                ) : null}
                <div className="overflow-hidden rounded-[10px] ring-1 ring-border bg-card">
                  {g.rows.map((row, idx) => (
                    <ArgRow
                      key={`${g.category ?? "_"}::${row.argName}`}
                      row={row}
                      value={session.draftArgs[row.argName]}
                      dirty={dirtyKeys.has(row.argName)}
                      isFirst={idx === 0}
                      isLast={idx === g.rows.length - 1}
                      onChange={(v) => session.setDraftArg(row.argName, v)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
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

function ArgRow({
  row,
  value,
  dirty,
  isFirst,
  isLast,
  onChange,
}: {
  row: NormalizedArgType;
  value: unknown;
  dirty: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (v: unknown) => void;
}) {
  const hasMeta = !!row.description || !!row.typeSummary || !!row.defaultValueSummary;
  const [showMeta, setShowMeta] = React.useState(false);

  return (
    <div
      className={cn(
        !isFirst && "border-t border-border/60",
        dirty && "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3 px-3 py-2">
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-mono text-[11.5px] font-medium text-foreground">
              {row.displayName}
            </span>
            {dirty ? (
              <span
                aria-label="pending"
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
            ) : null}
            {hasMeta ? (
              <button
                type="button"
                onClick={() => setShowMeta((v) => !v)}
                className={cn(
                  "ml-auto inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
                  showMeta && "bg-muted text-foreground",
                )}
                aria-label="Toggle field details"
                title="Toggle field details"
              >
                <Info size={10} />
              </button>
            ) : null}
          </div>
          {showMeta && hasMeta ? (
            <div className="mt-1.5 space-y-0.5 text-[10.5px] leading-snug text-muted-foreground">
              {row.typeSummary ? (
                <div className="font-mono text-muted-foreground/80">{row.typeSummary}</div>
              ) : null}
              {row.description ? <div>{row.description}</div> : null}
              {row.defaultValueSummary ? (
                <div>
                  Default: <code className="rounded bg-muted px-1 py-px font-mono">{row.defaultValueSummary}</code>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className={cn(
          "flex shrink-0",
          isLast && hasMeta && showMeta && "pb-1",
        )}>
          <div className="w-[180px] sm:w-[200px] md:w-[220px]">
            <ControlInput control={row.control} value={value} onChange={onChange} argName={row.argName} />
          </div>
        </div>
      </div>
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
  const { t } = useLocale();
  return (
    <div
      role="region"
      aria-label={t({ en: "Pending changes", zh: "待应用的改动" })}
      aria-hidden={!isDirty}
      className={cn(
        "pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-[10px] border border-border bg-background/95 px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] ring-1 ring-border/40 backdrop-blur transition-all duration-200 ease-out",
        isDirty
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "translate-y-3 opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="truncate">
            <span className="font-medium text-foreground">{count}</span>{" "}
            {t({ en: "pending · preview shows previous values", zh: "项待应用 · 预览还是旧值" })}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={t({ en: "Discard pending changes (Esc)", zh: "撤销待应用改动 (Esc)" })}
          >
            <Undo2 size={11} /> {t({ en: "Discard", zh: "撤销" })}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            title={t({ en: "Apply changes to preview (⌘/Ctrl+Enter)", zh: "应用到预览 (⌘/Ctrl+Enter)" })}
          >
            <Check size={11} /> {t({ en: "Apply", zh: "应用" })}
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[9px] font-semibold tabular-nums">
              {count}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="max-w-[240px] text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}
