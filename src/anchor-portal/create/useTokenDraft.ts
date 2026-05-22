import * as React from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — .mjs without types
import { deriveSeedToMap } from "@/design-tokens/seed-to-map.mjs";
import tokensFallback from "@/design-tokens/tokens.json";

export type TokensDocV2 = {
  version: 2;
  description?: string;
  seed: Record<string, string | number>;
  seedDark?: Record<string, string | number>;
  mapOverrides?: { light?: Record<string, string>; dark?: Record<string, string> };
  customSeeds?: Record<string, string>;
  fixedAliases?: Record<string, string | number>;
  storyBindings?: unknown;
};

export type Branch = "light" | "dark";

/** /api/design-tokens lives on the Vite dev server. */
function devApi(path: string): string {
  if (typeof window === "undefined" || !path.startsWith("/")) return path;
  return `${window.location.origin}${path}`;
}

function cloneDoc(doc: TokensDocV2): TokensDocV2 {
  return JSON.parse(JSON.stringify(doc));
}

function ensureBranches(doc: TokensDocV2) {
  if (!doc.seedDark) doc.seedDark = {};
  if (!doc.customSeeds) doc.customSeeds = {};
  if (!doc.fixedAliases) doc.fixedAliases = {};
  if (!doc.mapOverrides) doc.mapOverrides = { light: {}, dark: {} };
  if (!doc.mapOverrides.light) doc.mapOverrides.light = {};
  if (!doc.mapOverrides.dark) doc.mapOverrides.dark = {};
}

/** Light-vs-dark seed merge: dark inherits from light unless seedDark overrides. */
function resolveSeed(doc: TokensDocV2, dark: boolean): Record<string, string | number> {
  if (!dark) return doc.seed;
  const merged: Record<string, string | number> = { ...doc.seed };
  for (const [k, v] of Object.entries(doc.seedDark ?? {})) merged[k] = v;
  return merged;
}

/** Flat `{ "color-primary": "#...", ... }` keyed by the names emitted by seed-to-map. */
function computeVars(doc: TokensDocV2, dark: boolean): Record<string, string> {
  const seed = resolveSeed(doc, dark);
  const derived = deriveSeedToMap(seed, {
    dark,
    customSeeds: doc.customSeeds ?? {},
    fixedAliases: doc.fixedAliases ?? {},
  }) as Record<string, string | number>;
  const overrides = (dark ? doc.mapOverrides?.dark : doc.mapOverrides?.light) ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(derived)) {
    if (k.startsWith("__")) continue;
    if (v == null || v === "") continue;
    out[k] = String(v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v != null && v !== "") out[k] = v;
  }
  return out;
}

function collectDirty(persisted: TokensDocV2, draft: TokensDocV2): Set<string> {
  const dirty = new Set<string>();
  function diff(a: Record<string, unknown> | undefined, b: Record<string, unknown> | undefined, prefix: string) {
    const aa = a ?? {};
    const bb = b ?? {};
    const keys = new Set([...Object.keys(aa), ...Object.keys(bb)]);
    for (const k of keys) {
      if (JSON.stringify(aa[k]) !== JSON.stringify(bb[k])) dirty.add(`${prefix}:${k}`);
    }
  }
  diff(persisted.seed, draft.seed, "seed");
  diff(persisted.seedDark, draft.seedDark, "seedDark");
  diff(persisted.customSeeds, draft.customSeeds, "customSeeds");
  diff(persisted.fixedAliases, draft.fixedAliases, "fixedAliases");
  diff(persisted.mapOverrides?.light, draft.mapOverrides?.light, "mapOverrides.light");
  diff(persisted.mapOverrides?.dark, draft.mapOverrides?.dark, "mapOverrides.dark");
  return dirty;
}

export type SaveResult = {
  ok: boolean;
  fileWritten?: boolean;
  syncOk?: boolean;
  syncError?: string | null;
  error?: string;
};

export type TokenDraft = {
  loading: boolean;
  loadError: string | null;
  status: string | null;
  saveApiAvailable: boolean;
  persisted: TokensDocV2;
  draft: TokensDocV2;
  dirtyKeys: Set<string>;
  isDirty: boolean;
  darkMode: boolean;
  setDarkMode(value: boolean): void;
  /** Light: writes to seed. Dark: writes to seedDark. */
  setSeed(key: string, value: string | number): void;
  setCustomSeed(key: string, value: string): void;
  setFixedAlias(key: string, value: string | number): void;
  /** Writes to mapOverrides[currentBranch]; pass branch to force a side. */
  setMapOverride(key: string, value: string, branch?: Branch): void;
  /** Removes a mapOverride entry. */
  clearMapOverride(key: string, branch?: Branch): void;
  discardDraft(): void;
  reload(): Promise<void>;
  saveAndSync(): Promise<SaveResult>;
  /** Live CSS variables that the right preview should consume. */
  resolvedVars: Record<string, string>;
};

export function useTokenDraft(initialDarkMode: boolean): TokenDraft {
  const [persisted, setPersisted] = React.useState<TokensDocV2>(() => cloneDoc(tokensFallback as TokensDocV2));
  const [draft, setDraft] = React.useState<TokensDocV2>(() => cloneDoc(tokensFallback as TokensDocV2));
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [saveApiAvailable, setSaveApiAvailable] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(initialDarkMode);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setStatus(null);
    try {
      const res = await fetch(devApi("/api/design-tokens"), { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const txt = await res.text();
      const parsed = JSON.parse(txt) as TokensDocV2;
      ensureBranches(parsed);
      setPersisted(parsed);
      setDraft(cloneDoc(parsed));
      setSaveApiAvailable(true);
    } catch (e) {
      const fallback = cloneDoc(tokensFallback as TokensDocV2);
      ensureBranches(fallback);
      setPersisted(fallback);
      setDraft(cloneDoc(fallback));
      setSaveApiAvailable(false);
      setLoadError(e instanceof Error ? e.message : String(e));
      setStatus(
        "Save API not available. Loaded bundled tokens.json for editing; to write to disk, run `npm run dev` first.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const dirtyKeys = React.useMemo(() => collectDirty(persisted, draft), [persisted, draft]);
  const isDirty = dirtyKeys.size > 0;

  const setSeed = React.useCallback(
    (key: string, value: string | number) => {
      setDraft((prev) => {
        const next = cloneDoc(prev);
        ensureBranches(next);
        if (darkMode) {
          if (next.seedDark![key] === value) return prev;
          next.seedDark![key] = value;
        } else {
          if (next.seed[key] === value) return prev;
          next.seed[key] = value;
        }
        return next;
      });
    },
    [darkMode],
  );

  const setCustomSeed = React.useCallback(
    (key: string, value: string) => {
      setDraft((prev) => {
        const next = cloneDoc(prev);
        ensureBranches(next);
        // chart{N} for light, chart{N}Dark for dark
        const k = darkMode && /^chart\d$/.test(key) ? `${key}Dark` : key;
        if (next.customSeeds![k] === value) return prev;
        next.customSeeds![k] = value;
        return next;
      });
    },
    [darkMode],
  );

  const setFixedAlias = React.useCallback((key: string, value: string | number) => {
    setDraft((prev) => {
      const next = cloneDoc(prev);
      ensureBranches(next);
      if (next.fixedAliases![key] === value) return prev;
      next.fixedAliases![key] = value;
      return next;
    });
  }, []);

  const setMapOverride = React.useCallback(
    (key: string, value: string, branch?: Branch) => {
      const b = branch ?? (darkMode ? "dark" : "light");
      setDraft((prev) => {
        const next = cloneDoc(prev);
        ensureBranches(next);
        const target = b === "dark" ? next.mapOverrides!.dark! : next.mapOverrides!.light!;
        if (target[key] === value) return prev;
        target[key] = value;
        return next;
      });
    },
    [darkMode],
  );

  const clearMapOverride = React.useCallback(
    (key: string, branch?: Branch) => {
      const b = branch ?? (darkMode ? "dark" : "light");
      setDraft((prev) => {
        const next = cloneDoc(prev);
        ensureBranches(next);
        const target = b === "dark" ? next.mapOverrides!.dark! : next.mapOverrides!.light!;
        if (!(key in target)) return prev;
        delete target[key];
        return next;
      });
    },
    [darkMode],
  );

  const discardDraft = React.useCallback(() => {
    setDraft(cloneDoc(persisted));
    setStatus(null);
  }, [persisted]);

  const saveAndSync = React.useCallback(async (): Promise<SaveResult> => {
    setStatus(null);
    if (!saveApiAvailable) {
      setStatus("Save API unavailable — run `npm run dev` and retry.");
      return { ok: false, error: "Save API unavailable" };
    }
    try {
      const res = await fetch(devApi("/api/save-design-tokens"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonText: JSON.stringify(draft, null, 2) }),
      });
      const body = (await res.json().catch(() => ({}))) as SaveResult;
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      if (!body.ok || !body.fileWritten) throw new Error(body.error ?? "Not written to disk");
      const parts: string[] = ["Saved to tokens.json."];
      if (body.syncOk === false && body.syncError) {
        parts.push(`⚠️ sync:tokens failed: ${body.syncError}`);
      } else if (body.syncOk !== false) {
        parts.push("sync:tokens ran — design-tokens.generated.css updated.");
      }
      setStatus(parts.join(" "));
      // commit: persisted snaps to current draft
      setPersisted(cloneDoc(draft));
      return body;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`Save failed: ${msg}`);
      return { ok: false, error: msg };
    }
  }, [draft, saveApiAvailable]);

  const resolvedVars = React.useMemo(() => computeVars(draft, darkMode), [draft, darkMode]);

  return {
    loading,
    loadError,
    status,
    saveApiAvailable,
    persisted,
    draft,
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
    reload,
    saveAndSync,
    resolvedVars,
  };
}

/** Read a seed value for a given group config + current darkMode. */
export function readSeedValue(
  draft: TokensDocV2,
  source: "seed" | "customSeeds" | "fixedAliases",
  key: string,
  dark: boolean,
): string {
  if (source === "seed") {
    if (dark && draft.seedDark?.[key] !== undefined) return String(draft.seedDark[key]);
    return String(draft.seed[key] ?? "");
  }
  if (source === "customSeeds") {
    if (dark && /^chart\d$/.test(key)) {
      const darkKey = `${key}Dark`;
      const v = draft.customSeeds?.[darkKey];
      if (v !== undefined) return String(v);
    }
    return String(draft.customSeeds?.[key] ?? "");
  }
  return String(draft.fixedAliases?.[key] ?? "");
}
