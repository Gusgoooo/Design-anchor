import * as React from "react";
import { Check, CheckCircle2, Clipboard, Gauge, HelpCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "./i18n/LocaleProvider";
import { navigateTo } from "./router";

type AuditStatus = {
  ok: boolean;
  passed?: boolean;
  issueCount?: number;
  error?: string;
};

type ComponentUsage = {
  ok: boolean;
  total?: number;
  error?: string;
};

type GovernanceStatus = {
  ok: boolean;
  files?: Array<{ id: string; present: boolean; stale?: boolean }>;
  error?: string;
};

type HealthSummary = {
  audit: AuditStatus | null;
  usage: ComponentUsage | null;
  governance: GovernanceStatus | null;
  loading: boolean;
  lastFetched: Date | null;
  refresh: () => Promise<void>;
};

const SYNC_COMMAND = "npx design-anchor sync";

function useHealthSummary(): HealthSummary {
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
  return date.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

function constraintsSynced(governance: GovernanceStatus | null): boolean {
  if (!governance?.ok) return false;
  const files = governance.files ?? [];
  const hasAny = files.some((file) => file.present);
  const hasStale = files.some((file) => file.present && file.stale);
  return hasAny && !hasStale;
}

export function HealthWidget() {
  const { t, locale } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const { audit, usage, governance, loading, lastFetched, refresh } = useHealthSummary();

  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const synced = constraintsSynced(governance);
  const hasReminder = audit?.ok === true && audit.passed === false;
  const issueCount = audit?.ok ? audit.issueCount ?? 0 : 0;

  async function copySyncCommand() {
    try {
      await navigator.clipboard.writeText(SYNC_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t({ en: "AI health", zh: "AI 健康状态" })}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          open ? "bg-muted text-foreground" : "",
        )}
      >
        <Gauge size={14} />
        <span>{t({ en: "Governance", zh: "治理" })}</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-border bg-background p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {t({ en: "AI Design Health", zh: "AI 设计健康" })}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t({ en: "Quiet status for the current design system.", zh: "当前设计系统的轻量状态。" })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              title={t({ en: "Run self-check", zh: "运行自检" })}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-2">
            <WidgetMetric
              label={t({ en: "AI design constraints", zh: "AI 设计约束" })}
              value={synced ? t({ en: "Active", zh: "已生效" }) : t({ en: "Sync needed", zh: "待同步" })}
              description={t({
                en: "AI combines user instructions with design specs when generating.",
                zh: "AI 会结合用户指令与设计规范生成。",
              })}
              tone={synced ? "good" : "soft"}
            />
            <WidgetMetric
              label={t({ en: "Component specs", zh: "组件规范覆盖" })}
              value={usage?.ok ? `${usage.total ?? 0}` : "—"}
              description={t({ en: "AI knows the intended imports, variants, and usage constraints.", zh: "AI 知道组件的导入、变体和使用约束。" })}
              tone="neutral"
            />
            <WidgetMetric
              label={t({ en: "Latest self-check", zh: "最近自检" })}
              value={
                audit?.ok
                  ? `${hasReminder ? t({ en: "Reminder", zh: "有提醒" }) : t({ en: "Passed", zh: "通过" })} · ${relativeTime(lastFetched, locale)}`
                  : t({ en: "Unavailable", zh: "不可用" })
              }
              description={audit?.ok ? t({ en: "Reported in the AI coding flow.", zh: "在 AI 生码链路中反馈。" }) : audit?.error ?? ""}
              tone={hasReminder ? "soft" : "good"}
            />
            <WidgetMetric
              label={t({ en: "Auto governance", zh: "自动治理" })}
              value={t({ en: `This run intercepted ${issueCount}`, zh: `本次拦截 ${issueCount} 次` })}
              description={t({ en: "Safe fixes happen in the AI task summary.", zh: "安全修复在 AI 任务总结中体现。" })}
              tone={issueCount > 0 ? "soft" : "neutral"}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigateTo({ kind: "docs" });
              }}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <HelpCircle size={12} />
              {t({ en: "Guide", zh: "查看说明" })}
            </button>
            <button
              type="button"
              onClick={() => void copySyncCommand()}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check size={12} /> : <Clipboard size={12} />}
              {t({ en: "Copy sync", zh: "复制同步" })}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {t({ en: "Check", zh: "运行自检" })}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WidgetMetric({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: "good" | "soft" | "neutral";
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
            tone === "good"
              ? "bg-primary/10 text-primary"
              : tone === "soft"
                ? "bg-muted text-foreground"
                : "bg-transparent text-foreground",
          )}
        >
          {tone === "good" ? <CheckCircle2 size={11} /> : null}
          {value}
        </span>
      </div>
      {description ? <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p> : null}
    </div>
  );
}
