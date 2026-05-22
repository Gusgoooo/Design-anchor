import * as React from "react";
import { Check, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";
import { SEED_GROUPS, SEED_GROUP_TITLE_ZH } from "@/design-tokens/seed-card-config";
import { readSeedValue, type TokenDraft } from "./useTokenDraft";
import { SeedRow } from "./SeedCard";
import { DerivedMapTokens } from "./DerivedMapTokens";

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

  const overriddenKeys = React.useMemo(() => {
    const branch = darkMode ? doc.mapOverrides?.dark : doc.mapOverrides?.light;
    return new Set(Object.keys(branch ?? {}));
  }, [doc.mapOverrides, darkMode]);

  const dirtyCount = dirtyKeys.size;

  const [saving, setSaving] = React.useState(false);
  async function handleSave() {
    setSaving(true);
    try {
      await saveAndSync();
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
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {SEED_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {locale === "zh" ? SEED_GROUP_TITLE_ZH[group.title] ?? group.title : group.title}
              </h3>
              <div className="overflow-hidden rounded-[10px] ring-1 ring-border bg-card">
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
          <div className="mt-3 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-[11px] leading-snug text-foreground/80">
            {status}
          </div>
        ) : null}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-2.5">
        <button
          type="button"
          onClick={discardDraft}
          disabled={!isDirty || saving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
          )}
          title={t({ en: "Discard pending changes", zh: "撤销待保存改动" })}
        >
          <RotateCcw size={12} /> {t({ en: "Discard", zh: "撤销" })}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving || !saveApiAvailable}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {saving ? <Check size={12} className="animate-pulse" /> : <Save size={12} />}
          <span>{saving ? t({ en: "Saving…", zh: "保存中…" }) : t({ en: "Save & Sync", zh: "保存并同步" })}</span>
          {isDirty ? (
            <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-[10px] font-semibold tabular-nums">
              {dirtyCount}
            </span>
          ) : null}
        </button>
      </footer>
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
