import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SeedDef,
  type EditorKind,
} from "@/design-tokens/seed-card-config";
import { TokenValueEditor, SliderEditor } from "@/design-tokens/token-editors";
import { detectTokenValueKind } from "@/design-tokens/token-value-type";

function isColorValue(value: string) {
  return /^(#|rgb|rgba|hsl|hsla|oklch|oklab)/.test(value.trim());
}

function chooseEditorKind(declared: EditorKind, value: string) {
  if (declared !== "generic") return declared;
  return detectTokenValueKind(value);
}

/** Compact seed row inside a group card. */
export function SeedRow({
  seed,
  value,
  isDirty,
  isFirst,
  isLast,
  onChange,
}: {
  seed: SeedDef;
  value: string;
  isDirty: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const color = isColorValue(value);
  const editorKind = chooseEditorKind(seed.editor, value);

  return (
    <div className={cn(!isFirst && "border-t border-border/60")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors",
          isFirst && "rounded-t-lg",
          isLast && !open && "rounded-b-lg",
          open ? "bg-muted/40" : "hover:bg-muted/30",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "h-5 w-5 shrink-0 rounded-md border border-border/80 shadow-inner",
            !color && "bg-muted",
          )}
          style={color ? { background: value } : undefined}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">{seed.label}</span>
            {isDirty ? (
              <span aria-label="modified" className="inline-block h-1 w-1 shrink-0 rounded-full bg-primary" />
            ) : null}
          </span>
        </span>
        <span
          className="shrink-0 truncate font-mono text-sm tabular-nums text-muted-foreground"
          style={{ maxWidth: 140 }}
          title={value}
        >
          {value || "—"}
        </span>
        <ChevronDown
          size={12}
          className={cn(
            "shrink-0 text-muted-foreground/60 transition-transform duration-150",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>
      {open ? (
        <div
          className={cn(
            "border-t border-border/60 bg-background px-3 py-3",
            isLast && "rounded-b-lg",
          )}
        >
          {seed.slider ? (
            <SliderEditor value={value} onChange={onChange} config={seed.slider} />
          ) : (
            <TokenValueEditor kind={editorKind} value={value} onChange={onChange} compact />
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Derived (gradient) token row. Lighter visual weight than SeedRow. */
export function DerivedRow({
  id,
  value,
  isOverridden,
  onChange,
  onReset,
}: {
  id: string;
  value: string;
  isOverridden: boolean;
  onChange: (next: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const color = isColorValue(value);
  const editorKind = chooseEditorKind("generic", value);

  return (
    <div className="border-t border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted/30"
      >
        {color ? (
          <span
            className="h-3 w-3 shrink-0 rounded-sm border border-border/60"
            style={{ background: value }}
          />
        ) : (
          <span className="h-3 w-3 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate text-foreground/85" title={id}>
          {id}
        </span>
        {isOverridden ? (
          <span aria-label="overridden" className="h-1 w-1 shrink-0 rounded-full bg-primary" />
        ) : null}
        <span
          className="shrink-0 truncate font-mono tabular-nums text-muted-foreground"
          style={{ maxWidth: 96 }}
          title={value}
        >
          {value}
        </span>
        <ChevronDown
          size={10}
          className={cn(
            "shrink-0 text-muted-foreground/60 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-border/40 bg-background px-3 py-2.5">
          <TokenValueEditor kind={editorKind} value={value} onChange={onChange} compact />
          {isOverridden ? (
            <button
              type="button"
              onClick={onReset}
              className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Reset to derived default
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
