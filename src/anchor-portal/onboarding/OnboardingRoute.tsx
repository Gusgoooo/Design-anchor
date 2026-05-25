import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FilePlus2,
  FolderInput,
  Loader2,
  Package,
  Search,
  Sparkles,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/base/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/base/card";
import { Input } from "@/components/base/input";
import { Badge } from "@/components/base/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/base/alert";
import { Separator } from "@/components/base/separator";
import { useLocale } from "../i18n/LocaleProvider";

type Mode = "default" | "import" | "empty";

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
  summary?: { safe: number; warn: number; risky: number };
  error?: string;
};

type ImportResult = {
  ok?: boolean;
  imported?: string[];
  errors?: Array<{ file: string; error: string }>;
  kind?: "file" | "folder";
  error?: string;
};

export function OnboardingRoute({ onComplete }: { onComplete: () => void }) {
  const { t } = useLocale();
  const [mode, setMode] = React.useState<Mode>("default");
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

  async function handleStartDefault() {
    setBusy(true);
    setError(null);
    try {
      await commitSetup({ mode: "default" });
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  async function handleStartEmpty() {
    if (!confirm(t({
      en: "This will delete all components in src/components/base/. Continue?",
      zh: "这会删除 src/components/base/ 下所有组件。继续？",
    }))) return;
    setBusy(true);
    setError(null);
    try {
      const clearRes = await fetch("/api/clear-components", { method: "POST" });
      const clearBody = await clearRes.json().catch(() => ({}));
      if (!clearRes.ok || !clearBody.ok) {
        throw new Error(clearBody.error ?? `clear failed: HTTP ${clearRes.status}`);
      }
      await commitSetup({ mode: "empty" });
      onComplete();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
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
        body: JSON.stringify({ path: scan.root, files, safeOnly: filterRisky, recursive: true }),
      });
      const body = (await res.json()) as ImportResult;
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      await commitSetup({
        mode: "import",
        imported: body.imported ?? [],
        importedFrom: scan.root,
        importMode: filterRisky ? "safe-only" : "all",
      });
      onComplete();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-muted/30 dark:bg-background/40">
      <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
            <Anchor size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t({ en: "Welcome to Design-anchor", zh: "欢迎使用 Design-anchor" })}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t({
                en: "Pick a starting point. You can switch modes later by deleting .anchor-portal/setup.json.",
                zh: "选一个起点。之后想换模式，删 .anchor-portal/setup.json 即可",
              })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ModeCard
            active={mode === "default"}
            onClick={() => setMode("default")}
            icon={<Package size={18} />}
            badge={t({ en: "Recommended", zh: "推荐" })}
            title={t({ en: "Default kit", zh: "默认组件库" })}
            subtitle={t({ en: "60+ shadcn-aligned", zh: "60+ shadcn 对齐" })}
            body={t({
              en: "Start with the bundled component library. Tokens already wired up.",
              zh: "直接使用 bundled 的组件库，token 已就绪",
            })}
          />
          <ModeCard
            active={mode === "import"}
            onClick={() => setMode("import")}
            icon={<FolderInput size={18} />}
            title={t({ en: "Import yours", zh: "导入自有组件" })}
            subtitle={t({ en: "Bring your .tsx files", zh: "带上你的 .tsx" })}
            body={t({
              en: "Point at a folder or single file. We'll scan compat first, then copy in.",
              zh: "指向文件夹或单文件——先扫兼容度，再拷进来",
            })}
          />
          <ModeCard
            active={mode === "empty"}
            onClick={() => setMode("empty")}
            icon={<FilePlus2 size={18} />}
            title={t({ en: "Empty library", zh: "空白起步" })}
            subtitle={t({ en: "Tokens only", zh: "仅保留 token" })}
            body={t({
              en: "Wipe components, keep tokens & rules. Grow from zero.",
              zh: "清空组件，留 token + 规则，从零开始",
            })}
          />
        </div>

        {mode === "import" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t({ en: "Import .tsx components", zh: "导入 .tsx 组件" })}
              </CardTitle>
              <CardDescription>
                {t({
                  en: "Absolute path (~/foo or /Users/...). Folder mode scans nested .tsx files and skips *.demo.tsx / *.stories.tsx.",
                  zh: "绝对路径（~/foo 或 /Users/...）。文件夹模式会递归扫描 .tsx，跳过 *.demo.tsx / *.stories.tsx",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                        en: `Import all (${scan.files?.length ?? 0})`,
                        zh: `全部导入 (${scan.files?.length ?? 0})`,
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
          {mode === "default" ? (
            <Button onClick={() => void handleStartDefault()} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {t({ en: "Start with default kit", zh: "用默认组件库开始" })}
              <ArrowRight size={14} />
            </Button>
          ) : null}
          {mode === "empty" ? (
            <Button onClick={() => void handleStartEmpty()} disabled={busy} variant="destructive">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
              {t({ en: "Wipe components & start empty", zh: "清空组件并开始" })}
            </Button>
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            {t({
              en: "Re-run this wizard later by deleting .anchor-portal/setup.json.",
              zh: "稍后想重新选，删 .anchor-portal/setup.json",
            })}
          </p>
        </footer>
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
  body: string;
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
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      className={cn(
        "cursor-pointer select-none transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "ring-2 ring-foreground"
          : "hover:ring-1 hover:ring-foreground/30",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
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
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
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
