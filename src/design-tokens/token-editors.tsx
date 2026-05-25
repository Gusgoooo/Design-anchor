import * as React from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { converter, parse } from "culori";
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
          <div className="min-w-0 flex-1 space-y-0.5 text-sm">
            <p className="font-mono break-all text-foreground">{hexDisplay}</p>
            <p className="font-mono break-all text-muted-foreground">{rgbaDisplay}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">CSS</Label>
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
  // One field. Type any CSS length: "4", "4px", "1rem", "1.5em", "calc(100% - 8px)".
  // Bare numbers default to whatever unit the previous value carried (or "px" if none).
  const parsed = parseCssLength(value);
  const lastUnit = parsed?.unit ?? "px";

  const [textVal, setTextVal] = React.useState(value);
  React.useEffect(() => setTextVal(value), [value]);

  function commit() {
    const trimmed = textVal.trim();
    if (!trimmed || trimmed === value) return;
    // If it parses as a length without an explicit unit (just a number),
    // attach the previous value's unit so designers can type "8" instead
    // of "8px" every time.
    if (/^-?\d*\.?\d+$/.test(trimmed)) {
      onChange(formatCssLength(Number(trimmed), lastUnit));
      return;
    }
    // Otherwise pass through whatever the user typed.
    const p = parseCssLength(trimmed);
    onChange(p ? formatCssLength(p.num, p.unit) : trimmed);
  }

  /**
   * Live-commit on every keystroke so the draft (and PreviewBoard, dirty
   * indicator, Save button count) updates without waiting for blur/Enter.
   * We pass the raw text — no unit auto-appending mid-type, otherwise
   * typing "4" would become "4px" before the user finishes their "40".
   * The full normalize (add unit) still happens in commit() on blur/Enter.
   */
  function liveCommit(rawText: string) {
    const trimmed = rawText.trim();
    if (!trimmed || trimmed === value) return;
    onChange(trimmed);
  }

  function step(direction: 1 | -1, fine: boolean) {
    // Arrow keys nudge by 0.25 (shift = 0.1) — small enough that on the
    // largest spacing token (spacing-12 = 12 × sizeUnit) a single press
    // produces ~3px of change pre-round, which after Math.round in the emit
    // path lands as 0–1px on most stops. Avoids the "20% jump everywhere"
    // feel of full integer sizeUnit increments.
    const cur = parseCssLength(textVal);
    if (!cur) return;
    const delta = (fine ? 0.1 : 0.25) * direction;
    const next = +(cur.num + delta).toFixed(3);
    const formatted = formatCssLength(next, cur.unit);
    setTextVal(formatted);
    onChange(formatted);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        Value · ↑↓ ±0.25 · ⇧↑↓ ±0.1 · accepts px / rem / em / % / calc(…)
      </Label>
      <Input
        value={textVal}
        onChange={(e) => {
          const v = e.target.value;
          setTextVal(v);
          liveCommit(v);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { commit(); return; }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            step(e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
          }
        }}
        className="h-9 font-mono text-sm tabular-nums"
        spellCheck={false}
        autoComplete="off"
        placeholder="4px"
      />
    </div>
  );
}

export function SliderEditor({
  value,
  onChange,
  config,
}: {
  value: string;
  onChange: (v: string) => void;
  config: { min: number; max: number; step: number; labels?: Array<{ value: number; label: string }> };
}) {
  const parsed = parseCssLength(value);
  const unit = parsed?.unit ?? "px";
  const num = Number.isFinite(parsed?.num) ? (parsed!.num as number) : config.min;

  // Clamp display to slider range without mutating tokens.json — if seed has
  // a value outside the slider's range (e.g. legacy 6px), show it pinned at
  // the closest end while the slider's visual position stays inside.
  const displayNum = Math.max(config.min, Math.min(config.max, num));

  function commit(next: number) {
    const rounded = Math.round(next / config.step) * config.step;
    const clean = +rounded.toFixed(3);
    onChange(formatCssLength(clean, unit));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {`Range ${config.min}–${config.max} · step ${config.step}`}
        </Label>
        <span className="font-mono text-sm tabular-nums text-foreground">
          {formatCssLength(num, unit)}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={displayNum}
        onChange={(e) => commit(Number(e.currentTarget.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
      />
      {config.labels && config.labels.length ? (
        <div className="relative h-4 text-xs text-muted-foreground">
          {config.labels.map((l) => {
            const pct = ((l.value - config.min) / (config.max - config.min)) * 100;
            const transform =
              pct < 5 ? "translateX(0)" : pct > 95 ? "translateX(-100%)" : "translateX(-50%)";
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => commit(l.value)}
                className="absolute top-0 whitespace-nowrap text-muted-foreground hover:text-foreground"
                style={{ left: `${pct}%`, transform }}
                title={`${l.label} (${l.value}${unit})`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      ) : null}
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
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current</Label>
        <p className="font-mono text-xs break-all text-foreground">{value}</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">New value</Label>
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
