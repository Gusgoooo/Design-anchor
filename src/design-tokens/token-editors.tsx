import * as React from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { converter, parse } from "culori";
import { Ruler } from "lucide-react";
import { Input } from "@/components/base/input";
import { Label } from "@/components/base/label";
import {
  parseCssLength,
  formatCssLength,
  type TokenValueKind,
} from "./token-value-type";

const toRgb = converter("rgb");

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function cssToHex8(cssColor: string): string {
  const p = parse(cssColor);
  if (!p) return "#000000ff";
  const rgb = toRgb(p);
  if (!rgb) return "#000000ff";
  const r = Math.round(clamp(rgb.r ?? 0, 0, 1) * 255);
  const g = Math.round(clamp(rgb.g ?? 0, 0, 1) * 255);
  const b = Math.round(clamp(rgb.b ?? 0, 0, 1) * 255);
  const a = typeof rgb.alpha === "number" ? Math.round(clamp(rgb.alpha, 0, 1) * 255) : 255;
  return `#${[r, g, b, a].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function hex8ToHexCss(hex8: string): string {
  const p = parse(hex8);
  if (!p) return hex8;
  const rgb = toRgb(p);
  if (!rgb) return hex8;
  const r = Math.round(clamp(rgb.r ?? 0, 0, 1) * 255);
  const g = Math.round(clamp(rgb.g ?? 0, 0, 1) * 255);
  const b = Math.round(clamp(rgb.b ?? 0, 0, 1) * 255);
  const a = typeof rgb.alpha === "number" ? clamp(rgb.alpha, 0, 1) : 1;
  const hex6 = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  if (a >= 0.999) return hex6;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2).replace(/\.?0+$/, "")})`;
}

function formatRgba(cssColor: string): string {
  const p = parse(cssColor);
  if (!p) return "—";
  const rgb = toRgb(p);
  if (!rgb) return "—";
  const r = Math.round(clamp(rgb.r ?? 0, 0, 1) * 255);
  const g = Math.round(clamp(rgb.g ?? 0, 0, 1) * 255);
  const b = Math.round(clamp(rgb.b ?? 0, 0, 1) * 255);
  const a = typeof rgb.alpha === "number" ? clamp(rgb.alpha, 0, 1) : 1;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2).replace(/\.?0+$/, "")})`;
}

const UNIT_RANGES: Record<string, { min: number; max: number; step: number }> = {
  rem: { min: 0, max: 5, step: 0.0625 },
  em: { min: 0, max: 5, step: 0.0625 },
  px: { min: 0, max: 100, step: 1 },
  "%": { min: 0, max: 100, step: 1 },
};
const DEFAULT_RANGE = { min: 0, max: 10, step: 0.1 };

export function ColorEditor({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  /** compact: smaller picker for narrow side panel */
  compact?: boolean;
}) {
  const hex8 = React.useMemo(() => cssToHex8(value || "#000000"), [value]);
  const hexDisplay = React.useMemo(() => hex8.slice(0, 7), [hex8]);
  const rgbaDisplay = React.useMemo(() => formatRgba(value), [value]);
  const pickerSize = compact ? 180 : 220;

  function handlePickerChange(newHex8: string) {
    onChange(hex8ToHexCss(newHex8));
  }

  function handleCssInputCommit(text: string) {
    const p = parse(text);
    if (!p) return;
    const rgb = toRgb(p);
    if (!rgb) { onChange(text); return; }
    const r = Math.round(clamp(rgb.r ?? 0, 0, 1) * 255);
    const g = Math.round(clamp(rgb.g ?? 0, 0, 1) * 255);
    const b = Math.round(clamp(rgb.b ?? 0, 0, 1) * 255);
    const a = typeof rgb.alpha === "number" ? clamp(rgb.alpha, 0, 1) : 1;
    const hex6 = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    onChange(a >= 0.999 ? hex6 : `rgba(${r}, ${g}, ${b}, ${a.toFixed(2).replace(/\.?0+$/, "")})`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex shrink-0 flex-col items-center gap-2.5" style={{ minWidth: pickerSize }}>
        <HexAlphaColorPicker
          color={hex8}
          onChange={handlePickerChange}
          style={{ width: pickerSize, height: pickerSize }}
        />
        <HexColorInput
          color={hex8.slice(0, 7)}
          onChange={(h) => handlePickerChange(h + hex8.slice(7))}
          prefixed
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-center font-mono text-xs text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          style={{ width: pickerSize }}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 shrink-0 rounded-md border border-border shadow-inner"
            style={{ background: value || "transparent" }}
          />
          <div className="min-w-0 flex-1 space-y-0.5 text-[11px]">
            <p className="font-mono break-all text-foreground">{hexDisplay}</p>
            <p className="font-mono break-all text-muted-foreground">{rgbaDisplay}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">CSS</Label>
          <Input
            defaultValue={value}
            key={value}
            className="h-8 font-mono text-xs"
            spellCheck={false}
            autoComplete="off"
            onBlur={(e) => handleCssInputCommit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCssInputCommit(e.currentTarget.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function LengthEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = parseCssLength(value);
  const num = parsed?.num ?? 0;
  const unit = parsed?.unit ?? "rem";
  const range = UNIT_RANGES[unit] ?? DEFAULT_RANGE;

  const [textVal, setTextVal] = React.useState(value);
  React.useEffect(() => setTextVal(value), [value]);

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const n = Number.parseFloat(e.target.value);
    if (Number.isFinite(n)) onChange(formatCssLength(n, unit));
  }

  function handleNumInput(e: React.ChangeEvent<HTMLInputElement>) {
    const n = Number.parseFloat(e.target.value);
    if (Number.isFinite(n) && n >= 0) onChange(formatCssLength(n, unit));
  }

  function commitTextInput() {
    const trimmed = textVal.trim();
    if (!trimmed) return;
    const p = parseCssLength(trimmed);
    if (p) {
      onChange(formatCssLength(p.num, p.unit));
    } else {
      onChange(trimmed);
    }
  }

  const previewSize = Math.min(Math.max(num * (unit === "px" ? 1 : 16), 0), 120);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Ruler size={16} className="shrink-0 text-muted-foreground" />
        <div className="flex flex-1 items-end gap-3">
          <div
            className="rounded-md border border-border bg-primary/15 transition-all"
            style={{ width: `${previewSize}px`, height: "40px" }}
          />
          <span className="shrink-0 font-mono text-sm font-semibold text-foreground tabular-nums">
            {value}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {range.min}{unit} – {range.max}{unit} · step {range.step}{unit}
        </Label>
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={num}
          onChange={handleSlider}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</Label>
          <Input
            type="number"
            min={0}
            step={range.step}
            value={num}
            onChange={handleNumInput}
            className="h-8 font-mono text-xs tabular-nums"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Unit</Label>
          <select
            value={unit}
            onChange={(e) => onChange(formatCssLength(num, e.target.value))}
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {["rem", "em", "px", "%"].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">CSS (free input)</Label>
        <Input
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          onBlur={commitTextInput}
          onKeyDown={(e) => { if (e.key === "Enter") commitTextInput(); }}
          className="h-8 font-mono text-xs"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

export function GenericEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [value]);

  function commit() {
    if (text.trim()) onChange(text.trim());
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Current</Label>
        <p className="font-mono text-xs break-all text-foreground">{value}</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">New value</Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          className="h-8 font-mono text-xs"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

export function TokenValueEditor({
  kind,
  value,
  onChange,
  compact,
}: {
  kind: TokenValueKind;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  switch (kind) {
    case "color":
      return <ColorEditor value={value} onChange={onChange} compact={compact} />;
    case "length":
      return <LengthEditor value={value} onChange={onChange} />;
    default:
      return <GenericEditor value={value} onChange={onChange} />;
  }
}

export const KIND_LABEL: Record<TokenValueKind, string> = {
  color: "Color",
  length: "Length / Size",
  generic: "Generic",
};
