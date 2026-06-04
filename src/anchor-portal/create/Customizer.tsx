import * as React from "react";
import { Camera, Check, CheckCircle2, MoreHorizontal, RotateCcw, Save, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";
import { SEED_GROUPS, SEED_GROUP_TITLE_ZH } from "@/design-tokens/seed-card-config";
import { readSeedValue, type TokenDraft } from "./useTokenDraft";
import { SeedRow } from "./SeedCard";
import { DerivedMapTokens } from "./DerivedMapTokens";
import { ScreenshotExtractDialog } from "./ScreenshotExtractDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@design/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@design/dropdown-menu";

export function Customizer({ draft }: { draft: TokenDraft }) {
  const { t, locale } = useLocale();
  const {
    draft: doc,
    persisted,
    dirtyKeys,
    isDirty,
    darkMode,
    setSeed,
    setCustomSeed,
    setFixedAlias,
    setMapOverride,
    clearMapOverride,
    discardDraft,
    saveAndSync,
    status,
    saveApiAvailable,
    resolvedVars,
  } = draft;

  const [extractOpen, setExtractOpen] = React.useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false);
  const { resetToFactory } = draft;

  const overriddenKeys = React.useMemo(() => {
    const branch = darkMode ? doc.mapOverrides?.dark : doc.mapOverrides?.light;
    return new Set(Object.keys(branch ?? {}));
  }, [doc.mapOverrides, darkMode]);

  const dirtyCount = dirtyKeys.size;

  const [saving, setSaving] = React.useState(false);
  const [showHealthPrompt, setShowHealthPrompt] = React.useState(false);
  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveAndSync();
      if (result.ok) setShowHealthPrompt(true);
    } finally {
      setSaving(false);
    }
  }

  function seedIsDirty(source: "seed" | "customSeeds" | "fixedAliases", key: string): boolean {
    if (source === "seed") {
      const a = darkMode ? persisted.seedDark?.[key] : persisted.seed[key];
      const b = darkMode ? doc.seedDark?.[key] : doc.seed[key];
      return JSON.stringify(a) !== JSON.stringify(b);
    }
    if (source === "customSeeds") {
      const k = darkMode && /^chart\d$/.test(key) ? `${key}Dark` : key;
      return JSON.stringify(persisted.customSeeds?.[k]) !== JSON.stringify(doc.customSeeds?.[k]);
    }
    return JSON.stringify(persisted.fixedAliases?.[key]) !== JSON.stringify(doc.fixedAliases?.[key]);
  }

  function applySeedChange(source: "seed" | "customSeeds" | "fixedAliases", key: string, value: string) {
    if (source === "seed") setSeed(key, value);
    else if (source === "customSeeds") setCustomSeed(key, value);
    else setFixedAlias(key, value);
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
          {t({ en: "Design Tokens", zh: "设计 Token" })}
        </span>
        <button
          type="button"
          onClick={() => setExtractOpen(true)}
          title={t({
            en: "Get a prompt to extract tokens from a screenshot via your own AI tool",
            zh: "拿一段 prompt 去你自己的 AI 工具里提取 token",
          })}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Camera size={12} />
          {t({ en: "Extract from screenshot", zh: "从截图提取" })}
        </button>
      </div>
      <ScreenshotExtractDialog open={extractOpen} onClose={() => setExtractOpen(false)} draft={draft} />
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {SEED_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {locale === "zh" ? SEED_GROUP_TITLE_ZH[group.title] ?? group.title : group.title}
              </h3>
              <div className="overflow-hidden rounded-lg ring-1 ring-border bg-card">
                {group.seeds.map((seed, idx) => {
                  const value = readSeedValue(doc, seed.source, seed.key, darkMode);
                  return (
                    <SeedRow
                      key={`${group.title}::${seed.key}`}
                      seed={seed}
                      value={value}
                      isDirty={seedIsDirty(seed.source, seed.key)}
                      isFirst={idx === 0}
                      isLast={idx === group.seeds.length - 1 && !hasDerived(group, resolvedVars)}
                      onChange={(v) => applySeedChange(seed.source, seed.key, v)}
                    />
                  );
                })}
                <DerivedMapTokens
                  group={group}
                  resolvedVars={resolvedVars}
                  overriddenKeys={overriddenKeys}
                  onSetOverride={(id, v) => setMapOverride(id, v)}
                  onClearOverride={(id) => clearMapOverride(id)}
                />
              </div>
            </section>
          ))}
        </div>

        {status ? (
          <div className="mt-3 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-sm leading-snug text-foreground/80">
            {status}
          </div>
        ) : null}

        {showHealthPrompt && !isDirty ? (
          <div className="mt-3 rounded-lg border border-border bg-background px-3 py-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {t({ en: "Theme baseline saved", zh: "主题基线已保存" })}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {t({
                    en: "AI constraints are synced. The dashboard icon in the top-right stays quiet unless there is something to review.",
                    zh: "AI 约束已同步。右上角仪表盘会保持安静，只有需要关注时才提示。",
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-2.5">
        <button
          type="button"
          onClick={discardDraft}
          disabled={!isDirty || saving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
          )}
          title={t({ en: "Discard pending changes", zh: "撤销待保存改动" })}
        >
          <RotateCcw size={12} /> {t({ en: "Discard", zh: "撤销" })}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={saving}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
              )}
              title={t({ en: "More actions", zh: "更多操作" })}
              aria-label={t({ en: "More actions", zh: "更多操作" })}
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4} className="min-w-[180px]">
            <DropdownMenuItem onSelect={() => setResetConfirmOpen(true)}>
              <Undo2 size={12} />
              {t({ en: "Reset to defaults", zh: "恢复默认" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving || !saveApiAvailable}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {saving ? <Check size={12} className="animate-pulse" /> : <Save size={12} />}
          <span>{saving ? t({ en: "Saving…", zh: "保存中…" }) : t({ en: "Save & Sync", zh: "保存并同步" })}</span>
          {isDirty ? (
            <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-xs font-semibold tabular-nums">
              {dirtyCount}
            </span>
          ) : null}
        </button>
      </footer>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ en: "Reset all tokens to factory defaults?", zh: "把所有 token 恢复到出厂默认？" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({
                en: "Every seed (color, fontSize, borderRadius, sizeUnit, charts) will be replaced with the bundled factory snapshot. Story / preview UI bindings are preserved. This change goes to your draft — you still need to Save & Sync afterwards to write to disk.",
                zh: "所有 seed（颜色、字号、圆角、间距、图表色）会被替换成 bundled 出厂值。Story / 预览 UI 绑定不动。改动先进 draft，之后还需要点 Save & Sync 才会写盘。",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t({ en: "Cancel", zh: "取消" })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => resetToFactory()}>
              {t({ en: "Reset to defaults", zh: "恢复默认" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function hasDerived(
  group: { derived: { prefixes?: string[]; exactIds?: string[] } },
  resolvedVars: Record<string, string>,
): boolean {
  const { prefixes = [], exactIds = [] } = group.derived;
  if (exactIds.length > 0 && exactIds.some((id) => id in resolvedVars)) return true;
  if (prefixes.length > 0) {
    for (const id of Object.keys(resolvedVars)) {
      if (prefixes.some((p) => id.startsWith(p))) return true;
    }
  }
  return false;
}
