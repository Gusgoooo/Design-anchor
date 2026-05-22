import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DerivedFilter,
  type SeedGroup,
  matchesDerivedFilter,
} from "@/design-tokens/seed-card-config";
import { DerivedRow } from "./SeedCard";

export function DerivedMapTokens({
  group,
  resolvedVars,
  overriddenKeys,
  onSetOverride,
  onClearOverride,
}: {
  group: SeedGroup;
  resolvedVars: Record<string, string>;
  /** keys (in mapOverrides[currentBranch]) that the user has explicitly set. */
  overriddenKeys: Set<string>;
  onSetOverride: (id: string, value: string) => void;
  onClearOverride: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const matchedIds = React.useMemo(() => {
    const ids = Object.keys(resolvedVars).filter((id) =>
      matchesDerivedFilter(id, group.derived as DerivedFilter),
    );
    ids.sort();
    return ids;
  }, [resolvedVars, group.derived]);

  if (matchedIds.length === 0) return null;

  const overriddenInGroup = matchedIds.filter((id) => overriddenKeys.has(id)).length;

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/30"
      >
        <ChevronRight
          size={11}
          className={cn("transition-transform duration-150", open && "rotate-90")}
        />
        <span className="uppercase tracking-wider">Derived</span>
        <span className="ml-auto inline-flex items-center gap-1.5 tabular-nums">
          {overriddenInGroup > 0 ? (
            <span className="rounded-sm bg-primary/15 px-1.5 py-px text-[10px] font-medium text-primary">
              {overriddenInGroup}
            </span>
          ) : null}
          <span>{matchedIds.length}</span>
        </span>
      </button>

      {open ? (
        <div>
          {group.derivedSubGroups ? (
            group.derivedSubGroups.map((sg) => {
              const ids = matchedIds.filter((id) => sg.match(id));
              if (ids.length === 0) return null;
              return (
                <SubGroup
                  key={sg.title}
                  title={sg.title}
                  ids={ids}
                  resolvedVars={resolvedVars}
                  overriddenKeys={overriddenKeys}
                  onSetOverride={onSetOverride}
                  onClearOverride={onClearOverride}
                />
              );
            })
          ) : (
            matchedIds.map((id) => (
              <DerivedRow
                key={id}
                id={id}
                value={resolvedVars[id] ?? ""}
                isOverridden={overriddenKeys.has(id)}
                onChange={(v) => onSetOverride(id, v)}
                onReset={() => onClearOverride(id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function SubGroup({
  title,
  ids,
  resolvedVars,
  overriddenKeys,
  onSetOverride,
  onClearOverride,
}: {
  title: string;
  ids: string[];
  resolvedVars: Record<string, string>;
  overriddenKeys: Set<string>;
  onSetOverride: (id: string, value: string) => void;
  onClearOverride: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="border-t border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 transition-colors hover:bg-muted/20"
      >
        <ChevronRight
          size={10}
          className={cn("transition-transform duration-150", open && "rotate-90")}
        />
        {title}
        <span className="ml-auto tabular-nums">{ids.length}</span>
      </button>
      {open
        ? ids.map((id) => (
            <DerivedRow
              key={id}
              id={id}
              value={resolvedVars[id] ?? ""}
              isOverridden={overriddenKeys.has(id)}
              onChange={(v) => onSetOverride(id, v)}
              onReset={() => onClearOverride(id)}
            />
          ))
        : null}
    </div>
  );
}
