import * as React from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { converter, formatCss, parse } from "culori";
import { X, RotateCcw, Copy, Check, Ruler, Save, Code, Sun, Moon } from "lucide-react";
import { Button } from "@/components/starter/button";
import { Input } from "@/components/starter/input";
import { Label } from "@/components/starter/label";
import { cn } from "@/lib/utils";
import tokensFallback from "./tokens.json";
import { deriveSeedToMap } from "./seed-to-map.mjs";
import { DesignTokenShowcase } from "./DesignTokenShowcase";
import type { DesignTokenEntry } from "./token-registry";
import { detectTokenValueKind, parseCssLength, formatCssLength, type TokenValueKind } from "./token-value-type";

/** 与 Vite 开发服同源；显式 origin，避免相对路径未命中保存 API */
function devApi(path: string): string {
  if (typeof window === "undefined" || !path.startsWith("/")) return path;
  return `${window.location.origin}${path}`;
}

const toOklch = converter("oklch");
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

function hex8ToOklchCss(hex: string): string {
  const p = parse(hex);
  if (!p) return hex;
  const ok = toOklch(p);
  if (!ok) return hex;
  return formatCss(ok);
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

type TokenRow = {
  id: string;
  category?: string;
  light: string;
  dark: string;
  tailwindClass?: string;
  usedBy?: string[];
  emitCss?: boolean;
};

type TokensDocV1 = {
  version?: number;
  tokens: TokenRow[];
  storyBindings?: unknown;
};

type TokensDocV2 = {
  version: 2;
  seed: Record<string, string | number>;
  seedDark?: Record<string, string | number>;
  /** 覆盖派生 CSS 变量：light / dark 各自独立，写回 tokens.json 并参与 sync:tokens */
  mapOverrides?: { light?: Record<string, string>; dark?: Record<string, string> };
  customSeeds?: Record<string, string>;
  fixedAliases?: Record<string, string | number>;
  storyBindings?: unknown;
};

type TokensDoc = TokensDocV1;

function categorizeCssVar(id: string): string {
  if (id.startsWith("color-primary")) return "color-primary";
  if (id.startsWith("color-success")) return "color-success";
  if (id.startsWith("color-warning")) return "color-warning";
  if (id.startsWith("color-error")) return "color-error";
  if (id.startsWith("color-info")) return "color-info";
  if (id.startsWith("color-link")) return "color-link";
  if (id.startsWith("color-text") || id.startsWith("color-fill") || id.startsWith("color-bg") || id.startsWith("color-border") || id === "color-white" || id === "color-shadow") return "neutral-color";
  if (["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground", "destructive", "border", "input", "ring"].includes(id)) return "semantic";
  if (id.startsWith("sidebar")) return "sidebar";
  if (id.startsWith("chart-")) return "chart";
  if (id.startsWith("font-size") || id.startsWith("line-height")) return "typography";
  if (id.startsWith("font-weight") || id.startsWith("font-family")) return "typography";
  if (id.startsWith("size") || id.startsWith("control-height")) return "size";
  if (id.startsWith("border-radius")) return "radius";
  if (id.startsWith("padding") || id.startsWith("margin")) return "spacing";
  if (id.startsWith("space-")) return "spacing-scale";
  if (id.startsWith("elevation")) return "shadow";
  if (id.startsWith("motion")) return "motion";
  if (id.startsWith("opacity")) return "opacity";
  if (id.startsWith("ring") || id.startsWith("border-width") || id.startsWith("line-width")) return "border";
  if (id.startsWith("z-")) return "z-index";
  if (id.startsWith("layout-")) return "layout";
  return "other";
}

function v2ToTokenRows(v2: TokensDocV2): TokenRow[] {
  const rows: TokenRow[] = [];
  const { seed, seedDark = {}, mapOverrides = {}, customSeeds = {}, fixedAliases = {} } = v2;
  const moL = mapOverrides.light ?? {};
  const moD = mapOverrides.dark ?? {};

  for (const [key, val] of Object.entries(seed)) {
    const darkVal = seedDark[key] ?? val;
    rows.push({ id: key, category: "seed", light: String(val), dark: String(darkVal) });
  }

  try {
    const lightVars = deriveSeedToMap(seed, { dark: false, customSeeds, fixedAliases });
    const darkSeed = { ...seed, ...seedDark };
    const darkVars = deriveSeedToMap(darkSeed, { dark: true, customSeeds, fixedAliases });
    const lightMerged = { ...lightVars, ...moL };
    const darkMerged = { ...darkVars, ...moD };

    for (const [name, value] of Object.entries(lightMerged)) {
      if (value === "" || value == null) continue;
      const darkValue = darkMerged[name];
      rows.push({
        id: name,
        category: categorizeCssVar(name),
        light: String(value),
        dark: darkValue != null ? String(darkValue) : String(value),
      });
    }
  } catch {
    for (const [key, val] of Object.entries(fixedAliases)) {
      rows.push({ id: `alias-${key}`, category: "fixedAlias", light: String(val), dark: String(val) });
    }
    for (let i = 1; i <= 5; i++) {
      const l = customSeeds[`chart${i}`] ?? "";
      const d = customSeeds[`chart${i}Dark`] ?? l;
      rows.push({ id: `chart-${i}`, category: "chart", light: l, dark: d });
    }
  }

  return rows;
}

function normalizeDoc(raw: string): TokensDoc | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version === 2 && parsed.seed) {
      return { version: 2, tokens: v2ToTokenRows(parsed as TokensDocV2), storyBindings: parsed.storyBindings };
    }
    return parsed as TokensDoc;
  } catch {
    return null;
  }
}

/* ── Length slider 范围自适应 ── */
const UNIT_RANGES: Record<string, { min: number; max: number; step: number }> = {
  rem: { min: 0, max: 5, step: 0.0625 },
  em: { min: 0, max: 5, step: 0.0625 },
  px: { min: 0, max: 100, step: 1 },
  "%": { min: 0, max: 100, step: 1 },
};
const DEFAULT_RANGE = { min: 0, max: 10, step: 0.1 };

/* ── 颜色编辑器子组件 ── */
function ColorEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hex8 = React.useMemo(() => cssToHex8(value || "#000000"), [value]);

  const oklchDisplay = React.useMemo(() => {
    const p = parse(value);
    if (!p) return "—";
    const o = toOklch(p);
    return o ? formatCss(o) : "—";
  }, [value]);

  const rgbaDisplay = React.useMemo(() => formatRgba(value), [value]);

  function handlePickerChange(newHex8: string) {
    onChange(hex8ToOklchCss(newHex8));
  }

  function handleCssInputCommit(text: string) {
    const p = parse(text);
    if (!p) return;
    onChange(formatCss(p));
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <HexAlphaColorPicker
          color={hex8}
          onChange={handlePickerChange}
          style={{ width: 220, height: 220 }}
        />
        <HexColorInput
          color={hex8.slice(0, 7)}
          onChange={(h) => handlePickerChange(h + hex8.slice(7))}
          prefixed
          className="w-[220px] rounded-md border border-input bg-background px-3 py-1.5 text-center font-mono text-sm text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div
          className="h-16 w-full rounded-lg border border-border shadow-inner"
          style={{ background: value || "transparent" }}
        />
        <div className="space-y-2.5 text-sm">
          <div>
            <span className="text-xs font-medium text-muted-foreground">OKLCH</span>
            <p className="mt-0.5 font-mono text-xs break-all text-foreground">{oklchDisplay}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">RGBA</span>
            <p className="mt-0.5 font-mono text-xs break-all text-foreground">{rgbaDisplay}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">HEX</span>
            <p className="mt-0.5 font-mono text-xs break-all text-foreground">{hex8.slice(0, 7)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CSS 颜色值</Label>
          <Input
            defaultValue={value}
            key={value}
            className="font-mono text-xs"
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

/* ── CSS 长度编辑器子组件 ── */
function LengthEditor({
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
    <div className="flex flex-col gap-6">
      {/* 可视化预览 */}
      <div className="flex items-center gap-4">
        <Ruler size={20} className="shrink-0 text-muted-foreground" />
        <div className="flex flex-1 items-end gap-3">
          <div
            className="rounded-md border border-border bg-primary/15 transition-all"
            style={{ width: `${previewSize}px`, height: "48px" }}
          />
          <span className="shrink-0 font-mono text-lg font-semibold text-foreground tabular-nums">
            {value}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          拖拽调节（{range.min}{unit} – {range.max}{unit}，步长 {range.step}{unit}）
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

      {/* 数值 + 单位 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">数值</Label>
          <Input
            type="number"
            min={0}
            step={range.step}
            value={num}
            onChange={handleNumInput}
            className="font-mono text-sm tabular-nums"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">单位</Label>
          <select
            value={unit}
            onChange={(e) => onChange(formatCssLength(num, e.target.value))}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {["rem", "em", "px", "%"].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 原始文本输入 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">CSS 值（自由输入）</Label>
        <Input
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          onBlur={commitTextInput}
          onKeyDown={(e) => { if (e.key === "Enter") commitTextInput(); }}
          className="font-mono text-xs"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

/* ── 通用文本编辑器子组件 ── */
function GenericEditor({
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
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">当前值</Label>
        <p className="font-mono text-sm break-all text-foreground">{value}</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">新值</Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          className="font-mono text-sm"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

/* ── 根据值类型选择编辑器 ── */
function TokenValueEditor({
  kind,
  value,
  onChange,
}: {
  kind: TokenValueKind;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (kind) {
    case "color":
      return <ColorEditor value={value} onChange={onChange} />;
    case "length":
      return <LengthEditor value={value} onChange={onChange} />;
    default:
      return <GenericEditor value={value} onChange={onChange} />;
  }
}

const KIND_LABEL: Record<TokenValueKind, string> = {
  color: "颜色",
  length: "长度 / 尺寸",
  generic: "通用",
};

/* ── 主页面 ── */

export function DesignTokenPage() {
  const [raw, setRaw] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saveApiAvailable, setSaveApiAvailable] = React.useState(false);
  const [picker, setPicker] = React.useState<{ tokenId: string; field: "light" | "dark" } | null>(null);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [codeOpen, setCodeOpen] = React.useState(false);
  const codeDialogRef = React.useRef<HTMLDialogElement>(null);
  const DARK_KEY = "harness-dark-mode";
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof localStorage !== "undefined") return localStorage.getItem(DARK_KEY) === "true";
    if (typeof document !== "undefined") return document.documentElement.classList.contains("dark");
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
    // 与 Storybook Manager appContentBg 一致，画布与 Controls 面板同色
    document.body.style.background = darkMode ? "#1c1c1e" : "#ffffff";
    localStorage.setItem(DARK_KEY, String(darkMode));
    try {
      const ch = new BroadcastChannel(DARK_KEY);
      ch.postMessage(darkMode);
      ch.close();
    } catch { /* BroadcastChannel not available */ }
  }, [darkMode]);

  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === DARK_KEY) setDarkMode(e.newValue === "true");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(devApi("/api/design-tokens"), { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      setRaw(await res.text());
      setSaveApiAvailable(true);
    } catch {
      setRaw(JSON.stringify(tokensFallback as object, null, 2));
      setSaveApiAvailable(false);
      setStatus(
        "未命中保存 API（常见原因：① 使用 `storybook build` 的静态站点无 Node 中间件；② 未通过 `npm run storybook` 启动）。已加载打包内嵌的 tokens.json，可本地改文案；**写回磁盘**请在本仓库执行 `npm run storybook` 后再点「保存并同步」。",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const doc = React.useMemo((): TokensDoc | null => normalizeDoc(raw), [raw]);

  function patchTokenField(tokenId: string, field: "light" | "dark", value: string) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === 2 && parsed.seed) {
        if (parsed.seed[tokenId] !== undefined) {
          if (field === "dark") {
            parsed.seedDark = { ...parsed.seedDark, [tokenId]: value };
          } else {
            parsed.seed[tokenId] = value;
          }
          setRaw(JSON.stringify(parsed, null, 2));
          return;
        }
        if (parsed.seedDark?.[tokenId] !== undefined && field === "dark") {
          parsed.seedDark[tokenId] = value;
          setRaw(JSON.stringify(parsed, null, 2));
          return;
        }
        if (parsed.fixedAliases?.[tokenId] !== undefined) {
          parsed.fixedAliases[tokenId] = value;
          setRaw(JSON.stringify(parsed, null, 2));
          return;
        }
        const customKey = tokenId.replace(/^chart-(\d)$/, "chart$1");
        const customDarkKey = `${customKey}Dark`;
        if (parsed.customSeeds?.[customKey] !== undefined || parsed.customSeeds?.[customDarkKey] !== undefined) {
          if (!parsed.customSeeds) parsed.customSeeds = {};
          parsed.customSeeds[field === "dark" ? customDarkKey : customKey] = value;
          setRaw(JSON.stringify(parsed, null, 2));
          return;
        }
        parsed.mapOverrides = parsed.mapOverrides ?? { light: {}, dark: {} };
        if (!parsed.mapOverrides.light) parsed.mapOverrides.light = {};
        if (!parsed.mapOverrides.dark) parsed.mapOverrides.dark = {};
        const branch = field === "dark" ? "dark" : "light";
        parsed.mapOverrides[branch] = { ...parsed.mapOverrides[branch], [tokenId]: value };
        setRaw(JSON.stringify(parsed, null, 2));
        return;
      }
      if (!parsed.tokens) return;
      parsed.tokens = parsed.tokens.map((t: TokenRow) => (t.id === tokenId ? { ...t, [field]: value } : t));
      setRaw(JSON.stringify(parsed, null, 2));
    } catch { /* ignore parse errors */ }
  }

  async function save() {
    setStatus(null);
    try {
      JSON.parse(raw);
    } catch (e) {
      setStatus(`JSON 无效：${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    if (!saveApiAvailable) {
      setStatus("当前环境无 /api/save-design-tokens，无法写盘。请运行 `npm run storybook` 后重试，或手动粘贴到 src/design-tokens/tokens.json。");
      return;
    }
    try {
      const res = await fetch(devApi("/api/save-design-tokens"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonText: raw }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        fileWritten?: boolean;
        syncOk?: boolean;
        syncError?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      if (!body.ok || !body.fileWritten) throw new Error(body.error ?? "未写入磁盘");
      const parts: string[] = ["已写入磁盘：src/design-tokens/tokens.json"];
      if (body.syncOk === false && body.syncError) {
        parts.push(
          `⚠️ sync:tokens 失败（JSON 已落盘，请在本机终端手动执行 npm run sync:tokens）：\n${body.syncError}`,
        );
      } else if (body.syncOk !== false) {
        parts.push("已执行 sync:tokens（design-tokens.generated.css 已更新）。");
      }
      setStatus(parts.join("\n"));
      await load();
    } catch (e) {
      setStatus(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const pickedRow = doc?.tokens.find((t) => t.id === picker?.tokenId);
  const tokenMissing = Boolean(picker && doc && !pickedRow);

  const currentValue =
    pickedRow && picker ? (picker.field === "light" ? pickedRow.light : pickedRow.dark) : "";

  const valueKind: TokenValueKind = React.useMemo(
    () => (currentValue ? detectTokenValueKind(currentValue) : "generic"),
    [currentValue],
  );

  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (picker) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [picker]);

  function closeDialog() {
    setPicker(null);
    setCopied(false);
  }

  React.useEffect(() => {
    const el = codeDialogRef.current;
    if (!el) return;
    if (codeOpen && !el.open) el.showModal();
    else if (!codeOpen && el.open) el.close();
  }, [codeOpen]);

  function resetPickedToBundledDefault() {
    if (!picker) return;
    const fb = tokensFallback as unknown as Record<string, unknown>;
    if (fb.version === 2 && fb.seed) {
      const seed = fb.seed as Record<string, string | number>;
      const seedDark = (fb.seedDark ?? {}) as Record<string, string | number>;
      const v = picker.field === "dark" ? seedDark[picker.tokenId] ?? seed[picker.tokenId] : seed[picker.tokenId];
      if (v !== undefined) {
        patchTokenField(picker.tokenId, picker.field, String(v));
        return;
      }
      try {
        const parsed = JSON.parse(raw) as TokensDocV2;
        parsed.mapOverrides = parsed.mapOverrides ?? { light: {}, dark: {} };
        const branch = picker.field === "light" ? "light" : "dark";
        const next = { ...(parsed.mapOverrides[branch] ?? {}) };
        delete next[picker.tokenId];
        parsed.mapOverrides[branch] = next;
        setRaw(JSON.stringify(parsed, null, 2));
      } catch { /* ignore */ }
      return;
    }
    const arr = (fb as { tokens?: TokenRow[] }).tokens ?? [];
    const row = arr.find((t) => t.id === picker.tokenId);
    const v = row?.[picker.field];
    if (typeof v === "string") patchTokenField(picker.tokenId, picker.field, v);
  }

  async function copyCurrentValue() {
    try {
      await navigator.clipboard.writeText(currentValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  const liveTokens = (doc?.tokens as DesignTokenEntry[] | undefined) ?? undefined;

  const currentSeeds = React.useMemo((): Record<string, string | number> => {
    try {
      const parsed = JSON.parse(raw) as TokensDocV2;
      if (parsed.version === 2 && parsed.seed) {
        if (!darkMode) return parsed.seed;
        const sd = parsed.seedDark ?? {};
        const out: Record<string, string | number> = { ...parsed.seed };
        for (const k of Object.keys(parsed.seed)) {
          if (sd[k] !== undefined) out[k] = sd[k]!;
        }
        return out;
      }
    } catch { /* ignore */ }
    return {};
  }, [raw, darkMode]);

  function handleSeedChange(seedKey: string, value: string) {
    const numVal = Number(value);
    const coerced = Number.isFinite(numVal) && !/^#/.test(value) && !/[a-zA-Z]/.test(value) ? numVal : value;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === 2 && parsed.seed) {
        if (darkMode) {
          parsed.seedDark = { ...(parsed.seedDark ?? {}), [seedKey]: coerced };
        } else {
          parsed.seed[seedKey] = coerced;
        }
        setRaw(JSON.stringify(parsed, null, 2));
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="not-prose flex min-h-[70vh] w-full min-w-0 flex-col text-foreground">
      <header className="w-full min-w-0 border-b border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full min-w-0 items-start justify-between gap-6">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">DesignToken</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Seed 与「暗色预览」下的 Seed 分别写入 <code className="rounded bg-muted px-1 font-mono text-xs">seed</code> /{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">seedDark</code>；梯度变量可按当前预览模式单独覆盖并保存到{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">mapOverrides.light</code> /{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">dark</code>。保存后执行 sync:tokens 生成 CSS。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "切换到浅色模式" : "切换到暗色模式"}
            >
              {darkMode ? <Sun size={14} className="mr-1.5" /> : <Moon size={14} className="mr-1.5" />}
              {darkMode ? "Light" : "Dark"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setCodeOpen(true)}>
              <Code size={14} className="mr-1.5" />
              JSON
            </Button>
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
              重新加载
            </Button>
            <Button type="button" onClick={() => void save()}>
              保存并同步
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full min-w-0 flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <DesignTokenShowcase
          embedded
          liveTokens={liveTokens}
          seeds={currentSeeds}
          onSeedChange={handleSeedChange}
          darkMode={darkMode}
          onTokenEdit={(token) => setPicker({ tokenId: token.id, field: darkMode ? "dark" : "light" })}
        />
      </div>

      {/* ── Token 编辑弹框 ── */}
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/50"
        onClose={closeDialog}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
      >
        {pickedRow && picker && !tokenMissing ? (
          <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 标题栏：左右排版，无分割线 */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <h2 className="truncate text-sm font-semibold text-foreground">
                  {picker.tokenId}
                </h2>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {picker.field === "light" ? "Light" : "Dark"} 模式
                </span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                  {KIND_LABEL[valueKind]}
                </span>
              </div>
              <button
                type="button"
                aria-label="关闭"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={closeDialog}
              >
                <X size={16} />
              </button>
            </div>

            {/* 主体 */}
            <div className="px-5 pb-3">
              <TokenValueEditor
                kind={valueKind}
                value={currentValue}
                onChange={(v) => patchTokenField(pickedRow.id, picker.field, v)}
              />
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center gap-2 px-5 pb-5">
              <Button type="button" variant="outline" size="sm" onClick={resetPickedToBundledDefault}>
                <RotateCcw size={14} className="mr-1.5" />
                恢复默认
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyCurrentValue()}>
                {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copied ? "已复制" : "复制值"}
              </Button>
              <Button type="button" size="sm" className="ml-auto" onClick={() => void save()}>
                <Save size={14} className="mr-1.5" />
                保存
              </Button>
            </div>
          </div>
        ) : tokenMissing ? (
          <div className="p-6">
            <p className="text-sm text-destructive">当前 JSON 中不存在该 token，请修正或重新加载后再试。</p>
            <Button type="button" variant="outline" className="mt-4" onClick={closeDialog}>
              关闭
            </Button>
          </div>
        ) : null}
      </dialog>

      {/* ── 代码查看/编辑模态框 ── */}
      <dialog
        ref={codeDialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 w-[calc(100vw-4rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/50"
        onClose={() => setCodeOpen(false)}
        onClick={(e) => { if (e.target === codeDialogRef.current) setCodeOpen(false); }}
      >
        <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">tokens.json</h2>
              {saveApiAvailable ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">API 已连接</span>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400">只读内嵌</span>
              )}
            </div>
            <button
              type="button"
              aria-label="关闭"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setCodeOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 pb-4">
            {status ? (
              <div className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs whitespace-pre-wrap text-foreground">
                {status}
              </div>
            ) : null}
            {!doc ? (
              <p className="mb-3 text-xs text-destructive">JSON 无法解析，请检查语法。</p>
            ) : null}
            <textarea
              className="h-[min(60vh,480px)] w-full rounded-lg border border-input bg-background p-4 font-mono text-xs leading-relaxed text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              spellCheck={false}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <Button type="button" variant="outline" size="sm" onClick={() => setCodeOpen(false)}>
              关闭
            </Button>
            <Button type="button" size="sm" onClick={() => { void save(); }}>
              <Save size={14} className="mr-1.5" />
              保存并同步
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
