import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";
import {
  normalizePrimitives,
  serializePrimitives,
  type WrapPrimitiveInput,
  type WrapPrimitiveRef,
} from "@/anchor/schema/types";
import { useStorySession } from "../usePreviewState";

type SpecData = {
  id: string;
  componentName: string;
  version: string;
  intent: string;
  wraps: { module: string; primitives: WrapPrimitiveRef[] };
  requiredProps: PropEntry[];
  optionalProps?: PropEntry[];
  styleLock: { baselineTokens: string[]; blacklist: BlacklistRule[] };
  aiPrompt: string;
  forbidden?: { htmlTag: string; reason: string; useInstead: string }[];
  corrections?: { id: string; violation: string; fixPrompt: string }[];
  referencePriority: string[];
  examples?: { title: string; description?: string; snippet: string }[];
  tailwindExtend?: Record<string, Record<string, string>>;
  meta?: Record<string, unknown>;
};

type PropEntry = {
  name: string;
  description: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  enumMap?: Record<string, string[]>;
};

type BlacklistRule = { description: string; pattern: string };

type SchemaListItem = { filename: string; id: string; componentName: string };

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function deepMergePlain(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const pb = patch[k];
    const bk = base[k];
    out[k] = isPlainObject(pb) && isPlainObject(bk) ? deepMergePlain(bk, pb) : pb;
  }
  return out;
}

function deepMergeSpec(base: SpecData, patch: unknown): SpecData {
  if (!isPlainObject(patch)) return base;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch)) {
    if (k === "storyAnchor") continue;
    const pb = patch[k];
    const bk = (base as Record<string, unknown>)[k];
    out[k] = isPlainObject(pb) && isPlainObject(bk) ? deepMergePlain(bk, pb) : pb;
  }
  return out as SpecData;
}

const SPEC_PATCH_KEYS: (keyof SpecData)[] = [
  "id",
  "componentName",
  "version",
  "intent",
  "wraps",
  "requiredProps",
  "optionalProps",
  "styleLock",
  "aiPrompt",
  "forbidden",
  "corrections",
  "referencePriority",
  "examples",
  "tailwindExtend",
  "meta",
];

function extractPatch(edited: SpecData, base: SpecData): Record<string, unknown> | undefined {
  const patch: Record<string, unknown> = {};
  for (const key of SPEC_PATCH_KEYS) {
    if (JSON.stringify(edited[key]) !== JSON.stringify(base[key])) {
      patch[key as string] = edited[key] as unknown;
    }
  }
  return Object.keys(patch).length ? patch : undefined;
}

function normalizeBase(raw: Record<string, unknown>): SpecData {
  const wrapsRaw = raw.wraps;
  const wraps: SpecData["wraps"] = isPlainObject(wrapsRaw)
    ? {
        module: typeof wrapsRaw.module === "string" ? wrapsRaw.module : "",
        primitives: normalizePrimitives(wrapsRaw.primitives as WrapPrimitiveInput[]),
      }
    : { module: "", primitives: [] };
  return {
    id: String(raw.id ?? ""),
    componentName: String(raw.componentName ?? ""),
    version: String(raw.version ?? "1.0.0"),
    intent: String(raw.intent ?? ""),
    wraps,
    requiredProps: Array.isArray(raw.requiredProps) ? (raw.requiredProps as PropEntry[]) : [],
    optionalProps: Array.isArray(raw.optionalProps) ? (raw.optionalProps as PropEntry[]) : undefined,
    styleLock: isPlainObject(raw.styleLock)
      ? {
          baselineTokens: Array.isArray((raw.styleLock as Record<string, unknown>).baselineTokens)
            ? ((raw.styleLock as Record<string, unknown>).baselineTokens as string[])
            : [],
          blacklist: Array.isArray((raw.styleLock as Record<string, unknown>).blacklist)
            ? ((raw.styleLock as Record<string, unknown>).blacklist as BlacklistRule[])
            : [],
        }
      : { baselineTokens: [], blacklist: [] },
    aiPrompt: String(raw.aiPrompt ?? ""),
    forbidden: Array.isArray(raw.forbidden) ? (raw.forbidden as SpecData["forbidden"]) : [],
    corrections: Array.isArray(raw.corrections) ? (raw.corrections as SpecData["corrections"]) : [],
    referencePriority: Array.isArray(raw.referencePriority) ? (raw.referencePriority as string[]) : [],
    examples: Array.isArray(raw.examples) ? (raw.examples as SpecData["examples"]) : [],
    tailwindExtend: raw.tailwindExtend as SpecData["tailwindExtend"],
    meta: raw.meta as Record<string, unknown> | undefined,
  };
}

function compactForDisk(doc: Record<string, unknown>): Record<string, unknown> {
  function compactWraps(w: unknown): unknown {
    if (!isPlainObject(w)) return w;
    const pr = normalizePrimitives((w as Record<string, unknown>).primitives as WrapPrimitiveInput[]);
    return { ...w, primitives: serializePrimitives(pr) };
  }
  const out = { ...doc };
  if (out.wraps) out.wraps = compactWraps(out.wraps);
  if (isPlainObject(out.storyAnchor)) {
    const next: Record<string, unknown> = { ...(out.storyAnchor as Record<string, unknown>) };
    for (const [k, frag] of Object.entries(next)) {
      if (isPlainObject(frag) && (frag as Record<string, unknown>).wraps) {
        next[k] = { ...frag, wraps: compactWraps((frag as Record<string, unknown>).wraps) };
      }
    }
    out.storyAnchor = next;
  }
  return out;
}

function matchSchemaForTitle(schemas: SchemaListItem[], leafTitle: string | null): SchemaListItem | null {
  if (!leafTitle || schemas.length === 0) return null;
  const lower = leafTitle.toLowerCase().replace(/\s+/g, "");
  return (
    schemas.find((s) => s.componentName.toLowerCase() === lower) ??
    schemas.find((s) => lower.includes(s.componentName.toLowerCase())) ??
    schemas.find((s) => s.componentName.toLowerCase().includes(lower)) ??
    null
  );
}

/* ===================================================================== */
/*  Main panel                                                           */
/* ===================================================================== */

export function SpecPanel() {
  const { t } = useLocale();
  const { session } = useStorySession();
  const leafTitle = session?.story.componentTitle.split("/").pop() ?? null;
  const storyId = session?.story.id ?? null;
  const storyName = session?.story.storyName ?? null;

  const [schemas, setSchemas] = React.useState<SchemaListItem[]>([]);
  const [filename, setFilename] = React.useState("");
  const [base, setBase] = React.useState<SpecData | null>(null);
  const [anchorMap, setAnchorMap] = React.useState<Record<string, unknown>>({});
  const [spec, setSpec] = React.useState<SpecData | null>(null);
  const [status, setStatus] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/schemas")
      .then((r) => r.json())
      .then((list: SchemaListItem[]) => {
        if (!cancelled) setSchemas(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const matched = matchSchemaForTitle(schemas, leafTitle);
    if (matched && matched.filename !== filename) setFilename(matched.filename);
  }, [leafTitle, schemas, filename]);

  const load = React.useCallback(async () => {
    if (!filename) return;
    setLoading(true);
    setStatus(null);
    try {
      const r = await fetch(`/api/schema/${encodeURIComponent(filename)}`);
      if (!r.ok) throw new Error(await r.text());
      const raw = (await r.json()) as Record<string, unknown>;
      const shRaw = raw.storyAnchor;
      const map = isPlainObject(shRaw) ? { ...shRaw } : {};
      const { storyAnchor: _sh, ...rawBase } = raw;
      setAnchorMap(map);
      setBase(normalizeBase(rawBase));
    } catch (e) {
      setBase(null);
      setAnchorMap({});
      setSpec(null);
      setStatus({ text: `Load failed: ${String(e)}`, ok: false });
    } finally {
      setLoading(false);
    }
  }, [filename]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!base || !storyId) {
      setSpec(null);
      return;
    }
    const frag = anchorMap[storyId];
    const merged = deepMergeSpec(base, frag ?? {});
    setSpec({
      ...merged,
      wraps: {
        ...(merged.wraps ?? { module: "", primitives: [] }),
        primitives: normalizePrimitives((merged.wraps?.primitives ?? []) as WrapPrimitiveInput[]),
      },
    });
  }, [base, anchorMap, storyId]);

  function update<K extends keyof SpecData>(key: K, val: SpecData[K]) {
    if (!spec) return;
    setSpec({ ...spec, [key]: val });
  }

  async function save() {
    if (!spec || !filename || !base || !storyId) {
      setStatus({ text: "Select a specific story before saving.", ok: false });
      return;
    }
    setStatus(null);
    try {
      const pruned: SpecData = {
        ...spec,
        wraps: {
          ...spec.wraps,
          primitives: normalizePrimitives(spec.wraps.primitives as WrapPrimitiveInput[]),
        },
      };
      const patch = extractPatch(pruned, base);
      const newMap = { ...anchorMap };
      if (!patch) delete newMap[storyId];
      else newMap[storyId] = patch;
      const doc: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };
      if (Object.keys(newMap).length > 0) doc.storyAnchor = newMap;
      const r = await fetch("/api/save-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: JSON.stringify(compactForDisk(doc), null, 2) }),
      });
      const b = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        fileWritten?: boolean;
        path?: string;
        syncOk?: boolean;
        syncError?: string | null;
        audit?: { passed: boolean; output: string } | null;
        error?: string;
      };
      if (!r.ok) throw new Error(b.error ?? r.statusText);
      if (!b.ok || !b.fileWritten) throw new Error(b.error ?? "Not written to disk");
      const parts = [`Written to disk: ${b.path ?? filename}`];
      if (b.syncOk === false && b.syncError) {
        parts.push(`⚠️ sync:anchor failed (spec is saved):\n${b.syncError}`);
      } else if (b.syncOk !== false) {
        parts.push("sync:anchor executed.");
      }
      if (b.audit && b.audit.passed === false) parts.push(`⚠️ Audit: ${b.audit.output}`);
      const ok = b.syncOk !== false && (b.audit == null || b.audit.passed !== false);
      setStatus({ text: parts.join("\n"), ok });
      await load();
    } catch (e) {
      setStatus({ text: `Save failed: ${String(e)}`, ok: false });
    }
  }

  if (!session) {
    return (
      <CenterMessage>{t({ en: "Select a story from the sidebar to edit its Spec.json.", zh: "从左侧选一个 story 来编辑它的 Spec.json。" })}</CenterMessage>
    );
  }

  const matched = matchSchemaForTitle(schemas, leafTitle);
  if (!matched && leafTitle) {
    return (
      <CreateSchemaPrompt
        leafTitle={leafTitle}
        onCreated={(fn) => {
          setFilename(fn);
          fetch("/api/schemas")
            .then((r) => r.json())
            .then((list: SchemaListItem[]) => setSchemas(list))
            .catch(() => {});
        }}
      />
    );
  }

  if (loading && !base) return <CenterMessage>{t({ en: "Loading…", zh: "加载中…" })}</CenterMessage>;
  if (!spec) return <CenterMessage>{t({ en: "Select a component to view its spec.", zh: "选一个组件查看它的 spec。" })}</CenterMessage>;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-col gap-1.5 border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{spec.componentName}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{filename}</code>
        </div>
        {storyName ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {t({ en: "Variant:", zh: "变体：" })}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">{storyName}</code>
          </div>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 text-base">
        <Collapsible
          title={t({ en: "Spec · Intent & dependencies", zh: "Spec · 用途与依赖" })}
          hint={t({
            en: "Bound to the current story variant: saving writes storyAnchor[storyId], deep-merged with the base spec. Common: Intent, schema directives, primary import.",
            zh: "绑定到当前 story 变体：保存时写入 storyAnchor[storyId]，再与 base spec 深度合并。这里改的是 Intent、schema directive、primary import。",
          })}
          defaultOpen
        >
          <Field
            label={t({ en: "Intent", zh: "Intent（用途）" })}
            hint={t({
              en: "One judgable sentence: when this component is required and what counts as misuse.",
              zh: "一句可判别的话：什么时候必须用这个组件，什么算误用。",
            })}
          >
            <textarea
              value={spec.intent}
              onChange={(e) => update("intent", e.target.value)}
              rows={3}
              className={TX}
            />
          </Field>
          <Field
            label={t({ en: "Schema directive (written to .cursorrules)", zh: "Schema 指令（写入 .cursorrules）" })}
            hint={t({
              en: "Hard rules for code assistants: imports, variant/density values, forbidden Tailwind patterns.",
              zh: "给 AI 工具的硬规则：import 路径、variant/density 取值、禁用的 Tailwind 模式。",
            })}
          >
            <textarea
              value={spec.aiPrompt}
              onChange={(e) => update("aiPrompt", e.target.value)}
              rows={4}
              className={TX}
            />
          </Field>
          <Field
            label={t({ en: "Primary import path", zh: "推荐 import 路径" })}
            hint={t({
              en: "The most recommended path; multiple legal entries go in the full reference list below.",
              zh: "最推荐的那一条路径；多条合法 import 在下面的 reference 列表里全列。",
            })}
          >
            <input
              type="text"
              value={(spec.referencePriority ?? [])[0] ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const tail = (spec.referencePriority ?? []).slice(1);
                update("referencePriority", v ? [v, ...tail] : tail);
              }}
              className={cn(IN, "font-mono")}
              placeholder="@/components/business/…"
            />
          </Field>
        </Collapsible>

        <Collapsible
          title={t({ en: "Spec · Forbidden, Corrections & Few-shot", zh: "Spec · 禁用、纠正与示例" })}
          hint={t({
            en: "Aligns with anchor-audit and .cursorrules: HTML tag replacements, judgable violations → fix prompts, minimal JSX templates.",
            zh: "和 anchor-audit、.cursorrules 一致：HTML tag 替换、可判别的违规 → 改正 prompt、minimal JSX 模板。",
          })}
        >
          <Subheading hint={t({ en: "Each entry: HTML tag, why forbidden, replacement business component.", zh: "每条：HTML tag、为什么禁、替换用的业务组件。" })}>{t({ en: "Forbidden", zh: "禁用 (Forbidden)" })}</Subheading>
          {(spec.forbidden ?? []).map((f, i) => (
            <Card key={i}>
              <div className="grid grid-cols-3 gap-2">
                <Field label={t({ en: "HTML tag", zh: "HTML tag" })} compact>
                  <input
                    value={f.htmlTag}
                    onChange={(e) => {
                      const arr = [...(spec.forbidden ?? [])];
                      arr[i] = { ...f, htmlTag: e.target.value };
                      update("forbidden", arr);
                    }}
                    className={cn(IN, "font-mono")}
                  />
                </Field>
                <Field label={t({ en: "Reason", zh: "原因" })} compact>
                  <input
                    value={f.reason}
                    onChange={(e) => {
                      const arr = [...(spec.forbidden ?? [])];
                      arr[i] = { ...f, reason: e.target.value };
                      update("forbidden", arr);
                    }}
                    className={IN}
                  />
                </Field>
                <Field label={t({ en: "Use instead", zh: "改用" })} compact>
                  <input
                    value={f.useInstead}
                    onChange={(e) => {
                      const arr = [...(spec.forbidden ?? [])];
                      arr[i] = { ...f, useInstead: e.target.value };
                      update("forbidden", arr);
                    }}
                    className={IN}
                  />
                </Field>
              </div>
              <DeleteRowButton onClick={() => update("forbidden", (spec.forbidden ?? []).filter((_, j) => j !== i))} />
            </Card>
          ))}
          <AddRowButton
            label={t({ en: "Add forbidden", zh: "添加禁用项" })}
            onClick={() => update("forbidden", [...(spec.forbidden ?? []), { htmlTag: "", reason: "", useInstead: "" }])}
          />

          <Subheading hint={t({ en: "Pairs of judgable violation + fix instruction.", zh: "成对的「可判别违规 + 改正指令」。" })} topMargin>{t({ en: "Corrections", zh: "纠正 (Corrections)" })}</Subheading>
          {(spec.corrections ?? []).map((c, i) => (
            <Card key={i}>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <Field label={t({ en: "ID", zh: "ID" })} compact>
                  <input
                    value={c.id}
                    onChange={(e) => {
                      const arr = [...(spec.corrections ?? [])];
                      arr[i] = { ...c, id: e.target.value };
                      update("corrections", arr);
                    }}
                    className={cn(IN, "font-mono")}
                  />
                </Field>
                <Field label={t({ en: "Violation", zh: "违规描述" })} compact>
                  <input
                    value={c.violation}
                    onChange={(e) => {
                      const arr = [...(spec.corrections ?? [])];
                      arr[i] = { ...c, violation: e.target.value };
                      update("corrections", arr);
                    }}
                    className={IN}
                  />
                </Field>
              </div>
              <Field label={t({ en: "Fix prompt", zh: "修复 prompt" })} compact>
                <input
                  value={c.fixPrompt}
                  onChange={(e) => {
                    const arr = [...(spec.corrections ?? [])];
                    arr[i] = { ...c, fixPrompt: e.target.value };
                    update("corrections", arr);
                  }}
                  className={IN}
                />
              </Field>
              <DeleteRowButton onClick={() => update("corrections", (spec.corrections ?? []).filter((_, j) => j !== i))} />
            </Card>
          ))}
          <AddRowButton
            label={t({ en: "Add correction", zh: "添加纠正项" })}
            onClick={() => update("corrections", [...(spec.corrections ?? []), { id: "", violation: "", fixPrompt: "" }])}
          />

          <Subheading hint={t({ en: "1–2 examples per component: title + optional one-liner + minimal JSX.", zh: "每个组件 1–2 个示例：标题 + 可选一句描述 + 最小 JSX。" })} topMargin>{t({ en: "Examples (Few-shot)", zh: "示例 (Few-shot)" })}</Subheading>
          <ExamplesEditor examples={spec.examples ?? []} onChange={(v) => update("examples", v)} />
        </Collapsible>

        <Collapsible
          title={t({ en: "Engineering · id / wraps / props / styleLock / refs", zh: "工程字段 · id / wraps / props / styleLock / refs" })}
          hint={t({
            en: "Component id/version, wraps.module + primitives, prop types + enumMap, styleLock patterns, reference list.",
            zh: "组件 id/version、wraps.module + primitives、prop 类型 + enumMap、styleLock 模式、reference 列表。",
          })}
        >
          <div className="grid grid-cols-[1fr_1fr_100px] gap-2">
            <Field label={t({ en: "Component name", zh: "组件名" })} compact>
              <input value={spec.componentName} onChange={(e) => update("componentName", e.target.value)} className={IN} />
            </Field>
            <Field label="ID" compact>
              <input value={spec.id} onChange={(e) => update("id", e.target.value)} className={IN} />
            </Field>
            <Field label={t({ en: "Version", zh: "Version" })} compact>
              <input value={spec.version} onChange={(e) => update("version", e.target.value)} className={IN} />
            </Field>
          </div>
          <Subheading hint={t({ en: "module points to the base/ui re-export; primitives are sub-components exported.", zh: "module 指向 base/ui 的 re-export；primitives 是导出的子组件。" })} topMargin>{t({ en: "Wraps", zh: "Wraps（封装）" })}</Subheading>
          <Field label={t({ en: "Module path", zh: "Module 路径" })} compact>
            <input value={spec.wraps.module} onChange={(e) => update("wraps", { ...spec.wraps, module: e.target.value })} className={IN} />
          </Field>
          <PrimitivesEditor
            primitives={spec.wraps.primitives}
            onChange={(p) => update("wraps", { ...spec.wraps, primitives: p })}
          />

          <Subheading topMargin>{t({ en: "Style lock", zh: "Style lock（样式锁）" })}</Subheading>
          <Field label={t({ en: "Baseline tokens (comma-separated)", zh: "Baseline tokens（逗号分隔）" })} compact>
            <input
              value={spec.styleLock.baselineTokens.join(", ")}
              onChange={(e) =>
                update("styleLock", {
                  ...spec.styleLock,
                  baselineTokens: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              className={IN}
            />
          </Field>
          <BlacklistEditor
            rules={spec.styleLock.blacklist}
            onChange={(bl) => update("styleLock", { ...spec.styleLock, blacklist: bl })}
          />

          <Subheading hint={t({ en: "First line should match Primary import above.", zh: "第一行应与上方的「推荐 import 路径」一致。" })} topMargin>{t({ en: "Reference priority", zh: "Reference 优先级" })}</Subheading>
          <textarea
            value={(spec.referencePriority ?? []).join("\n")}
            onChange={(e) => update("referencePriority", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
            rows={3}
            className={cn(TX, "font-mono")}
          />
        </Collapsible>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-2">
        {status ? (
          <div
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-sm whitespace-pre-wrap",
              status.ok
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {status.text}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw size={11} /> {t({ en: "Reload", zh: "重新加载" })}
        </button>
        <button
          type="button"
          onClick={() => void save()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Save size={11} /> {t({ en: "Save", zh: "保存" })}
        </button>
      </footer>
    </div>
  );
}

/* ===================================================================== */
/*  Sub-components                                                       */
/* ===================================================================== */

const IN = "block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";
const TX = "block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm leading-relaxed text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none resize-vertical font-mono";

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function Collapsible({
  title,
  hint,
  defaultOpen,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  return (
    <div className="mb-3 overflow-visible rounded-md border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-t-md bg-muted/40 px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <span className="truncate">{title}</span>
          {hint ? <InfoTip text={hint} /> : null}
        </span>
        <span className="shrink-0 text-sm font-normal text-muted-foreground">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>
      {open ? <div className="border-t border-border px-3 py-3">{children}</div> : null}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex items-center text-muted-foreground/80">
      <Info size={11} />
    </span>
  );
}

function Field({
  label,
  hint,
  children,
  compact,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", compact ? "mb-2" : "mb-3")}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        {label}
        {hint ? <InfoTip text={hint} /> : null}
      </div>
      {children}
    </div>
  );
}

function Subheading({
  children,
  hint,
  topMargin,
}: {
  children: React.ReactNode;
  hint?: string;
  topMargin?: boolean;
}) {
  return (
    <div className={cn("mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground", topMargin && "mt-4")}>
      {children}
      {hint ? <InfoTip text={hint} /> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 rounded-md border border-border bg-muted/30 p-2.5">{children}</div>;
}

function DeleteRowButton({ onClick }: { onClick: () => void }) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Trash2 size={10} /> {t({ en: "Delete", zh: "删除" })}
    </button>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Plus size={11} /> {label}
    </button>
  );
}

function PrimitivesEditor({
  primitives,
  onChange,
}: {
  primitives: WrapPrimitiveRef[];
  onChange: (next: WrapPrimitiveRef[]) => void;
}) {
  const { t } = useLocale();
  const rows = primitives.length > 0 ? primitives : [{ symbol: "" }];
  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-b border-border/60 pb-2">
          <Field label={t({ en: "Export symbol", zh: "导出符号" })} compact>
            <input
              value={row.symbol}
              onChange={(e) => {
                const next = [...primitives];
                if (!next[i]) next[i] = { symbol: e.target.value };
                else next[i] = { ...next[i], symbol: e.target.value };
                onChange(next);
              }}
              className={cn(IN, "font-mono")}
              placeholder="e.g. DialogContent"
            />
          </Field>
          <Field label={t({ en: "Display name (optional)", zh: "显示名（可选）" })} compact>
            <input
              value={row.displayName ?? ""}
              onChange={(e) => {
                const next = [...primitives];
                const base = next[i] ?? { symbol: "" };
                const v = e.target.value.trim();
                next[i] = v ? { ...base, displayName: v } : { symbol: base.symbol };
                onChange(next);
              }}
              className={IN}
              placeholder="Defaults to symbol"
            />
          </Field>
          <button
            type="button"
            onClick={() => onChange(primitives.filter((_, j) => j !== i))}
            className="mb-2 rounded-md border border-border px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <AddRowButton label={t({ en: "Add sub-component", zh: "添加子组件" })} onClick={() => onChange([...primitives, { symbol: "" }])} />
    </div>
  );
}

function BlacklistEditor({
  rules,
  onChange,
}: {
  rules: BlacklistRule[];
  onChange: (r: BlacklistRule[]) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-1.5">
      {rules.map((rule, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_auto] items-center gap-2 border-b border-border/60 py-1">
          <input
            placeholder="Description"
            value={rule.description}
            onChange={(e) => {
              const n = [...rules];
              n[i] = { ...rule, description: e.target.value };
              onChange(n);
            }}
            className={IN}
          />
          <input
            placeholder="pattern"
            value={rule.pattern}
            onChange={(e) => {
              const n = [...rules];
              n[i] = { ...rule, pattern: e.target.value };
              onChange(n);
            }}
            className={cn(IN, "font-mono")}
          />
          <button
            type="button"
            onClick={() => onChange(rules.filter((_, j) => j !== i))}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <AddRowButton label={t({ en: "Add blacklist rule", zh: "添加黑名单规则" })} onClick={() => onChange([...rules, { description: "", pattern: "" }])} />
    </div>
  );
}

function ExamplesEditor({
  examples,
  onChange,
}: {
  examples: NonNullable<SpecData["examples"]>;
  onChange: (next: NonNullable<SpecData["examples"]>) => void;
}) {
  const { t } = useLocale();
  const list = examples ?? [];
  return (
    <div className="space-y-2">
      {list.map((ex, i) => (
        <Card key={i}>
          <Field label={t({ en: `Example title ${i + 1}`, zh: `示例标题 ${i + 1}` })} compact>
            <input
              value={ex.title}
              onChange={(e) => {
                const n = [...list];
                n[i] = { ...ex, title: e.target.value };
                onChange(n);
              }}
              className={IN}
            />
          </Field>
          <Field label={t({ en: "One-line description (optional)", zh: "一句话描述（可选）" })} compact>
            <input
              value={ex.description ?? ""}
              placeholder="e.g.: Primary button within list row"
              onChange={(e) => {
                const n = [...list];
                const v = e.target.value.trim();
                n[i] = { ...ex, ...(v ? { description: v } : { description: undefined }) };
                onChange(n);
              }}
              className={IN}
            />
          </Field>
          <Field label={t({ en: "Minimal JSX", zh: "最小 JSX" })} hint={t({ en: "Written into .cursorrules as a template.", zh: "作为模板写入 .cursorrules。" })} compact>
            <textarea
              value={ex.snippet}
              rows={3}
              placeholder='e.g.: <BusinessButton variant="default">Save</BusinessButton>'
              onChange={(e) => {
                const n = [...list];
                n[i] = { ...ex, snippet: e.target.value };
                onChange(n);
              }}
              className={TX}
            />
          </Field>
          <DeleteRowButton onClick={() => onChange(list.filter((_, j) => j !== i))} />
        </Card>
      ))}
      {list.length < 2 ? (
        <AddRowButton label={t({ en: "Add example (max 2)", zh: "添加示例（最多 2 个）" })} onClick={() => onChange([...list, { title: `Example ${list.length + 1}`, snippet: "" }])} />
      ) : null}
    </div>
  );
}

function CreateSchemaPrompt({
  leafTitle,
  onCreated,
}: {
  leafTitle: string;
  onCreated: (filename: string) => void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const kebab = leafTitle.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/\s+/g, "-");
  const filename = `${kebab}.spec.json`;

  async function create() {
    setBusy(true);
    setError(null);
    const spec = {
      id: kebab,
      componentName: leafTitle,
      version: "1.0.0",
      intent: "",
      wraps: { module: `@/components/base/${kebab}`, primitives: [leafTitle] },
      requiredProps: [],
      optionalProps: [],
      styleLock: { baselineTokens: [], blacklist: [] },
      aiPrompt: "",
      forbidden: [],
      corrections: [],
      referencePriority: [],
      meta: { tags: [], category: "ui", status: "draft" },
    };
    try {
      const r = await fetch("/api/save-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: JSON.stringify(spec, null, 2) }),
      });
      const b = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !b.ok) throw new Error(b.error ?? r.statusText);
      onCreated(filename);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-sm font-medium text-foreground">{leafTitle}</span>
      <p className="max-w-xs text-xs text-muted-foreground">
        {t({
          en: "No Spec has been created for this component yet (*.spec.json).",
          zh: "这个组件还没有 Spec（*.spec.json）。",
        })}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void create()}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity disabled:opacity-60"
      >
        <Plus size={12} /> {busy ? t({ en: "Creating…", zh: "创建中…" }) : t({ en: "Create Spec", zh: "创建 Spec" })}
      </button>
      {error ? <p className="max-w-xs text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
