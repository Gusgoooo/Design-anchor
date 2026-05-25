import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileWarning,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";

/**
 * Govern tab — the differentiation surface vs shadcn-style theme generators.
 * Three sections, all driven by Vite middleware endpoints:
 *   • KPI strip   — health at a glance (audit / usage / token count / MCP)
 *   • Usage table — which kit components the project actually consumes
 *   • Treaty list — generated AI rule files + freshness check
 *
 * Every endpoint is read-only. Refreshing the tab re-runs the audit (and the
 * scans) so the surface is always live, never cached.
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
  scannedFiles?: number;
  components?: Array<{ name: string; usage: number; files: string[]; origin?: "kit" | "user-import" }>;
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

function useGovernData() {
  const [audit, setAudit] = React.useState<AuditStatus | null>(null);
  const [usage, setUsage] = React.useState<ComponentUsage | null>(null);
  const [governance, setGovernance] = React.useState<GovernanceStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [lastFetched, setLastFetched] = React.useState<Date | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, u, g] = await Promise.all([
        fetch("/api/audit-status?scope=all").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
        fetch("/api/component-usage").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
        fetch("/api/governance-status").then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) })),
      ]);
      setAudit(a);
      setUsage(u);
      setGovernance(g);
      setLastFetched(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return { audit, usage, governance, loading, lastFetched, refresh };
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

export function GovernRoute() {
  const { t, locale } = useLocale();
  const { audit, usage, governance, loading, lastFetched, refresh } = useGovernData();

  return (
    <div className="h-full w-full overflow-y-auto bg-muted/30 dark:bg-background/40">
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {t({ en: "Govern", zh: "治理" })}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t({
                en: "Project-wide compliance, component usage, and AI rule freshness.",
                zh: "项目全局合规、组件使用情况、AI 规则新鲜度",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

        <KpiStrip audit={audit} usage={usage} governance={governance} />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <UsageTable usage={usage} className="lg:col-span-2" />
          <TreatyHealth governance={governance} />
        </div>

        <ViolationsList audit={audit} className="mt-4" />
      </div>
    </div>
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
    tone === "good"
      ? "ring-emerald-500/30"
      : tone === "warn"
        ? "ring-amber-500/30"
        : tone === "bad"
          ? "ring-rose-500/30"
          : "ring-border";
  const toneIcon =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "text-rose-600 dark:text-rose-400"
          : "text-muted-foreground";
  return (
    <div className={cn("rounded-xl bg-background p-4 ring-1", toneRing)}>
      <div className={cn("mb-2 flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-muted-foreground", toneIcon)}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-1 text-sm text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function KpiStrip({
  audit,
  usage,
  governance,
}: {
  audit: AuditStatus | null;
  usage: ComponentUsage | null;
  governance: GovernanceStatus | null;
}) {
  const { t } = useLocale();
  const auditTone = !audit?.ok ? "neutral" : audit.passed ? "good" : "bad";
  const auditValue = !audit?.ok ? "—" : audit.passed ? "0" : String(audit.issueCount ?? 0);
  const auditSub = !audit?.ok
    ? t({ en: "audit unavailable", zh: "audit 不可用" })
    : audit.passed
      ? t({
          en: `${audit.scanned} files · ${(audit.profiles ?? []).length || 1} scope(s)`,
          zh: `${audit.scanned} 个文件 · ${(audit.profiles ?? []).length || 1} 个范围`,
        })
      : t({
          en: `${audit.issueCount} issue(s) · ${(audit.profiles ?? []).length || 1} scope(s)`,
          zh: `${audit.issueCount} 项违规 · ${(audit.profiles ?? []).length || 1} 个范围`,
        });

  const usageTone = !usage?.ok ? "neutral" : usage.used && usage.used > 0 ? "good" : "warn";
  const govTone = !governance?.ok
    ? "neutral"
    : governance.missingCount! > 0
      ? "bad"
      : governance.staleCount! > 0
        ? "warn"
        : "good";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        icon={<ShieldCheck size={11} />}
        label={t({ en: "Violations", zh: "违规数" })}
        value={auditValue}
        sub={auditSub}
        tone={auditTone}
      />
      <KpiCard
        icon={<Wrench size={11} />}
        label={t({ en: "Components in use", zh: "使用中的组件" })}
        value={
          usage?.ok
            ? `${usage.used ?? 0} / ${usage.total ?? 0}`
            : "—"
        }
        sub={
          usage?.ok
            ? t({
                en: `${usage.scannedFiles ?? 0} files scanned · ${usage.unused ?? 0} unused`,
                zh: `扫描 ${usage.scannedFiles ?? 0} 个文件 · ${usage.unused ?? 0} 个未使用`,
              })
            : t({ en: "scan unavailable", zh: "扫描不可用" })
        }
        tone={usageTone}
      />
      <KpiCard
        icon={<FileWarning size={11} />}
        label={t({ en: "AI rule files", zh: "AI 规则文件" })}
        value={
          governance?.ok
            ? `${governance.presentCount ?? 0} / ${(governance.presentCount ?? 0) + (governance.missingCount ?? 0)}`
            : "—"
        }
        sub={
          governance?.ok
            ? governance.staleCount
              ? t({ en: `${governance.staleCount} stale (older than tokens.json)`, zh: `${governance.staleCount} 个过期（早于 tokens.json）` })
              : t({ en: "all up-to-date", zh: "全部最新" })
            : t({ en: "—", zh: "—" })
        }
        tone={govTone}
      />
      <KpiCard
        icon={<ExternalLink size={11} />}
        label={t({ en: "MCP tools", zh: "MCP 工具" })}
        value={governance?.ok && governance.mcpToolCount != null ? String(governance.mcpToolCount) : "—"}
        sub={t({ en: "exposed to AI agents", zh: "可被 AI agent 调用" })}
        tone="neutral"
      />
    </div>
  );
}

function UsageTable({ usage, className }: { usage: ComponentUsage | null; className?: string }) {
  const { t } = useLocale();
  const [filter, setFilter] = React.useState<"all" | "used" | "unused">("all");
  const [showAll, setShowAll] = React.useState(false);

  if (!usage?.ok) {
    return (
      <div className={cn("rounded-xl bg-background p-4 ring-1 ring-border", className)}>
        <h3 className="text-sm font-semibold text-foreground">
          {t({ en: "Component usage", zh: "组件使用" })}
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
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t({ en: "Component usage", zh: "组件使用" })}
        </h3>
        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-sm">
          {(["all", "used", "unused"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "rounded px-2 py-0.5 font-medium transition-colors",
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

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t({ en: "Component", zh: "组件" })}</th>
              <th className="px-3 py-2 text-left font-medium">{t({ en: "Origin", zh: "来源" })}</th>
              <th className="px-3 py-2 text-right font-medium">{t({ en: "Usage", zh: "使用次数" })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((c) => (
              <tr key={c.name} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      aria-label={c.origin === "user-import" ? "User imported" : "Kit"}
                      className={cn(
                        "inline-block h-1.5 w-1.5 rounded-full",
                        c.origin === "user-import" ? "bg-blue-500" : "bg-muted-foreground/40",
                      )}
                    />
                    {c.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {c.origin === "user-import"
                    ? t({ en: "User import", zh: "用户上传" })
                    : t({ en: "Kit", zh: "默认 Kit" })}
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

function TreatyHealth({ governance }: { governance: GovernanceStatus | null }) {
  const { t } = useLocale();
  if (!governance?.ok) {
    return (
      <section className="rounded-xl bg-background p-4 ring-1 ring-border">
        <h3 className="text-sm font-semibold text-foreground">
          {t({ en: "AI treaty health", zh: "AI 契约健康度" })}
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
        {t({ en: "AI treaty health", zh: "AI 契约健康度" })}
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {t({
          en: "Generated rule files that AI tools (Cursor / Claude / Copilot) load.",
          zh: "AI 工具（Cursor / Claude / Copilot）加载的规则文件",
        })}
      </p>
      <ul className="mt-3 space-y-1.5">
        {(governance.files ?? []).map((f) => {
          const tone = !f.present ? "bad" : f.stale ? "warn" : "good";
          const Icon = !f.present ? AlertCircle : f.stale ? FileWarning : CheckCircle2;
          const toneClass =
            tone === "bad"
              ? "text-rose-600 dark:text-rose-400"
              : tone === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400";
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

function ViolationsList({ audit, className }: { audit: AuditStatus | null; className?: string }) {
  const { t } = useLocale();
  const profiles = audit?.profiles ?? [];
  if (!audit?.ok || audit.passed || !audit.issues?.length) {
    if (audit?.passed) {
      return (
        <section className={cn("rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4", className)}>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={14} />
            {t({
              en: "Zero violations — AI coding rules are working.",
              zh: "零违规——AI 编码规则起作用了",
            })}
          </div>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            {t({
              en: "Hardcoded hex / arbitrary Tailwind values were prevented at write-time by the rules in CLAUDE.md / .cursorrules / Copilot instructions.",
              zh: "硬编码 hex / 任意 Tailwind 值在写入时被 CLAUDE.md / .cursorrules / Copilot instructions 拦下来了",
            })}
          </p>
          {profiles.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profiles.map((profile) => (
                <span key={profile.scope} className="rounded-md bg-background/60 px-2 py-1 text-sm text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
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
    <section className={cn("rounded-xl bg-background p-4 ring-1 ring-rose-500/30", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
        <AlertCircle size={14} />
        {t({ en: `${audit.issueCount} violation(s)`, zh: `${audit.issueCount} 项违规` })}
      </h3>
      {profiles.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profiles.map((profile) => (
            <span
              key={profile.scope}
              className={cn(
                "rounded-md px-2 py-1 text-sm ring-1",
                profile.passed
                  ? "bg-emerald-500/5 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                  : "bg-rose-500/5 text-rose-700 ring-rose-500/25 dark:text-rose-300",
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
          {t({ en: "Issue list truncated. Run the CLI with --max-issues for the full output.", zh: "违规列表已截断。可用 CLI 加 --max-issues 查看完整输出。" })}
        </p>
      ) : null}
    </section>
  );
}
