import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FolderInput,
  Globe,
  Loader2,
  Moon,
  Palette,
  Search,
  Sparkles,
  Sun,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@design/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@design/card";
import { Input } from "@design/input";
import { Badge } from "@design/badge";
import { Alert, AlertDescription, AlertTitle } from "@design/alert";
import { Separator } from "@design/separator";
import { useLocale } from "../i18n/LocaleProvider";
import { navigateTo } from "../router";
import { useTheme } from "../theme/DarkModeProvider";
import { findOnboardingPreset, ONBOARDING_PRESETS, type OnboardingPreset } from "./presets";

type StartPath = "quick" | "existing";

const TAILWIND_DEFAULT_ID = "tailwind-default";

const TAILWIND_DEFAULT_BASELINE: OnboardingPreset = {
  id: TAILWIND_DEFAULT_ID,
  name: "Tailwind Default",
  tagline: { en: "Start from zero", zh: "从 0 开始" },
  bestFor: { en: "New products that want a clean Tailwind baseline first", zh: "希望先用干净 Tailwind 基线启动的新产品" },
  tone: { en: "Neutral, simple, extensible", zh: "中性、简单、可扩展" },
  tokenPatch: { seed: {} },
  preview: {
    background: "#ffffff",
    surface: "#f8fafc",
    foreground: "#0f172a",
    muted: "#64748b",
    primary: "#0f172a",
    accent: "#2563eb",
    border: "#e2e8f0",
    chart1: "#0f172a",
    chart2: "#2563eb",
    chart3: "#64748b",
  },
};

type ScanReport = {
  ok: boolean;
  kind?: "file" | "folder";
  root?: string;
  files?: Array<{
    file: string;
    absPath: string;
    level: "safe" | "warn" | "risky";
    imports: Array<{ import: string; level: "safe" | "warn" | "risky" }>;
  }>;
  summary?: { safe: number; warn: number; risky: number; incompatible?: number };
  error?: string;
};

type ImportResult = {
  ok?: boolean;
  imported?: string[];
  errors?: Array<{ file: string; error: string }>;
  kind?: "file" | "folder";
  error?: string;
};

type OnboardingStep = "select" | "injecting";

export function OnboardingRoute({ onComplete }: { onComplete: () => void }) {
  const { t, locale, toggle: toggleLocale } = useLocale();
  const { dark, setDark, toggle: toggleDark } = useTheme();
  const [step, setStep] = React.useState<OnboardingStep>("select");
  const [startPath, setStartPath] = React.useState<StartPath>("quick");
  const [selectedBaselineId, setSelectedBaselineId] = React.useState(TAILWIND_DEFAULT_ID);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [importPath, setImportPath] = React.useState("");
  const [scan, setScan] = React.useState<ScanReport | null>(null);
  const [scanning, setScanning] = React.useState(false);

  async function commitSetup(payload: Record<string, unknown>) {
    const res = await fetch("/api/setup-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
  }

  async function applyPresetTokenPatch(preset: OnboardingPreset) {
    const res = await fetch("/api/apply-token-preset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preset: preset.id,
        presetName: preset.name,
        tone: preset.tone.en,
        preferredTheme: preset.preferredTheme ?? "light",
        tokenPatch: preset.tokenPatch,
        aiStyleGuide: preset.aiStyleGuide,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  async function handleStartQuick() {
    const preset = selectedBaselineId === TAILWIND_DEFAULT_ID ? null : findOnboardingPreset(selectedBaselineId);
    const shouldUseDark = preset?.preferredTheme === "dark";
    setBusy(true);
    setError(null);
    try {
      if (preset) await applyPresetTokenPatch(preset);
      setDark(shouldUseDark);
      setStep("injecting");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  async function finalizeSetup() {
    const preset = selectedBaselineId === TAILWIND_DEFAULT_ID ? null : findOnboardingPreset(selectedBaselineId);
    await commitSetup({
      mode: preset ? "preset" : "default",
      componentSource: "default",
      projectMode: "new",
      baseline: preset ? "preset" : TAILWIND_DEFAULT_ID,
      ...(preset
        ? { preset: preset.id, presetAppliedAt: new Date().toISOString(), preferredTheme: preset.preferredTheme ?? "light" }
        : {}),
      startIntent: "ai-coding",
    });
  }

  async function handleScan() {
    if (!importPath.trim()) return;
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/scan-component-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: importPath.trim(), recursive: true }),
      });
      const body = (await res.json()) as ScanReport;
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setScan(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setScan(null);
    } finally {
      setScanning(false);
    }
  }

  async function handleImport(filterRisky: boolean) {
    if (!scan?.files?.length) return;
    const files = filterRisky
      ? scan.files.filter((file) => file.level === "safe").map((file) => file.absPath)
      : scan.files.map((file) => file.absPath);
    if (filterRisky && !files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import-component-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: scan.root, files, safeOnly: filterRisky, recursive: true, confirm: true }),
      });
      const body = (await res.json()) as ImportResult;
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      await commitSetup({
        mode: "import",
        componentSource: "owned",
        projectMode: "existing",
        imported: body.imported ?? [],
        importedFrom: scan.root,
        importMode: filterRisky ? "safe-only" : "all",
      });
      navigateTo({ kind: "designtoken" });
      onComplete();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  if (step === "injecting") {
    return (
      <InjectingStep
        onCustomize={async () => { await finalizeSetup(); navigateTo({ kind: "designtoken" }); onComplete(); }}
      />
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-muted/20 dark:bg-background/40">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-8 lg:py-10">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe size={13} />
            <span className="font-semibold">{locale === "en" ? "EN" : "中文"}</span>
          </button>
          <button
            type="button"
            onClick={toggleDark}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
        <header className="flex flex-col items-center gap-3.5 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
            <Anchor size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {t({ en: "Welcome to Design-anchor", zh: "欢迎使用 Design-anchor" })}
            </h1>
          </div>
        </header>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {t({ en: "1. Choose a path", zh: "1. 选择路径" })}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ModeCard
              active={startPath === "quick"}
              onClick={() => setStartPath("quick")}
              icon={<Sparkles size={18} />}
              badge={t({ en: "Recommended", zh: "推荐" })}
              title={t({ en: "Quick start", zh: "快速开始" })}
              subtitle={t({ en: "New product, from zero", zh: "新产品，从 0 开始" })}
            />
            <ModeCard
              active={startPath === "existing"}
              onClick={() => setStartPath("existing")}
              icon={<FolderInput size={18} />}
              title={t({ en: "Start from existing", zh: "从已有开始" })}
              subtitle={t({ en: "Migrate a component library", zh: "迁移已有组件库" })}
            />
          </div>
        </section>

        {startPath === "quick" ? (
          <section className="space-y-3">
            <div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t({ en: "2. Choose a brand style", zh: "2. 选择品牌风格" })}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...ONBOARDING_PRESETS, TAILWIND_DEFAULT_BASELINE]
                .sort((a, b) => {
                  const aD = a.preferredTheme === "dark" || a.id === "tailwind-default" ? 1 : 0;
                  const bD = b.preferredTheme === "dark" || b.id === "tailwind-default" ? 1 : 0;
                  if (aD !== bD) return aD - bD;
                  if (a.id === "tailwind-default") return 1;
                  if (b.id === "tailwind-default") return -1;
                  return 0;
                })
                .map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    active={selectedBaselineId === preset.id}
                    onClick={() => setSelectedBaselineId(preset.id)}
                  />
                ))}
            </div>
          </section>
        ) : null}

        {startPath === "existing" ? (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-2 p-6">
              <CardTitle className="text-sm">
                {t({ en: "2. Import React + Tailwind .tsx components", zh: "2. 导入 React + Tailwind .tsx 组件" })}
              </CardTitle>
              <CardDescription>
                {t({
                  en: "Only React + Tailwind component libraries are supported here. Use an absolute path (~/foo or /Users/...). Folder mode scans nested .tsx files and skips *.demo.tsx / *.stories.tsx.",
                  zh: "这里只支持 React + Tailwind 组件库。请输入绝对路径（~/foo 或 /Users/...）。文件夹模式会递归扫描 .tsx，跳过 *.demo.tsx / *.stories.tsx。",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-6 pb-6">
              <div className="flex gap-2">
                <Input
                  value={importPath}
                  onChange={(e) => { setImportPath(e.target.value); setScan(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleScan(); }}
                  placeholder="/Users/me/projects/my-design-system/components"
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 font-mono"
                />
                <Button
                  type="button"
                  onClick={() => void handleScan()}
                  disabled={!importPath.trim() || scanning}
                  variant="secondary"
                >
                  {scanning ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  {t({ en: "Scan", zh: "扫描" })}
                </Button>
              </div>

              {scan?.ok ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      {t({ en: "Total", zh: "共" })} {scan.files?.length ?? 0}
                    </Badge>
                    {scan.summary?.safe ? (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
                        ✓ {scan.summary.safe} {t({ en: "safe", zh: "安全" })}
                      </Badge>
                    ) : null}
                    {scan.summary?.warn ? (
                      <Badge className="gap-1 bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
                        ⚠ {scan.summary.warn} {t({ en: "warn", zh: "警告" })}
                      </Badge>
                    ) : null}
                    {scan.summary?.risky ? (
                      <Badge variant="destructive" className="gap-1">
                        ✗ {scan.summary.risky} {t({ en: "risky", zh: "风险" })}
                      </Badge>
                    ) : null}
                    {scan.summary?.incompatible ? (
                      <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive">
                        {scan.summary.incompatible} {t({ en: "incompatible", zh: "不兼容" })}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/20">
                    {(scan.files ?? []).map((f, idx) => (
                      <React.Fragment key={f.absPath}>
                        {idx > 0 ? <Separator /> : null}
                        <div className="flex items-start gap-2 px-3 py-2 text-xs">
                          <LevelBadge level={f.level} />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-foreground">{f.file}</div>
                            {f.imports.length ? (
                              <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                {f.imports.map((i) => i.import).join(" · ")}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleImport(true)}
                      disabled={busy || (scan.summary?.safe ?? 0) === 0}
                      size="sm"
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {t({
                        en: `Import safe (${scan.summary?.safe ?? 0})`,
                        zh: `仅导入安全的 (${scan.summary?.safe ?? 0})`,
                      })}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleImport(false)}
                      disabled={busy || (scan.files?.length ?? 0) === 0}
                      size="sm"
                      variant="outline"
                    >
                      {t({
                        en: `Import scanned (${scan.files?.length ?? 0})`,
                        zh: `导入扫描结果 (${scan.files?.length ?? 0})`,
                      })}
                    </Button>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t({
                      en: "Components using semantic Tailwind classes (bg-primary, text-foreground) automatically inherit your theme. Hardcoded palette classes (bg-blue-500) won't follow theme changes.",
                      zh: "用 Tailwind 语义类（bg-primary / text-foreground）的组件会自动跟随主题；硬编码调色板类（bg-blue-500）不会跟着 theme 走",
                    })}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle size={14} />
            <AlertTitle>{t({ en: "Something went wrong", zh: "出错了" })}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <footer className="mt-auto flex flex-col items-center gap-3 border-t border-border pt-5">
          {startPath === "quick" ? (
            <Button onClick={() => void handleStartQuick()} disabled={busy}>
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : selectedBaselineId === TAILWIND_DEFAULT_ID ? (
                <Sparkles size={14} />
              ) : (
                <Palette size={14} />
              )}
              {t({
                en: selectedBaselineId === TAILWIND_DEFAULT_ID
                  ? "Start from Tailwind Default"
                  : `Apply ${findOnboardingPreset(selectedBaselineId).name} & start AI Coding`,
                zh: selectedBaselineId === TAILWIND_DEFAULT_ID
                  ? "从 Tailwind Default 开始"
                  : `应用 ${findOnboardingPreset(selectedBaselineId).name} 并开始 AI Coding`,
              })}
              <ArrowRight size={14} />
            </Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function InjectingStep({
  onCustomize,
}: {
  onCustomize: () => void | Promise<void>;
}) {
  const { t } = useLocale();
  const [completedItems, setCompletedItems] = React.useState<number[]>([]);
  const [done, setDone] = React.useState(false);

  const checklistItems = React.useMemo(() => [
    t({ en: "Applying brand style", zh: "应用品牌风格" }),
    t({ en: "Syncing Design Tokens", zh: "同步 Design Tokens" }),
    t({ en: "Injecting component specs", zh: "注入组件规范" }),
    t({ en: "Configuring AI rules", zh: "配置 AI 规则" }),
  ], [t]);

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    checklistItems.forEach((_, idx) => {
      timers.push(setTimeout(() => {
        setCompletedItems((prev) => [...prev, idx]);
      }, 500 + idx * 450));
    });
    timers.push(setTimeout(() => setDone(true), 500 + checklistItems.length * 450 + 400));
    return () => timers.forEach(clearTimeout);
  }, [checklistItems]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20 dark:bg-background/40">
      <div className="flex w-full max-w-md flex-col items-center gap-6 px-6 text-center">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500",
          done ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
        )}>
          {done ? <Check size={28} strokeWidth={2.5} /> : <Loader2 size={28} className="animate-spin" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {done
              ? t({ en: "Design-anchor is ready", zh: "Design-anchor 已就绪" })
              : t({ en: "Setting up…", zh: "配置中…" })}
          </h2>
          {done && (
            <p className="text-sm text-muted-foreground">
              {t({
                en: "Style rules have been injected into your project. All future AI Coding will follow this component library's design system.",
                zh: "样式规则已注入项目，后续 AI Coding 将以这套组件库规范为准。",
              })}
            </p>
          )}
        </div>

        <div className="w-full space-y-2 rounded-lg border border-border bg-background p-4 text-left">
          {checklistItems.map((label, idx) => (
            <div key={label} className={cn(
              "flex items-center gap-3 text-sm transition-opacity duration-300",
              completedItems.includes(idx) ? "opacity-100" : "opacity-30",
            )}>
              <div className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                completedItems.includes(idx) ? "bg-foreground text-background" : "bg-muted",
              )}>
                {completedItems.includes(idx) ? <Check size={11} strokeWidth={3} /> : null}
              </div>
              <span className={cn(completedItems.includes(idx) && "text-foreground")}>{label}</span>
            </div>
          ))}
        </div>

        {done && (
          <div className="flex w-full flex-col gap-2 pt-2">
            <Button onClick={onCustomize} className="w-full">
              <Palette size={14} />
              {t({ en: "Browse component library", zh: "查看组件库样式" })}
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              {t({
                en: "Or close this page to start Coding — every change you make here syncs to your project in real time.",
                zh: "或直接关闭该页面开始 Coding，后续随时可以回来微调，每次修改都会实时同步到项目中。",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
  body,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  body?: string;
  badge?: string;
}) {
  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }
  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      className={cn(
        "min-h-32 cursor-pointer select-none gap-3 border-border/80 bg-background/95 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground/40 ring-2 ring-foreground"
          : "hover:border-foreground/25",
      )}
    >
      <CardHeader className="p-4 pb-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </div>
          <div className="flex items-center gap-1.5">
            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            {active ? <CheckCircle2 size={15} className="text-foreground" /> : null}
          </div>
        </div>
        <CardTitle className="mt-3 text-sm">{title}</CardTitle>
        <CardDescription className="text-sm">{subtitle}</CardDescription>
      </CardHeader>
      {body ? (
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-sm leading-snug text-muted-foreground">{body}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function PresetCard({
  preset,
  active,
  onClick,
}: {
  preset: OnboardingPreset;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useLocale();
  function handleKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKey}
      aria-pressed={active}
      className={cn(
        "group overflow-hidden rounded-xl border bg-background p-0 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "border-foreground/50 ring-2 ring-foreground" : "border-border/80 hover:border-foreground/25",
      )}
    >
      <PresetScreenshot preset={preset} />
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{preset.name}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">{t(preset.tagline)}</div>
          </div>
          {active ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-foreground" /> : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(preset.bestFor)}</p>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="max-w-full truncate">
            {t(preset.tone)}
          </Badge>
          <span className="text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {t({ en: "Select", zh: "选择" })}
          </span>
        </div>
      </div>
    </button>
  );
}

function PresetScreenshot({ preset }: { preset: OnboardingPreset }) {
  const style = {
    "--preset-bg": preset.preview.background,
    "--preset-surface": preset.preview.surface,
    "--preset-fg": preset.preview.foreground,
    "--preset-muted": preset.preview.muted,
    "--preset-primary": preset.preview.primary,
    "--preset-accent": preset.preview.accent,
    "--preset-border": preset.preview.border,
    "--preset-chart-1": preset.preview.chart1,
    "--preset-chart-2": preset.preview.chart2,
    "--preset-chart-3": preset.preview.chart3,
  } as React.CSSProperties;

  if (preset.previewImage) {
    return (
      <div className="aspect-[4/3] overflow-hidden">
        <img src={preset.previewImage} alt="" className="h-full w-full object-cover object-top" />
      </div>
    );
  }

  return (
    <div className="aspect-[4/3] overflow-hidden" style={style}>
      <div
        className="h-full overflow-hidden"
        style={{
          background: "var(--preset-bg)",
          borderColor: "var(--preset-border)",
          color: "var(--preset-fg)",
        }}
      >
        <div className="flex h-full">
          <div
            className="flex w-16 shrink-0 flex-col gap-2 border-r p-2"
            style={{ borderColor: "var(--preset-border)", background: "color-mix(in srgb, var(--preset-surface) 92%, transparent)" }}
          >
            <div className="h-2 w-9 rounded-full" style={{ background: "var(--preset-primary)" }} />
            <div className="mt-2 h-1.5 w-10 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.5 }} />
            <div className="h-1.5 w-7 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.35 }} />
            <div className="h-1.5 w-11 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.35 }} />
            <div className="mt-auto h-5 w-5 rounded-full" style={{ background: "var(--preset-accent)", opacity: 0.8 }} />
          </div>
          <div className="min-w-0 flex-1 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="h-2.5 w-24 rounded-full" style={{ background: "var(--preset-fg)", opacity: 0.9 }} />
                <div className="mt-1.5 h-1.5 w-16 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.55 }} />
              </div>
              <div className="h-6 w-14 rounded-md" style={{ background: "var(--preset-primary)" }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[preset.preview.chart1, preset.preview.chart2, preset.preview.chart3].map((color, idx) => (
                <div
                  key={`${preset.id}-metric-${color}`}
                  className="rounded-md border p-2"
                  style={{
                    background: "var(--preset-surface)",
                    borderColor: "var(--preset-border)",
                  }}
                >
                  <div className="h-1.5 w-8 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.5 }} />
                  <div className="mt-3 h-4 w-9 rounded-sm" style={{ background: color, opacity: idx === 1 ? 0.85 : 1 }} />
                </div>
              ))}
            </div>
            <div className="mt-2 rounded-md border" style={{ background: "var(--preset-surface)", borderColor: "var(--preset-border)" }}>
              {[0, 1, 2].map((row) => (
                <div
                  key={`${preset.id}-row-${row}`}
                  className="flex items-center gap-2 border-b px-2 py-1.5 last:border-b-0"
                  style={{ borderColor: "var(--preset-border)" }}
                >
                  <div className="h-2 w-2 rounded-full" style={{ background: row === 0 ? "var(--preset-primary)" : "var(--preset-muted)" }} />
                  <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.35 }} />
                  <div className="h-1.5 w-8 rounded-full" style={{ background: "var(--preset-muted)", opacity: 0.25 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: "safe" | "warn" | "risky" }) {
  if (level === "safe") {
    return (
      <Badge className="mt-0.5 shrink-0 gap-0.5 bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
        ✓
      </Badge>
    );
  }
  if (level === "warn") {
    return (
      <Badge className="mt-0.5 shrink-0 gap-0.5 bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
        ⚠
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="mt-0.5 shrink-0 gap-0.5">
      ✗
    </Badge>
  );
}
