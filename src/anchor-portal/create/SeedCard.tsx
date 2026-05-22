import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SeedDef,
  type EditorKind,
} from "@/design-tokens/seed-card-config";
import { TokenValueEditor } from "@/design-tokens/token-editors";
import { detectTokenValueKind } from "@/design-tokens/token-value-type";

function colorPreview(value: string) {
  return /^(#|rgb|rgba|hsl|hsla|oklch|oklab)/.test(value.trim());
}

function chooseEditorKind(declared: EditorKind, value: string) {
  if (declared !== "generic") return declared;
  // Generic seeds: detect runtime kind so e.g. numeric strings still get the
  // length editor when applicable.
  const detected = detectTokenValueKind(value);
  return detected;
}

export function SeedRow({
  seed,
  value,
  isDirty,
  defaultOpen,
  onChange,
}: {
  seed: SeedDef;
  value: string;
  isDirty: boolean;
  defaultOpen?: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const isColor = colorPreview(value);
  const editorKind = chooseEditorKind(seed.editor, value);

  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/40",
          open && "bg-muted/30",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{seed.label}</span>
            {isDirty ? (
              <span
                aria-label="modified"
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
            ) : null}
          </div>
          <div className="mt-0.5 truncate font-mono text-[12px] text-foreground" title={value}>
            {value || "—"}
          </div>
        </div>
        {isColor ? (
          <span
            className="h-6 w-6 shrink-0 rounded-md border border-border shadow-inner"
            style={{ background: value || "transparent" }}
          />
        ) : null}
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-border/60 bg-muted/10 px-3 py-3">
          <TokenValueEditor kind={editorKind} value={value} onChange={onChange} compact />
        </div>
      ) : null}
    </div>
  );
}

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
  const isColor = colorPreview(value);
  const editorKind = chooseEditorKind("generic", value);

  return (
    <div className="border-t border-border/40 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-muted/30"
      >
        <span className="min-w-0 flex-1 truncate text-muted-foreground" title={id}>
          {id}
        </span>
        <span className="shrink-0 truncate font-mono text-[11px] text-foreground/80 tabular-nums" title={value}>
          {value}
        </span>
        {isOverridden ? (
          <span aria-label="overridden" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        ) : null}
        {isColor ? (
          <span
            className="h-4 w-4 shrink-0 rounded border border-border"
            style={{ background: value || "transparent" }}
          />
        ) : null}
      </button>
      {open ? (
        <div className="border-t border-border/40 bg-background px-3 py-3">
          <TokenValueEditor kind={editorKind} value={value} onChange={onChange} compact />
          {isOverridden ? (
            <button
              type="button"
              onClick={onReset}
              className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              Reset to derived default
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
