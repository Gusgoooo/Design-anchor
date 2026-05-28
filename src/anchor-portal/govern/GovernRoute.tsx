import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileWarning,
  Palette,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";

/**
 * Govern tab
 *
 * Product stance:
 * - Migration phase: clean up an existing project and reduce design-system debt.
 * - Steady state: observe component adoption, token baseline, and AI contract freshness.
 */

type AuditStatus = {
  ok: boolean;
  scope?: "app" | "kit" | "portal" | "all";
  ranAt?: string;
  passed?: boolean;
  scanned?: number;
  issueCount?: number;
  issues?: Array<{ scope?: "app" | "kit" | "portal"; file: string; line: number; message: string }>;
  profiles?: Array<{ scope: "app" | "kit" | "portal"; passed: boolean; scanned: number; issueCount: number }>;
  truncated?: boolean;
  error?: string;
};

type ComponentUsage = {
  ok: boolean;
  total?: number;
  used?: number;
  unused?: number;
  coverage?: number;
  totalReferences?: number;
  scannedFiles?: number;
  projectRoot?: string;
  anchorRoot?: string;
  importKinds?: { designAlias?: number; baseDeep?: number; jsxDetected?: number };
  top?: Array<ComponentUsageRow>;
  components?: Array<ComponentUsageRow>;
  error?: string;
};

type ComponentUsageRow = {
  id?: string;
  name: string;
  usage: number;
  files: string[];
  origin?: "kit" | "user-import" | string;
  specId?: string;
  specFile?: string;
};

type TokenSummary = {
  ok: boolean;
  status?: "ready" | "stale" | "missing";
  version?: number | null;
  seedCount?: number;
  darkOverrideCount?: number;
  customSeedCount?: number;
  overrideCount?: number;
  chartSeedCount?: number;
  spacingStopCount?: number;
  cssVarCount?: number;
  anchorMirrorCount?: number;
  colorVarCount?: number;
  radiusVarCount?: number;
  fontVarCount?: number;
  updatedAt?: number | null;
  generatedAt?: number | null;
  generatedStale?: boolean;
  seeds?: {
    colorPrimary?: string;
    colorBgBase?: string;
    colorTextBase?: string;
    fontSize?: string | number;
    borderRadius?: string | number;
    sizeUnit?: string | number;
  };
  error?: string;
};

type GovernanceStatus = {
  ok: boolean;
  tokensMtime?: number;
  files?: Array<{ id: string; label: string; path: string; present: boolean; mtime?: number; stale?: boolean }>;
  mcpToolCount?: number | null;
  presentCount?: number;
  missingCount?: number;
  staleCount?: number;
  error?: string;
};

type SetupStatus = {
  configured?: boolean;
  mode?: "preset" | "default" | "import" | "empty";
  componentSource?: "owned" | "default" | "empty";
  projectMode?: "new" | "existing";
  baseline?: string;
  preset?: string;
  startIntent?: "ai-coding" | string;
  imported?: string[];
  importedFrom?: string;
  importMode?: string;
  error?: string;
};

function useGovernData() {
  const [audit, setAudit] = React.useState<AuditStatus | null>(null);
  const [usage, setUsage] = React.useState<ComponentUsage | null>(null);
  const [tokens, setTokens] = React.useState<TokenSummary | null>(null);
  const [governance, setGovernance] = React.useState<GovernanceStatus | null>(null);
  const [setup, setSetup] = React.useState<SetupStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [lastFetched, setLastFetched] = React.useState<Date | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, u, tk, g, s] = await Promise.all([
        fetch("/api/audit-status?scope=all").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
        fetch("/api/component-usage").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
        fetch("/api/token-summary").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
        fetch("/api/governance-status").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
        fetch("/api/setup-status").then((r) => r.json()).catch((e) => ({ configured: true, error: String(e) })),
      ]);
      setAudit(a);
      setUsage(u);
      setTokens(tk);
      setGovernance(g);
      setSetup(s);
      setLastFetched(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return { audit, usage, tokens, governance, setup, loading, lastFetched, refresh };
}

function relativeTime(date: Date | null, locale: "en" | "zh"): string {
  if (!date) return "—";
  const diff = Math.max(0, Date.now() - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return locale === "zh" ? "刚刚" : "just now";
  if (sec < 60) return locale === "zh" ? `${sec} 秒前` : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return locale === "zh" ? `${min} 分钟前` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return locale === "zh" ? `${hr} 小时前` : `${hr}h ago`;
  return date.toLocaleString();
}

function formatDate(ms: number | null | undefined, locale: "en" | "zh") {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}

export function GovernRoute() {
  const { t, locale } = useLocale();
  const { audit, usage, tokens, governance, setup, loading, lastFetched, refresh } = useGovernData();

  return (
    <div className="h-full w-full overflow-y-auto bg-muted/30 dark:bg-background/40">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">
              {t({ en: "Project Health", zh: "项目健康" })}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t({
                en: "First migrate existing projects. Then keep default-library adoption, token baseline, and AI contracts observable.",
                zh: "先治理存量项目；进入稳定期后，重点观测默认组件库采用、Token 基线与 AI 契约状态。",
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <span>
              {t({ en: "Last scan:", zh: "上次扫描：" })} {relativeTime(lastFetched, locale)}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {t({ en: "Refresh", zh: "刷新" })}
            </button>
          </div>
        </header>

        <KpiStrip audit={audit} usage={usage} tokens={tokens} governance={governance} />

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <UsageTable usage={usage} className="xl:col-span-2" />
          <TokenHealth tokens={tokens} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <MigrationBacklog audit={audit} setup={setup} className="xl:col-span-2" />
          <AiContractHealth governance={governance} />
        </div>
      </div>
    </div>
  );
}

function projectModeFromSetup(setup: SetupStatus | null): "new" | "existing" {
  if (setup?.projectMode === "new" || setup?.mode === "empty") return "new";
  return "existing";
}

function componentSourceLabel(setup: SetupStatus | null, locale: "en" | "zh") {
  if (setup?.mode === "preset") {
    return locale === "zh" ? "Preset + anchor-ui 组件" : "Preset + anchor-ui source";
  }
  if (setup?.componentSource === "owned" || setup?.mode === "import") {
    return locale === "zh" ? "自有组件库" : "Owned library";
  }
  if (setup?.componentSource === "empty" || setup?.mode === "empty") {
    return locale === "zh" ? "空组件库" : "Tokens only";
  }
  return locale === "zh" ? "anchor-ui 组件源码" : "anchor-ui source";
}

function presetLabel(id: string | undefined) {
  if (!id) return "—";
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function baselineLabel(setup: SetupStatus | null) {
  if (setup?.preset) return presetLabel(setup.preset);
  if (setup?.baseline === "tailwind-default") return "Tailwind Default";
  return null;
}


function MetricPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 text-muted-foreground">
      <span>{label}</span>
      <strong className="font-semibold text-foreground tabular-nums">{value}</strong>
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneRing =
    tone === "bad"
      ? "ring-destructive/30"
      : tone === "good"
        ? "ring-primary/25"
        : tone === "warn"
          ? "ring-border"
          : "ring-border";
  const toneIcon =
    tone === "bad"
      ? "text-destructive"
      : tone === "good"
        ? "text-primary"
        : tone === "warn"
          ? "text-foreground"
          : "text-muted-foreground";
  return (
    <div className={cn("rounded-xl bg-background p-4 ring-1", toneRing)}>
      <div className={cn("mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground", toneIcon)}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-1 text-sm text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function KpiStrip({
  audit,
  usage,
  tokens,
  governance,
}: {
  audit: AuditStatus | null;
  usage: ComponentUsage | null;
  tokens: TokenSummary | null;
  governance: GovernanceStatus | null;
}) {
  const { t } = useLocale();
  const auditTone = !audit?.ok ? "neutral" : audit.passed ? "good" : "bad";
  const auditValue = !audit?.ok ? "—" : audit.passed ? "0" : String(audit.issueCount ?? 0);
  const auditSub = !audit?.ok
    ? t({ en: "audit unavailable", zh: "audit 不可用" })
    : audit.passed
      ? t({ en: "steady state", zh: "稳定态" })
      : t({ en: "migration backlog", zh: "存量迁移债务" });

  const usageTone = !usage?.ok ? "neutral" : (usage.used ?? 0) > 0 ? "good" : "warn";
  const tokenTone = !tokens?.ok
    ? "neutral"
    : tokens.status === "missing"
      ? "bad"
      : tokens.generatedStale
        ? "warn"
        : "good";
  const govTone = !governance?.ok
    ? "neutral"
    : (governance.missingCount ?? 0) > 0
      ? "bad"
      : (governance.staleCount ?? 0) > 0
        ? "warn"
        : "good";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        icon={<ShieldCheck size={12} />}
        label={t({ en: "Migration debt", zh: "待治理问题" })}
        value={auditValue}
        sub={auditSub}
        tone={auditTone}
      />
      <KpiCard
        icon={<Wrench size={12} />}
        label={t({ en: "Component adoption", zh: "组件采用" })}
        value={usage?.ok ? `${usage.used ?? 0} / ${usage.total ?? 0}` : "—"}
        sub={
          usage?.ok
            ? t({
                en: `${usage.totalReferences ?? 0} refs · ${usage.scannedFiles ?? 0} files`,
                zh: `${usage.totalReferences ?? 0} 次引用 · ${usage.scannedFiles ?? 0} 个文件`,
              })
            : t({ en: "scan unavailable", zh: "扫描不可用" })
        }
        tone={usageTone}
      />
      <KpiCard
        icon={<Palette size={12} />}
        label={t({ en: "Token baseline", zh: "Token 基线" })}
        value={tokens?.ok ? String(tokens.seedCount ?? 0) : "—"}
        sub={
          tokens?.ok
            ? tokens.generatedStale
              ? t({ en: "generated CSS is stale", zh: "生成 CSS 已过期" })
              : t({
                  en: `${tokens.cssVarCount ?? 0} vars · ${tokens.spacingStopCount ?? 0} spacing`,
                  zh: `${tokens.cssVarCount ?? 0} 个变量 · ${tokens.spacingStopCount ?? 0} 个间距档位`,
                })
            : t({ en: "token scan unavailable", zh: "Token 扫描不可用" })
        }
        tone={tokenTone}
      />
      <KpiCard
        icon={<ExternalLink size={12} />}
        label={t({ en: "AI contract", zh: "AI 契约" })}
        value={
          governance?.ok
            ? `${governance.presentCount ?? 0} / ${(governance.presentCount ?? 0) + (governance.missingCount ?? 0)}`
            : "—"
        }
        sub={
          governance?.ok
            ? t({
                en: `${governance.mcpToolCount ?? 0} MCP tools · ${governance.staleCount ?? 0} stale`,
                zh: `${governance.mcpToolCount ?? 0} 个 MCP 工具 · ${governance.staleCount ?? 0} 个过期`,
              })
            : t({ en: "contract scan unavailable", zh: "契约扫描不可用" })
        }
        tone={govTone}
      />
    </div>
  );
}

function UsageTable({ usage, className }: { usage: ComponentUsage | null; className?: string }) {
  const { t } = useLocale();
  const [filter, setFilter] = React.useState<"all" | "used" | "unused">("used");
  const [showAll, setShowAll] = React.useState(false);

  if (!usage?.ok) {
    return (
      <div className={cn("rounded-xl bg-background p-4 ring-1 ring-border", className)}>
        <h3 className="text-sm font-semibold text-foreground">
          {t({ en: "Component adoption", zh: "组件采用" })}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {usage?.error ?? t({ en: "Loading…", zh: "加载中…" })}
        </p>
      </div>
    );
  }

  const sorted = [...(usage.components ?? [])].sort((a, b) => b.usage - a.usage);
  const filtered = sorted.filter((c) =>
    filter === "all" ? true : filter === "used" ? c.usage > 0 : c.usage === 0,
  );
  const visible = showAll ? filtered : filtered.slice(0, 12);

  return (
    <section className={cn("flex flex-col rounded-xl bg-background p-4 ring-1 ring-border", className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t({ en: "Component adoption", zh: "组件采用" })}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t({
              en: `${usage.coverage ?? 0}% coverage · ${(usage.unused ?? 0)} unused components`,
              zh: `${usage.coverage ?? 0}% 采用率 · ${(usage.unused ?? 0)} 个未使用组件`,
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] bg-muted p-0.5 text-sm">
          {(["used", "all", "unused"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setFilter(k);
                setShowAll(false);
              }}
              className={cn(
                "rounded-[max(2px,calc(var(--radius-md)-var(--spacing-1)))] px-2 py-0.5 font-medium transition-colors",
                filter === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t({
                en: k === "all" ? "All" : k === "used" ? "Used" : "Unused",
                zh: k === "all" ? "全部" : k === "used" ? "使用中" : "未使用",
              })}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <MetricPill label={t({ en: "refs", zh: "引用" })} value={usage.totalReferences ?? 0} />
        <MetricPill label={t({ en: "files", zh: "文件" })} value={usage.scannedFiles ?? 0} />
        <MetricPill label={t({ en: "@design", zh: "@design" })} value={usage.importKinds?.designAlias ?? 0} />
        <MetricPill label={t({ en: "deep imports", zh: "深层引用" })} value={usage.importKinds?.baseDeep ?? 0} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t({ en: "Component", zh: "组件" })}</th>
              <th className="px-3 py-2 text-left font-medium">{t({ en: "Library", zh: "库" })}</th>
              <th className="px-3 py-2 text-right font-medium">{t({ en: "Files", zh: "文件数" })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((c) => (
              <tr key={c.id ?? c.name} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      aria-label={c.origin === "user-import" ? "Imported component" : "Default library component"}
                      className={cn(
                        "inline-block h-1.5 w-1.5 rounded-full",
                        c.origin === "user-import" ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                    {c.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {c.origin === "user-import"
                    ? t({ en: "Imported", zh: "已导入" })
                    : t({ en: "Default library", zh: "默认组件库" })}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">
                  {c.usage === 0 ? <span className="text-muted-foreground">0</span> : c.usage}
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                  {t({ en: "No matching components.", zh: "没有匹配的组件" })}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {filtered.length > 12 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 inline-flex items-center justify-center gap-1 self-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronDown size={11} className={showAll ? "rotate-180" : ""} />
          {showAll
            ? t({ en: "Collapse", zh: "收起" })
            : t({ en: `Show all ${filtered.length}`, zh: `展开全部 ${filtered.length}` })}
        </button>
      ) : null}
    </section>
  );
}

function TokenHealth({ tokens }: { tokens: TokenSummary | null }) {
  const { t, locale } = useLocale();

  if (!tokens?.ok) {
    return (
      <section className="rounded-xl bg-background p-4 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-foreground">
          {t({ en: "Token baseline", zh: "Token 基线" })}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {tokens?.error ?? t({ en: "Loading…", zh: "加载中…" })}
        </p>
      </section>
    );
  }

  const statusText = tokens.status === "missing"
    ? t({ en: "missing", zh: "缺失" })
    : tokens.generatedStale
      ? t({ en: "stale", zh: "过期" })
      : t({ en: "ready", zh: "可用" });

  const metrics = [
    { label: t({ en: "Seed tokens", zh: "Seed token" }), value: tokens.seedCount ?? 0 },
    { label: t({ en: "Dark overrides", zh: "暗色覆盖" }), value: tokens.darkOverrideCount ?? 0 },
    { label: t({ en: "Custom seeds", zh: "自定义 seed" }), value: tokens.customSeedCount ?? 0 },
    { label: t({ en: "Map overrides", zh: "Map 覆盖" }), value: tokens.overrideCount ?? 0 },
    { label: t({ en: "CSS vars", zh: "CSS 变量" }), value: tokens.cssVarCount ?? 0 },
    { label: t({ en: "Spacing stops", zh: "间距档位" }), value: tokens.spacingStopCount ?? 0 },
  ];

  return (
    <section className="rounded-xl bg-background p-4 ring-1 ring-border">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t({ en: "Token baseline", zh: "Token 基线" })}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t({
              en: `v${tokens.version ?? "?"} · generated ${formatDate(tokens.generatedAt, locale)}`,
              zh: `v${tokens.version ?? "?"} · 生成于 ${formatDate(tokens.generatedAt, locale)}`,
            })}
          </p>
        </div>
        <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-sm font-medium text-foreground">
          {statusText}
        </span>
      </header>

      <dl className="mt-4 divide-y divide-border text-sm">
        {metrics.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-semibold text-foreground tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-border pt-3">
        <h4 className="text-sm font-medium text-foreground">
          {t({ en: "Key seeds", zh: "关键 seed" })}
        </h4>
        <div className="mt-2 space-y-2 text-sm">
          <SeedValue label="colorPrimary" value={tokens.seeds?.colorPrimary} swatch />
          <SeedValue label="colorBgBase" value={tokens.seeds?.colorBgBase} swatch />
          <SeedValue label="colorTextBase" value={tokens.seeds?.colorTextBase} swatch />
          <SeedValue label="borderRadius" value={tokens.seeds?.borderRadius} />
          <SeedValue label="sizeUnit" value={tokens.seeds?.sizeUnit} />
        </div>
      </div>
    </section>
  );
}

function SeedValue({ label, value, swatch = false }: { label: string; value: unknown; swatch?: boolean }) {
  const displayValue = value == null || value === "" ? "—" : String(value);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-2 font-mono text-foreground">
        {swatch && value ? (
          <span
            className="h-4 w-4 shrink-0 rounded border border-border"
            style={{ background: String(value) }}
          />
        ) : null}
        <span className="truncate">{displayValue}</span>
      </span>
    </div>
  );
}

function AiContractHealth({ governance }: { governance: GovernanceStatus | null }) {
  const { t } = useLocale();
  if (!governance?.ok) {
    return (
      <section className="rounded-xl bg-background p-4 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-foreground">
          {t({ en: "AI contract", zh: "AI 契约" })}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {governance?.error ?? t({ en: "Loading…", zh: "加载中…" })}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-background p-4 ring-1 ring-border">
      <h3 className="text-sm font-semibold text-foreground">
        {t({ en: "AI contract", zh: "AI 契约" })}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t({
          en: "Generated rule files and MCP tools that keep future AI code aligned.",
          zh: "让后续 AI 生码保持一致的规则文件与 MCP 工具。",
        })}
      </p>
      <ul className="mt-3 space-y-1.5">
        {(governance.files ?? []).map((f) => {
          const Icon = !f.present ? AlertCircle : f.stale ? FileWarning : CheckCircle2;
          const toneClass = !f.present || f.stale ? "text-destructive" : "text-primary";
          return (
            <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Icon size={12} className={cn("shrink-0", toneClass)} />
                <code className="truncate text-foreground/85" title={f.path}>{f.label}</code>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {!f.present
                  ? t({ en: "missing", zh: "缺失" })
                  : f.stale
                    ? t({ en: "stale", zh: "过期" })
                    : t({ en: "ok", zh: "ok" })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MigrationBacklog({
  audit,
  setup,
  className,
}: {
  audit: AuditStatus | null;
  setup: SetupStatus | null;
  className?: string;
}) {
  const { t } = useLocale();
  const profiles = audit?.profiles ?? [];
  const isNewProject = projectModeFromSetup(setup) === "new";
  if (!audit?.ok || audit.passed || !audit.issues?.length) {
    if (audit?.passed) {
      return (
        <section className={cn("rounded-xl bg-background p-4 ring-1 ring-border", className)}>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 size={14} className="text-primary" />
            {isNewProject
              ? t({ en: "Health baseline is ready", zh: "健康基线已就绪" })
              : t({ en: "Migration backlog cleared", zh: "存量治理 backlog 已清空" })}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isNewProject
              ? t({
                  en: "As the product grows, this section will surface drift that needs review instead of pretending empty usage is a problem.",
                  zh: "产品开始生长后，这里会展示需要关注的漂移项；空采用不是问题，它只是起点。",
                })
              : t({
                  en: "Keep the audit quiet while the daily view shifts to component adoption and token baseline.",
                  zh: "后续让 audit 保持安静，日常关注组件采用和 Token 基线即可。",
                })}
          </p>
          {profiles.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profiles.map((profile) => (
                <span key={profile.scope} className="rounded-md bg-muted/40 px-2 py-1 text-sm text-muted-foreground ring-1 ring-border">
                  {profile.scope}: {profile.scanned}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      );
    }
    return null;
  }

  return (
    <section className={cn("rounded-xl bg-background p-4 ring-1 ring-destructive/30", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertCircle size={14} />
        {t({ en: `${audit.issueCount} migration issue(s)`, zh: `${audit.issueCount} 项存量治理问题` })}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t({
          en: "Run confirmed auto-fix for safe token and spacing cases, then review the remaining product decisions manually.",
          zh: "对安全的 token、间距等问题执行确认式自动修复，剩余需要产品判断的项人工处理。",
        })}
      </p>
      {profiles.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profiles.map((profile) => (
            <span
              key={profile.scope}
              className={cn(
                "rounded-md px-2 py-1 text-sm ring-1",
                profile.passed
                  ? "bg-muted/40 text-muted-foreground ring-border"
                  : "bg-destructive/10 text-destructive ring-destructive/30",
              )}
            >
              {profile.scope}: {profile.issueCount} / {profile.scanned}
            </span>
          ))}
        </div>
      ) : null}
      <ul className="mt-3 space-y-1.5">
        {audit.issues!.map((iss, i) => (
          <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <div className="font-mono text-foreground">
              {iss.scope ? `[${iss.scope}] ` : null}{iss.file}:{iss.line}
            </div>
            <div className="mt-0.5 text-muted-foreground">{iss.message}</div>
          </li>
        ))}
      </ul>
      {audit.truncated ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t({ en: "Issue list truncated. Run the CLI with --max-issues for the full output.", zh: "治理问题列表已截断。可用 CLI 加 --max-issues 查看完整输出。" })}
        </p>
      ) : null}
    </section>
  );
}
