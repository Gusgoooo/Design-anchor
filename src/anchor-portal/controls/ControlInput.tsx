import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NormalizedControl } from "./normalize";

export type ControlInputProps = {
  control: NormalizedControl;
  value: unknown;
  onChange: (value: unknown) => void;
  argName: string;
};

const inputBase =
  "w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";

export function ControlInput({ control, value, onChange, argName }: ControlInputProps) {
  switch (control.kind) {
    case "boolean":
      return <BooleanInput value={Boolean(value)} onChange={onChange} />;
    case "text":
      return <TextInput value={value} onChange={onChange} />;
    case "number":
      return <NumberInput value={value} onChange={onChange} min={control.min} max={control.max} step={control.step} />;
    case "range":
      return <RangeInput value={value} onChange={onChange} min={control.min} max={control.max} step={control.step} />;
    case "select":
      return (
        <SelectInput
          value={value}
          onChange={onChange}
          options={control.options}
          labels={control.labels}
          multi={control.multi}
          argName={argName}
        />
      );
    case "radio":
      return <RadioInput value={value} onChange={onChange} options={control.options} labels={control.labels} inline={control.inline} argName={argName} />;
    case "check":
      return <CheckInput value={Array.isArray(value) ? value : []} onChange={onChange} options={control.options} labels={control.labels} inline={control.inline} />;
    case "color":
      return <ColorInput value={value} onChange={onChange} presets={control.presets} />;
    case "date":
      return <DateInput value={value} onChange={onChange} />;
    case "object":
      return <ObjectInput value={value} onChange={onChange} />;
    case "file":
      return <FileInput onChange={onChange} />;
    case "disabled":
      return <DisabledNote text="Control disabled" />;
    default:
      // Fallback: render as text so the user can still see / edit the value
      return <TextInput value={value} onChange={onChange} />;
  }
}

function BooleanInput({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-sm transition-colors",
        value ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition-transform",
          value ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function TextInput({ value, onChange }: { value: unknown; onChange: (v: string) => void }) {
  const str = value == null ? "" : String(value);
  return (
    <input
      type="text"
      value={str}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputBase, "font-mono")}
      spellCheck={false}
      autoComplete="off"
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: unknown;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const v = typeof value === "number" ? value : Number(value);
  return (
    <input
      type="number"
      value={Number.isFinite(v) ? v : ""}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(undefined);
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      className={cn(inputBase, "font-mono tabular-nums")}
    />
  );
}

function RangeInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: {
  value: unknown;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const v = typeof value === "number" ? value : Number(value);
  const safe = Number.isFinite(v) ? v : min;
  return (
    <div className="flex w-full items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safe}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
      <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{safe}</span>
    </div>
  );
}

function labelFor(opt: unknown, labels?: Record<string, string>): string {
  if (labels) {
    const key = String(opt);
    if (key in labels) return labels[key]!;
  }
  if (opt === null) return "null";
  if (opt === undefined) return "undefined";
  if (typeof opt === "object") return JSON.stringify(opt);
  return String(opt);
}

function SelectInput({
  value,
  onChange,
  options,
  labels,
  multi,
  argName,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  options: unknown[];
  labels?: Record<string, string>;
  multi?: boolean;
  argName: string;
}) {
  if (multi) {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <select
        multiple
        value={selected}
        onChange={(e) => {
          const next = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(next);
        }}
        className={cn(inputBase, "h-auto min-h-[64px] font-mono")}
      >
        {options.map((opt, i) => (
          <option key={i} value={String(opt)}>
            {labelFor(opt, labels)}
          </option>
        ))}
      </select>
    );
  }
  const cur = value == null ? "" : String(value);
  return (
    <div className="relative">
      <select
        value={cur}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, "appearance-none pr-7 font-mono")}
        aria-label={argName}
      >
        {!options.some((o) => String(o) === cur) && cur !== "" ? (
          <option value={cur}>{cur} (current)</option>
        ) : null}
        {options.map((opt, i) => (
          <option key={i} value={String(opt)}>
            {labelFor(opt, labels)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

function RadioInput({
  value,
  onChange,
  options,
  labels,
  inline,
  argName,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  options: unknown[];
  labels?: Record<string, string>;
  inline?: boolean;
  argName: string;
}) {
  return (
    <div className={cn("flex gap-2", inline ? "flex-row flex-wrap" : "flex-col")}>
      {options.map((opt, i) => {
        const key = String(opt);
        const checked = String(value) === key;
        return (
          <label key={i} className="inline-flex items-center gap-1.5 text-xs text-foreground">
            <input
              type="radio"
              name={argName}
              checked={checked}
              onChange={() => onChange(opt)}
              className="h-3 w-3 cursor-pointer accent-primary"
            />
            <span>{labelFor(opt, labels)}</span>
          </label>
        );
      })}
    </div>
  );
}

function CheckInput({
  value,
  onChange,
  options,
  labels,
  inline,
}: {
  value: unknown[];
  onChange: (v: unknown[]) => void;
  options: unknown[];
  labels?: Record<string, string>;
  inline?: boolean;
}) {
  const set = new Set(value.map(String));
  return (
    <div className={cn("flex gap-2", inline ? "flex-row flex-wrap" : "flex-col")}>
      {options.map((opt, i) => {
        const key = String(opt);
        const checked = set.has(key);
        return (
          <label key={i} className="inline-flex items-center gap-1.5 text-xs text-foreground">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = new Set(set);
                if (e.target.checked) next.add(key);
                else next.delete(key);
                onChange(options.filter((o) => next.has(String(o))));
              }}
              className="h-3 w-3 cursor-pointer accent-primary"
            />
            <span>{labelFor(opt, labels)}</span>
          </label>
        );
      })}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  presets,
}: {
  value: unknown;
  onChange: (v: string) => void;
  presets?: ReadonlyArray<string>;
}) {
  const str = typeof value === "string" ? value : "#000000";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(str) ? str : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-input"
        />
        <input
          type="text"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputBase, "font-mono")}
        />
      </div>
      {presets && presets.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              title={p}
              onClick={() => onChange(p)}
              className="h-4 w-4 rounded border border-border"
              style={{ background: p }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DateInput({ value, onChange }: { value: unknown; onChange: (v: string) => void }) {
  const str = typeof value === "string" ? value : "";
  return (
    <input
      type="date"
      value={str}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputBase, "font-mono")}
    />
  );
}

function ObjectInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = React.useState<string>(() => stringify(value));
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(() => {
    setText(stringify(value));
  }, [value]);
  return (
    <div className="flex flex-col gap-1">
      <textarea
        value={text}
        rows={4}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          try {
            const next = JSON.parse(text);
            setErr(null);
            onChange(next);
          } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
          }
        }}
        className={cn(inputBase, "min-h-[72px] resize-vertical font-mono leading-relaxed")}
      />
      {err ? <span className="text-[10px] text-destructive">{err}</span> : null}
    </div>
  );
}

function FileInput({ onChange }: { onChange: (v: File | null) => void }) {
  return (
    <input
      type="file"
      onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
    />
  );
}

function DisabledNote({ text }: { text: string }) {
  return <span className="text-xs italic text-muted-foreground/70">{text}</span>;
}

function stringify(v: unknown): string {
  if (v === undefined) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
