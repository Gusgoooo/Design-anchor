import * as React from "react";
import { Check, Moon, RotateCcw, Save, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEED_GROUPS } from "@/design-tokens/seed-card-config";
import { readSeedValue, type TokenDraft } from "./useTokenDraft";
import { SeedRow } from "./SeedCard";
import { DerivedMapTokens } from "./DerivedMapTokens";

export function Customizer({ draft }: { draft: TokenDraft }) {
  const {
    draft: doc,
    persisted,
    dirtyKeys,
    isDirty,
    darkMode,
    setDarkMode,
    setSeed,
    setCustomSeed,
    setFixedAlias,
    setMapOverride,
    clearMapOverride,
    discardDraft,
    saveAndSync,
    status,
    loading,
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
      const branch = darkMode ? "seedDark" : "seed";
      const a = darkMode ? persisted.seedDark?.[key] : persisted.seed[key];
      const b = darkMode ? doc.seedDark?.[key] : doc.seed[key];
      if (branch === "seedDark") {
        // dark "dirty" if seedDark differs OR has been added relative to baseline
        return JSON.stringify(a) !== JSON.stringify(b);
      }
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
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">DesignToken</h2>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {loading ? "Loading…" : saveApiAvailable ? "Live · saves to tokens.json" : "Read-only · dev server offline"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to light" : "Switch to dark"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-2">
        {SEED_GROUPS.map((group, i) => (
          <section key={group.title} className={cn("border-b border-border", i === 0 && "border-t-0")}>
            <header className="bg-muted/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </header>
            {group.seeds.map((seed) => {
              const value = readSeedValue(doc, seed.source, seed.key, darkMode);
              return (
                <SeedRow
                  key={`${group.title}::${seed.key}`}
                  seed={seed}
                  value={value}
                  isDirty={seedIsDirty(seed.source, seed.key)}
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
          </section>
        ))}

        {status ? (
          <div className="mx-3 mt-3 rounded-md border border-border bg-muted/30 px-2.5 py-2 text-[11px] leading-snug text-foreground/80">
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
          title="Discard pending changes"
        >
          <RotateCcw size={12} /> Discard
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
          <span>{saving ? "Saving…" : "Save & Sync"}</span>
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
