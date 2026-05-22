import * as React from "react";
import { converter, formatCss, parse } from "culori";
import { Button } from "@/components/base/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/base/card";
import { Input } from "@/components/base/input";
import { Label } from "@/components/base/label";
import { cn } from "@/lib/utils";

const toOklch = converter("oklch");
const toRgb = converter("rgb");

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export type OklchColorEditorProps = {
  label: string;
  value: string;
  onChange: (nextCssColor: string) => void;
  disabled?: boolean;
  /** panel: wrapped in base Card; plain: spacing only, for embedding in compact layouts */
  variant?: "panel" | "plain";
};

type EditMode = "oklch" | "rgba" | "hex";

function rgbChannelsFromCss(value: string): { r: number; g: number; b: number; alpha: number } | null {
  const p = parse(value);
  if (!p) return null;
  const s = toRgb(p);
  if (!s || s.mode !== "rgb") return null;
  return {
    r: Math.round(clamp(Number(s.r), 0, 1) * 255),
    g: Math.round(clamp(Number(s.g), 0, 1) * 255),
    b: Math.round(clamp(Number(s.b), 0, 1) * 255),
    alpha: typeof s.alpha === "number" && !Number.isNaN(s.alpha) ? clamp(s.alpha, 0, 1) : 1,
  };
}

const inputMonoClass = "font-mono tabular-nums";

/**
 * OKLCH / sRGB editor: supports OKLCH, RGBA, and Hex+Alpha modes; form elements use base `Input` / `Label` / `Button`, panel uses `Card`.
 */
export function OklchColorEditor({ label, value, onChange, disabled, variant = "panel" }: OklchColorEditorProps) {
  const uid = React.useId();
  const [editMode, setEditMode] = React.useState<EditMode>("oklch");

  const parsed = React.useMemo(() => parse(value), [value]);
  const ok = React.useMemo(() => {
    if (!parsed) return { l: 0.7, c: 0.05, h: 240 };
    const o = toOklch(parsed);
    return {
      l: typeof o.l === "number" ? o.l : 0.7,
      c: typeof o.c === "number" ? o.c : 0,
      h: typeof o.h === "number" && !Number.isNaN(o.h) ? o.h : 0,
    };
  }, [parsed, value]);

  const oklchCss = React.useMemo(
    () => formatCss({ mode: "oklch", l: ok.l, c: ok.c, h: ok.h }),
    [ok.l, ok.c, ok.h],
  );

  const [text, setText] = React.useState(value);
  const [lIn, setLIn] = React.useState("");
  const [cIn, setCIn] = React.useState("");
  const [hIn, setHIn] = React.useState("");
  const [rIn, setRIn] = React.useState("");
  const [gIn, setGIn] = React.useState("");
  const [bIn, setBIn] = React.useState("");
  const [aIn, setAIn] = React.useState("");
  const [hexIn, setHexIn] = React.useState("");

  React.useEffect(() => {
    setText(value);
  }, [value]);

  React.useEffect(() => {
    setLIn(String(ok.l));
    setCIn(String(ok.c));
    setHIn(String(ok.h));
  }, [ok.l, ok.c, ok.h, value]);

  React.useEffect(() => {
    const ch = rgbChannelsFromCss(value);
    if (!ch) return;
    setRIn(String(ch.r));
    setGIn(String(ch.g));
    setBIn(String(ch.b));
    setAIn(String(ch.alpha));
    setHexIn(
      `#${[ch.r, ch.g, ch.b]
        .map((x) => clamp(x, 0, 255).toString(16).padStart(2, "0"))
        .join("")}`,
    );
  }, [value]);

  const rgbaDisplay = React.useMemo(() => {
    const ch = rgbChannelsFromCss(text);
    if (!ch) return "—";
    const a = ch.alpha;
    const aStr = Number.isInteger(a * 1000) ? String(a) : a.toFixed(3).replace(/\.?0+$/, "");
    return `rgba(${ch.r}, ${ch.g}, ${ch.b}, ${aStr})`;
  }, [text]);

  const hexAlphaDisplay = React.useMemo(() => {
    const ch = rgbChannelsFromCss(text);
    if (!ch) return "—";
    const hex6 = `#${[ch.r, ch.g, ch.b]
      .map((x) => clamp(x, 0, 255).toString(16).padStart(2, "0"))
      .join("")}`;
    const a = ch.alpha;
    const aStr = Number.isInteger(a * 1000) ? String(a) : a.toFixed(3).replace(/\.?0+$/, "");
    if (a >= 0.999) return hex6;
    const alphaByte = Math.round(clamp(a, 0, 1) * 255);
    const hex8 = `#${hex6.slice(1)}${alphaByte.toString(16).padStart(2, "0")}`;
    return `${hex6} · α ${aStr} · 8-digit ${hex8}`;
  }, [text]);

  const applyOklch = (l: number, c: number, h: number) => {
    const css = formatCss({ mode: "oklch", l, c, h });
    onChange(css);
    setText(css);
  };

  function commitFromOklchInputs() {
    const l = Number.parseFloat(lIn.replace(",", "."));
    const c = Number.parseFloat(cIn.replace(",", "."));
    const h = Number.parseFloat(hIn.replace(",", "."));
    if (Number.isFinite(l) && Number.isFinite(c) && Number.isFinite(h)) {
      applyOklch(clamp(l, 0, 1), clamp(c, 0, 0.45), ((h % 360) + 360) % 360);
    } else {
      setLIn(String(ok.l));
      setCIn(String(ok.c));
      setHIn(String(ok.h));
    }
  }

  function applyRgbCss(r: number, g: number, b: number, alpha: number) {
    const css = formatCss({
      mode: "rgb",
      r: r / 255,
      g: g / 255,
      b: b / 255,
      alpha: clamp(alpha, 0, 1),
    });
    onChange(css);
    setText(css);
  }

  function commitFromRgbaInputs() {
    const r = Number.parseInt(rIn, 10);
    const g = Number.parseInt(gIn, 10);
    const b = Number.parseInt(bIn, 10);
    const a = Number.parseFloat(String(aIn).replace(",", "."));
    if (
      Number.isFinite(r) &&
      Number.isFinite(g) &&
      Number.isFinite(b) &&
      Number.isFinite(a) &&
      r >= 0 &&
      r <= 255 &&
      g >= 0 &&
      g <= 255 &&
      b >= 0 &&
      b <= 255 &&
      a >= 0 &&
      a <= 1
    ) {
      applyRgbCss(r, g, b, a);
    } else {
      const ch = rgbChannelsFromCss(value);
      if (ch) {
        setRIn(String(ch.r));
        setGIn(String(ch.g));
        setBIn(String(ch.b));
        setAIn(String(ch.alpha));
      }
    }
  }

  function commitFromHexInputs() {
    let h = hexIn.trim().replace(/^#/, "");
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) {
      const ch = rgbChannelsFromCss(value);
      if (ch) {
        setHexIn(
          `#${[ch.r, ch.g, ch.b]
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")}`,
        );
        setAIn(String(ch.alpha));
      }
      return;
    }
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    const a = Number.parseFloat(String(aIn).replace(",", "."));
    if (!Number.isFinite(a) || a < 0 || a > 1) {
      const ch = rgbChannelsFromCss(value);
      if (ch) setAIn(String(ch.alpha));
      return;
    }
    applyRgbCss(r, g, b, a);
  }

  const modeButton = (mode: EditMode, textBtn: string) => (
    <Button
      key={mode}
      type="button"
      size="sm"
      disabled={disabled}
      variant={editMode === mode ? "default" : "outline"}
      onClick={() => setEditMode(mode)}
    >
      {textBtn}
    </Button>
  );

  const body = (
    <div className="space-y-4 text-sm leading-normal">
      {variant === "plain" ? <div className="text-base font-medium text-foreground">{label}</div> : null}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Color edit mode">
          {modeButton("oklch", "OKLCH")}
          {modeButton("rgba", "RGBA")}
          {modeButton("hex", "Hex + Alpha")}
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div
            className="h-12 w-14 shrink-0 rounded-md border border-border shadow-inner"
            style={{ background: text || "transparent" }}
            title="Preview"
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current mapping · OKLCH</p>
              <p className="mt-1 font-mono text-sm break-all text-foreground">{parsed ? oklchCss : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current mapping · RGBA</p>
              <p className="mt-1 font-mono text-sm break-all text-foreground">{rgbaDisplay}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current mapping · Hex & Alpha</p>
              <p className="mt-1 font-mono text-sm break-all text-foreground">{hexAlphaDisplay}</p>
            </div>
          </div>
        </div>
      </div>

      {editMode === "oklch" ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-l`}>L (Lightness)</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–1, e.g. 0.65</p>
            <Input
              id={`${uid}-l`}
              inputMode="decimal"
              disabled={disabled}
              value={lIn}
              onChange={(e) => setLIn(e.target.value)}
              onBlur={commitFromOklchInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromOklchInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-c`}>C (Chroma)</Label>
            <p className="text-xs text-muted-foreground leading-snug">Typically about 0–0.4</p>
            <Input
              id={`${uid}-c`}
              inputMode="decimal"
              disabled={disabled}
              value={cIn}
              onChange={(e) => setCIn(e.target.value)}
              onBlur={commitFromOklchInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromOklchInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-h`}>H (Hue)</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–360°</p>
            <Input
              id={`${uid}-h`}
              inputMode="decimal"
              disabled={disabled}
              value={hIn}
              onChange={(e) => setHIn(e.target.value)}
              onBlur={commitFromOklchInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromOklchInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
        </div>
      ) : null}

      {editMode === "rgba" ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-r`}>R</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–255</p>
            <Input
              id={`${uid}-r`}
              inputMode="numeric"
              disabled={disabled}
              value={rIn}
              onChange={(e) => setRIn(e.target.value)}
              onBlur={commitFromRgbaInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromRgbaInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-g`}>G</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–255</p>
            <Input
              id={`${uid}-g`}
              inputMode="numeric"
              disabled={disabled}
              value={gIn}
              onChange={(e) => setGIn(e.target.value)}
              onBlur={commitFromRgbaInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromRgbaInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-b`}>B</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–255</p>
            <Input
              id={`${uid}-b`}
              inputMode="numeric"
              disabled={disabled}
              value={bIn}
              onChange={(e) => setBIn(e.target.value)}
              onBlur={commitFromRgbaInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromRgbaInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-a`}>A (Alpha)</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–1, 1 is opaque</p>
            <Input
              id={`${uid}-a`}
              inputMode="decimal"
              disabled={disabled}
              value={aIn}
              onChange={(e) => setAIn(e.target.value)}
              onBlur={commitFromRgbaInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromRgbaInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
        </div>
      ) : null}

      {editMode === "hex" ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-hex`}>Hex</Label>
            <p className="text-xs text-muted-foreground leading-snug">#RRGGBB or RRGGBB, supports 3-char shorthand</p>
            <Input
              id={`${uid}-hex`}
              disabled={disabled}
              value={hexIn}
              onChange={(e) => setHexIn(e.target.value)}
              onBlur={commitFromHexInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromHexInputs()}
              className={inputMonoClass}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${uid}-hexa`}>Alpha</Label>
            <p className="text-xs text-muted-foreground leading-snug">0–1; written to JSON as rgba()</p>
            <Input
              id={`${uid}-hexa`}
              inputMode="decimal"
              disabled={disabled}
              value={aIn}
              onChange={(e) => setAIn(e.target.value)}
              onBlur={commitFromHexInputs}
              onKeyDown={(e) => e.key === "Enter" && commitFromHexInputs()}
              className={inputMonoClass}
              autoComplete="off"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        <Label htmlFor={`${uid}-css`}>CSS Color (raw string)</Label>
        <p className="text-xs text-muted-foreground leading-snug">
          Paste oklch(), rgba(), or #hex directly; normalized to CSS by culori on blur; interoperable with mode editors above.
        </p>
        <Input
          id={`${uid}-css`}
          disabled={disabled}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            const p = parse(v);
            if (p) onChange(formatCss(p));
          }}
          onBlur={() => {
            const p = parse(text);
            if (p) {
              const css = formatCss(p);
              setText(css);
              onChange(css);
            }
          }}
          className={cn(inputMonoClass, "text-xs sm:text-sm")}
          autoComplete="off"
        />
      </div>
    </div>
  );

  if (variant === "panel") {
    return (
      <Card className="border-border bg-muted/15 shadow-sm">
        <CardHeader className="space-y-1 p-5 pb-3">
          <CardTitle className="text-base font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">{body}</CardContent>
      </Card>
    );
  }

  return body;
}
