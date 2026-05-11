import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DesignTokenEntry } from "./token-registry";
import spacingScale from "./spacing-scale.generated.json";

type SpacingStepLabelJson = { suffix: string; zh: string; en: string };

/* ────────────────────────────────────────────────────────────────────────── */
/*  Chinese label mapping for all derived (map/alias) tokens                 */
/* ────────────────────────────────────────────────────────────────────────── */

const TOKEN_ZH: Record<string, string> = {
  // Primary
  "color-primary-bg": "主色浅色背景色",
  "color-primary-bg-hover": "主色浅色背景悬浮态",
  "color-primary-border": "主色描边色",
  "color-primary-border-hover": "主色描边色悬浮态",
  "color-primary-hover": "主色悬浮态",
  "color-primary": "品牌主色",
  "color-primary-active": "主色激活态",
  "color-primary-text-hover": "主色文本悬浮态",
  "color-primary-text": "主色文本",
  "color-primary-text-active": "主色文本激活态",

  // Success
  "color-success-bg": "成功色的浅色背景颜色",
  "color-success-bg-hover": "成功色的浅色背景色悬浮",
  "color-success-border": "成功色的描边色",
  "color-success-border-hover": "成功色描边悬浮态",
  "color-success-hover": "成功色的深色悬浮态",
  "color-success": "成功色",
  "color-success-active": "成功色的深色激活态",
  "color-success-text-hover": "成功色的文本悬浮态",
  "color-success-text": "成功色的文本默认态",
  "color-success-text-active": "成功色的文本激活态",

  // Warning
  "color-warning-bg": "警戒色的浅色背景颜色",
  "color-warning-bg-hover": "警戒色的浅色背景色悬浮",
  "color-warning-border": "警戒色的描边色",
  "color-warning-border-hover": "警戒色描边悬浮态",
  "color-warning-hover": "警戒色的深色悬浮态",
  "color-warning": "警戒色",
  "color-warning-active": "警戒色的深色激活态",
  "color-warning-text-hover": "警戒色的文本悬浮态",
  "color-warning-text": "警戒色的文本默认态",
  "color-warning-text-active": "警戒色的文本激活态",

  // Error
  "color-error-bg": "错误色的浅色背景颜色",
  "color-error-bg-hover": "错误色的浅色背景色悬浮",
  "color-error-bg-active": "错误色浅色背景激活态",
  "color-error-border": "错误色的描边色",
  "color-error-border-hover": "错误色描边悬浮态",
  "color-error-hover": "错误色的深色悬浮态",
  "color-error": "错误色",
  "color-error-active": "错误色的深色激活态",
  "color-error-text-hover": "错误色的文本悬浮态",
  "color-error-text": "错误色的文本默认态",
  "color-error-text-active": "错误色的文本激活态",

  // Info
  "color-info-bg": "信息色浅色背景",
  "color-info-bg-hover": "信息色浅色背景悬浮",
  "color-info-border": "信息色描边",
  "color-info-border-hover": "信息色描边悬浮态",
  "color-info-hover": "信息色深色悬浮态",
  "color-info": "信息色",
  "color-info-active": "信息色深色激活态",
  "color-info-text-hover": "信息色文本悬浮态",
  "color-info-text": "信息色文本默认态",
  "color-info-text-active": "信息色文本激活态",

  // Link
  "color-link": "链接色",
  "color-link-hover": "链接色悬浮态",
  "color-link-active": "链接色激活态",

  // Neutral — text
  "color-text": "一级文本色",
  "color-text-secondary": "二级文本色",
  "color-text-tertiary": "三级文本色",
  "color-text-quaternary": "四级文本色",
  // Neutral — border
  "color-border": "一级边框色",
  "color-border-secondary": "二级边框色",
  // Neutral — fill
  "color-fill": "一级填充色",
  "color-fill-secondary": "二级填充色",
  "color-fill-tertiary": "三级填充色",
  "color-fill-quaternary": "四级填充色",
  // Neutral — bg
  "color-bg-base": "基础背景色",
  "color-bg-layout": "布局背景色",
  "color-bg-container": "组件容器背景色",
  "color-bg-elevated": "浮层容器背景色",
  "color-bg-spotlight": "引起注意的背景色",
  "color-bg-solid": "纯实色背景",
  "color-bg-solid-hover": "纯实色背景悬浮态",
  "color-bg-solid-active": "纯实色背景激活态",
  "color-bg-mask": "浮层的背景蒙层颜色",
  "color-border-disabled": "禁用态边框色",
  "color-white": "纯白色",
  "color-shadow": "阴影颜色",

  // Semantic (shadcn)
  background: "全局背景",
  foreground: "全局前景文字",
  card: "卡片背景",
  "card-foreground": "卡片文字",
  popover: "弹出层背景",
  "popover-foreground": "弹出层文字",
  primary: "主色",
  "primary-foreground": "主色上文字",
  secondary: "次要填充",
  "secondary-foreground": "次要填充上文字",
  muted: "低调背景",
  "muted-foreground": "低调文字",
  accent: "强调填充",
  "accent-foreground": "强调填充上文字",
  destructive: "危险色",
  border: "边框",
  input: "输入框边框",
  ring: "焦点环",

  // Sidebar
  sidebar: "侧边栏背景",
  "sidebar-foreground": "侧边栏文字",
  "sidebar-primary": "侧边栏主色",
  "sidebar-primary-foreground": "侧边栏主色上文字",
  "sidebar-accent": "侧边栏强调填充",
  "sidebar-accent-foreground": "侧边栏强调文字",
  "sidebar-border": "侧边栏边框",
  "sidebar-ring": "侧边栏焦点环",

  // Typography
  "font-size-sm": "小号字号",
  "font-size": "默认字号",
  "font-size-lg": "大号字号",
  "font-size-xl": "超大字号",
  "font-size-heading-1": "一级标题字号",
  "font-size-heading-2": "二级标题字号",
  "font-size-heading-3": "三级标题字号",
  "font-size-heading-4": "四级标题字号",
  "font-size-heading-5": "五级标题字号",
  "line-height": "默认行高",
  "line-height-sm": "小号行高",
  "line-height-lg": "大号行高",
  "font-weight-medium": "中等字重",
  "font-weight-semibold": "半粗字重",
  "font-family": "正文字体",
  "font-family-code": "代码字体",

  // Radius
  "border-radius": "基础圆角",
  "border-radius-xs": "XS 号圆角",
  "border-radius-sm": "SM 号圆角",
  "border-radius-lg": "LG 号圆角",
  "border-radius-xl": "XL 号圆角",
  "border-radius-outer": "外圆角",

  // spacing-/padding-/margin-：spacingTokenZh
  // Shadow
  "elevation-sm": "一级阴影",
  elevation: "二级阴影",
  "elevation-md": "三级阴影",
  "elevation-lg": "四级阴影",
  "elevation-inner": "内阴影",

  // Motion
  "motion-duration-fast": "快速动效",
  "motion-duration-150": "过渡动效 150ms",
  "motion-duration-mid": "中速动效",
  "motion-duration-slow": "慢速动效",

  // Border
  "line-width": "线条宽度",
  "line-width-bold": "加粗线条宽度",
  "border-width-hairline": "极细边框",
  "border-width-0": "零边框",
  "ring-width": "焦点环宽度",
  "ring-offset": "焦点环偏移",

  // Opacity
  "opacity-disabled": "禁用透明度",
  "opacity-muted": "低调透明度",
  "opacity-subtle": "微弱透明度",

  // Z-index
  "z-base": "基础层级",
  "z-dropdown": "下拉层级",
  "z-modal": "弹窗层级",
  "z-tooltip": "提示层级",

  // Chart
  "chart-1": "图表色 1",
  "chart-2": "图表色 2",
  "chart-3": "图表色 3",
  "chart-4": "图表色 4",
  "chart-5": "图表色 5",

  "elevation-none": "无阴影",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Seed category definition — maps each seed key to its derived tokens      */
/* ────────────────────────────────────────────────────────────────────────── */

type SeedSection = {
  title: string;
  seedKeys: string[];
  editorType: "color" | "number" | "text";
  mapTokenPrefixes: string[];
  exactTokenIds?: string[];
  mapSubGroups?: { title: string; filter: (id: string) => boolean }[];
};

const SEED_SECTIONS: SeedSection[] = [
  {
    title: "品牌色",
    seedKeys: ["colorPrimary"],
    editorType: "color",
    mapTokenPrefixes: ["color-primary"],
    mapSubGroups: undefined,
  },
  {
    title: "成功色",
    seedKeys: ["colorSuccess"],
    editorType: "color",
    mapTokenPrefixes: ["color-success"],
  },
  {
    title: "警戒色",
    seedKeys: ["colorWarning"],
    editorType: "color",
    mapTokenPrefixes: ["color-warning"],
  },
  {
    title: "错误色",
    seedKeys: ["colorError"],
    editorType: "color",
    mapTokenPrefixes: ["color-error"],
  },
  {
    title: "信息色",
    seedKeys: ["colorInfo"],
    editorType: "color",
    mapTokenPrefixes: ["color-info"],
  },
  {
    title: "链接色",
    seedKeys: ["colorLink"],
    editorType: "color",
    mapTokenPrefixes: ["color-link"],
  },
  {
    title: "中性色",
    seedKeys: ["colorTextBase", "colorBgBase"],
    editorType: "color",
    mapTokenPrefixes: ["color-text", "color-fill", "color-bg", "color-border", "color-white", "color-shadow"],
    mapSubGroups: [
      { title: "文本", filter: (id) => id.startsWith("color-text") },
      { title: "描边", filter: (id) => id.startsWith("color-border") },
      { title: "填充", filter: (id) => id.startsWith("color-fill") },
      { title: "背景", filter: (id) => id.startsWith("color-bg") },
      { title: "其他", filter: (id) => id === "color-white" || id === "color-shadow" },
    ],
  },
  {
    title: "语义色映射",
    seedKeys: [],
    editorType: "color",
    mapTokenPrefixes: [],
    exactTokenIds: [
      "background", "foreground", "card", "card-foreground",
      "popover", "popover-foreground", "primary", "primary-foreground",
      "secondary", "secondary-foreground", "muted", "muted-foreground",
      "accent", "accent-foreground", "destructive",
      "border", "input", "ring",
    ],
  },
  {
    title: "侧边栏色",
    seedKeys: [],
    editorType: "color",
    mapTokenPrefixes: ["sidebar"],
  },
  {
    title: "图表色",
    seedKeys: [],
    editorType: "color",
    mapTokenPrefixes: ["chart-"],
  },
  {
    title: "文字",
    seedKeys: ["fontSize"],
    editorType: "number",
    mapTokenPrefixes: ["font-size", "line-height", "font-weight", "font-family"],
    mapSubGroups: [
      { title: "字号", filter: (id) => id.startsWith("font-size") },
      { title: "行高", filter: (id) => id.startsWith("line-height") },
      { title: "字重", filter: (id) => id.startsWith("font-weight") },
      { title: "字体", filter: (id) => id.startsWith("font-family") },
    ],
  },
  {
    title: "间距",
    seedKeys: ["sizeStep", "sizeUnit"],
    editorType: "number",
    mapTokenPrefixes: ["spacing-"],
  },
  {
    title: "圆角",
    seedKeys: ["borderRadius"],
    editorType: "number",
    mapTokenPrefixes: ["border-radius"],
  },
  {
    title: "阴影",
    seedKeys: [],
    editorType: "text",
    mapTokenPrefixes: ["elevation"],
  },
  {
    title: "动效",
    seedKeys: ["motionUnit", "motionBase"],
    editorType: "number",
    mapTokenPrefixes: ["motion-duration"],
  },
  {
    title: "边框",
    seedKeys: ["lineWidth"],
    editorType: "number",
    mapTokenPrefixes: ["line-width", "border-width", "ring-width", "ring-offset"],
  },
  {
    title: "透明度",
    seedKeys: [],
    editorType: "number",
    mapTokenPrefixes: ["opacity"],
  },
  {
    title: "层级",
    seedKeys: ["zIndexBase", "zIndexPopupBase"],
    editorType: "number",
    mapTokenPrefixes: ["z-"],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Inline color swatch                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function isColor(v: string): boolean {
  if (!v) return false;
  return /^(#|rgb|rgba|hsl|hsla|oklch|oklab)/.test(v.trim());
}

function ColorSwatch({ value, size = 32 }: { value: string; size?: number }) {
  const transparent = !value || !isColor(value);
  return (
    <div
      className="shrink-0 rounded border border-border"
      style={{
        width: size,
        height: size,
        background: transparent
          ? "repeating-conic-gradient(#e5e7eb 0% 25%,transparent 0% 50%) 0 0 / 8px 8px"
          : value,
      }}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Derived token row                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/** spacing / padding / margin 数字档行文案 */
function spacingTokenZh(id: string): string {
  const m = id.match(/^(spacing|space|padding|margin)-(.+)$/);
  if (!m) return "";
  const [, kind, rawSuf] = m;
  const suffix = rawSuf.replace(/\\\./g, ".");
  const labels = spacingScale.stepLabels as SpacingStepLabelJson[];
  const row = labels.find((l) => l.suffix === suffix);
  const pair = row ? `${row.zh} / ${row.en}` : null;
  const kindHint = kind === "padding" ? "padding" : kind === "margin" ? "margin" : "spacing";
  if (pair) return `${kindHint} · ${pair}`;
  return `${kindHint} · ${suffix}`;
}

function MapTokenRow({
  token,
  darkMode,
  onEdit,
}: {
  token: DesignTokenEntry;
  darkMode?: boolean;
  onEdit?: (t: DesignTokenEntry) => void;
}) {
  const zh = TOKEN_ZH[token.id] ?? spacingTokenZh(token.id);
  const val = darkMode ? token.dark : token.light;
  const color = isColor(val);

  return (
    <div
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onClick={onEdit ? () => onEdit(token) : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit(token);
              }
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors",
        onEdit && "cursor-pointer",
      )}
    >
      <span className="min-w-0 flex-1 text-sm text-foreground truncate">
        {zh ? <>{zh} <span className="text-muted-foreground">{token.id}</span></> : token.id}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums max-w-[140px] truncate text-right" title={val}>
        {val}
      </span>
      {color ? (
        <ColorSwatch value={val} size={28} />
      ) : /^\d/.test(val) && (val.endsWith("px") || !val.includes(" ")) ? (
        <div
          className="shrink-0 rounded bg-primary/20 border border-primary/30"
          style={{
            width: Math.min(Math.max(parseFloat(val) || 0, 4), 48),
            height: 28,
          }}
        />
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Collapsible sub-group within map tokens                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function MapSubGroup({
  title,
  tokens,
  darkMode,
  onTokenEdit,
}: {
  title: string;
  tokens: DesignTokenEntry[];
  darkMode?: boolean;
  onTokenEdit?: (t: DesignTokenEntry) => void;
}) {
  const [open, setOpen] = React.useState(true);
  if (!tokens.length) return null;
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && tokens.map((t) => <MapTokenRow key={t.id} token={t} darkMode={darkMode} onEdit={onTokenEdit} />)}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Seed editor controls (inline in the card header)                         */
/* ────────────────────────────────────────────────────────────────────────── */

function SeedColorInput({
  seedKey,
  displayLabel,
  value,
  onChange,
}: {
  seedKey: string;
  displayLabel: string;
  value: string;
  onChange: (seedKey: string, val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground min-w-0 max-w-[220px] leading-snug">{displayLabel}</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2">
        <input
          type="color"
          value={value.startsWith("#") ? value.slice(0, 7) : "#000000"}
          onChange={(e) => onChange(seedKey, e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(seedKey, e.target.value)}
          className="w-24 border-0 bg-transparent font-mono text-sm text-foreground outline-none"
        />
      </div>
    </div>
  );
}

function SeedNumberInput({
  seedKey,
  displayLabel,
  value,
  onChange,
}: {
  seedKey: string;
  displayLabel: string;
  value: number | string;
  onChange: (seedKey: string, val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground min-w-0 max-w-[220px] leading-snug">{displayLabel}</span>
      <input
        type="number"
        value={value}
        step="any"
        onChange={(e) => onChange(seedKey, e.target.value)}
        className="w-24 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Seed section card                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function SeedSectionCard({
  section,
  seeds,
  allTokens,
  onSeedChange,
  darkMode,
  onTokenEdit,
}: {
  section: SeedSection;
  seeds: Record<string, string | number>;
  allTokens: DesignTokenEntry[];
  onSeedChange: (seedKey: string, value: string) => void;
  darkMode?: boolean;
  onTokenEdit?: (t: DesignTokenEntry) => void;
}) {
  const [mapOpen, setMapOpen] = React.useState(false);

  const mapTokens = React.useMemo(() => {
    const exactSet = section.exactTokenIds ? new Set(section.exactTokenIds) : null;
    return allTokens.filter((t) => {
      if (t.category === "seed") return false;
      if (exactSet?.has(t.id)) return true;
      return section.mapTokenPrefixes.some((prefix) => t.id.startsWith(prefix));
    });
  }, [allTokens, section.mapTokenPrefixes, section.exactTokenIds]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header: title left, controls right, vertically centered */}
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <h3 className="shrink-0 text-sm font-medium text-foreground">{section.title}</h3>
        {section.seedKeys.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-4">
            {section.seedKeys.map((key) => {
              const val = seeds[key];
              if (val === undefined) return null;
              const displayLabel = key;
              if (section.editorType === "color") {
                return (
                  <SeedColorInput
                    key={key}
                    seedKey={key}
                    displayLabel={displayLabel}
                    value={String(val)}
                    onChange={onSeedChange}
                  />
                );
              }
              return (
                <SeedNumberInput
                  key={key}
                  seedKey={key}
                  displayLabel={displayLabel}
                  value={val}
                  onChange={onSeedChange}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Map tokens collapsible */}
      {mapTokens.length > 0 && (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
            onClick={() => setMapOpen(!mapOpen)}
          >
            {mapOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>梯度变量 Map Token</span>
            <span className="ml-auto text-xs tabular-nums">{mapTokens.length}</span>
          </button>
          {mapOpen && (
            <div className="border-t border-border/50 bg-muted/5">
              {section.mapSubGroups ? (
                section.mapSubGroups.map((sg) => {
                  const filtered = mapTokens.filter((t) => sg.filter(t.id));
                  return (
                    <MapSubGroup
                      key={sg.title}
                      title={sg.title}
                      tokens={filtered}
                      darkMode={darkMode}
                      onTokenEdit={onTokenEdit}
                    />
                  );
                })
              ) : (
                mapTokens.map((t) => (
                  <MapTokenRow key={t.id} token={t} darkMode={darkMode} onEdit={onTokenEdit} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Public API                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export type DesignTokenShowcaseProps = {
  embedded?: boolean;
  liveTokens?: DesignTokenEntry[] | null;
  seeds?: Record<string, string | number>;
  onSeedChange?: (seedKey: string, value: string) => void;
  darkMode?: boolean;
  /** 点击梯度变量行：按当前 darkMode 写入 mapOverrides.light / .dark */
  onTokenEdit?: (token: DesignTokenEntry) => void;
  onColorPick?: (token: DesignTokenEntry, field: "light" | "dark") => void;
  colorSelection?: { tokenId: string; field: "light" | "dark" } | null;
};

export function DesignTokenShowcase({
  embedded,
  liveTokens,
  seeds,
  onSeedChange,
  darkMode,
  onTokenEdit,
}: DesignTokenShowcaseProps) {
  const allTokens = liveTokens ?? [];
  const seedMap = seeds ?? {};
  const handleSeedChange = onSeedChange ?? (() => {});

  return (
    <div
      className={cn(
        // 暗色下不用 semantic background（#000），与 Storybook Docs / 预览 iframe 画布一致（#1c1c1e）
        "w-full min-w-0 bg-background text-foreground dark:bg-[#1c1c1e]",
        embedded ? "" : "min-h-screen px-4 py-8 sm:px-6 lg:px-8",
      )}
    >
      <div className="flex w-full min-w-0 flex-col gap-5">
        {SEED_SECTIONS.map((section) => (
          <SeedSectionCard
            key={section.title}
            section={section}
            seeds={seedMap}
            allTokens={allTokens}
            onSeedChange={handleSeedChange}
            darkMode={darkMode}
            onTokenEdit={onTokenEdit}
          />
        ))}
      </div>
    </div>
  );
}
