import { useCallback, useEffect, useState } from "react";

/** Same origin as Storybook preview; explicit origin to avoid relative paths missing Vite middleware */
function devApi(path: string): string {
  if (typeof window === "undefined" || !path.startsWith("/")) return path;
  return `${window.location.origin}${path}`;
}

export interface SchemaEditorProps {
  /** Default spec filename to open */
  defaultFilename?: string;
}

/**
 * Schema visual editor (shared between standalone Portal and Storybook).
 * Depends on dev server `/api/schema/*` and `/api/save-schema` (see vite-plugin-schema-api.mjs).
 */
export function SchemaEditor({ defaultFilename = "data-table.spec.json" }: SchemaEditorProps) {
  const [filename, setFilename] = useState(defaultFilename);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(devApi(`/api/schema/${encodeURIComponent(filename)}`));
      if (!res.ok) throw new Error(await res.text());
      const raw = await res.text();
      setText(raw);
    } catch (e) {
      setStatus(`Load failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setStatus(null);
    try {
      JSON.parse(text);
    } catch (e) {
      setStatus(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    try {
      const res = await fetch(devApi("/api/save-schema"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: text }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        fileWritten?: boolean;
        path?: string;
        syncOk?: boolean;
        syncError?: string | null;
        audit?: { passed: boolean; output: string } | null;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      if (!body.ok || !body.fileWritten) throw new Error(body.error ?? "Not written to disk");
      const parts: string[] = [`Written to disk: ${body.path ?? filename}`];
      if (body.syncOk === false && body.syncError) {
        parts.push(
          `⚠️ sync:accord failed (spec saved to disk, please manually run npm run sync:accord in your terminal):\n${body.syncError}`,
        );
      } else if (body.syncOk !== false) {
        parts.push("sync:accord executed.");
      }
      if (body.audit && body.audit.passed === false) parts.push(`⚠️ Audit: ${body.audit.output}`);
      setStatus(parts.join("\n"));
      await load();
    } catch (e) {
      setStatus(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
      <header className="space-y-1 border-b border-zinc-700 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">DesignAccord · Spec</h1>
        <p className="text-sm text-zinc-400">
          Edit <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-200">*.spec.json</code> directly here (source of truth is the file on disk, not rewritten by cloud models); after saving, automatically syncs
          Tailwind artifacts, <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-200">.cursorrules</code> and{" "}
          <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-200">ACCORD_RULES.md</code>.
          The Storybook "Spec" panel on the right provides split-pane editing (including sub-component display name, Intent, directives, etc.); Props / styleLock and other fields can also be maintained in this JSON.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-400">File</span>
          <input
            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-sm"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
          onClick={() => void load()}
        >
          Reload
        </button>
        <button
          type="button"
          className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 shadow-sm hover:bg-zinc-800"
          onClick={() => void save()}
        >
          Save & Sync
        </button>
        {loading ? <span className="text-sm text-zinc-500">Loading...</span> : null}
      </div>

      {status ? (
        <div className="rounded-md border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm whitespace-pre-wrap text-zinc-200">{status}</div>
      ) : null}

      <textarea
        className="min-h-[480px] flex-1 rounded-lg border border-zinc-600 bg-zinc-950 p-4 font-mono text-sm leading-relaxed text-zinc-100 shadow-inner"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
