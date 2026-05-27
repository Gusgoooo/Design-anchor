import * as React from "react";
import { FolderInput, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ImportResult = {
  ok?: boolean;
  imported?: string[];
  errors?: { file: string; error: string }[];
  kind?: "file" | "folder";
  error?: string;
};

/**
 * Imports a React + Tailwind .tsx file or folder into
 * src/components/base/ by reading from a local path on the dev machine.
 * The dev-only Vite middleware (/api/import-component-path) does the
 * filesystem work; this dialog is just the input.
 */
export function AddComponentDialog({ open, onClose }: Props) {
  const { t } = useLocale();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [path, setPath] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<ImportResult | null>(null);

  React.useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  const reset = React.useCallback(() => {
    setPath("");
    setBusy(false);
    setError(null);
    setSuccess(null);
  }, []);

  const close = React.useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  async function submit() {
    if (!path.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/import-component-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as ImportResult;
      if (!res.ok || !body.ok) throw new Error(body.error ?? res.statusText);
      setSuccess(body);
      // Give the user a moment to see the success, then reload to pick up
      // the newly registered demo files.
      setTimeout(() => {
        close();
        window.location.reload();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && path.trim() && !busy) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      className="fixed left-1/2 top-1/2 w-[520px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-zinc-950/30 backdrop:backdrop-blur-md"
    >
      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">{t({ en: "Add Component", zh: "添加组件" })}</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t({ en: "Close", zh: "关闭" })}
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FolderInput size={14} />
            {t({ en: "Import React + Tailwind .tsx file or folder", zh: "导入 React + Tailwind .tsx 文件或文件夹" })}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm uppercase tracking-wider text-muted-foreground">
              {t({ en: "Local path", zh: "本地路径" })}
            </span>
            <input
              type="text"
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              onKeyDown={onKeyDown}
              placeholder="/Users/you/project/components/Button.tsx"
              spellCheck={false}
              autoComplete="off"
              autoFocus
              className="h-9 rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
            />
            <span className="text-sm leading-snug text-muted-foreground">
              {t({
                en: "Only React + Tailwind components are supported. Absolute path. ~ expands to $HOME. A folder imports .tsx files (skipping *.demo.tsx). Files copy to src/components/base/; a matching *.demo.tsx is auto-generated if missing.",
                zh: "仅支持 React + Tailwind 组件。绝对路径，~ 会扩展为 $HOME。指向文件夹时会导入 .tsx（跳过 *.demo.tsx）。文件会复制到 src/components/base/；如果没有同名 *.demo.tsx 会自动生成一个。",
              })}
            </span>
          </label>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              <div className="font-medium">
                {t({
                  en: `Imported ${success.imported?.length ?? 0} ${success.kind === "folder" ? "files" : "file"}.`,
                  zh: `已导入 ${success.imported?.length ?? 0} ${success.kind === "folder" ? "个文件" : "个文件"}。`,
                })}
              </div>
              {success.errors && success.errors.length > 0 ? (
                <div className="mt-1">
                  {t({
                    en: `Skipped ${success.errors.length} with errors. Reloading…`,
                    zh: `跳过 ${success.errors.length} 个（含报错）。重新加载中…`,
                  })}
                </div>
              ) : (
                <div className="mt-1">{t({ en: "Reloading…", zh: "重新加载中…" })}</div>
              )}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t({ en: "Cancel", zh: "取消" })}
          </button>
          <button
            type="button"
            disabled={!path.trim() || busy}
            onClick={() => void submit()}
            className={cn(
              "rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {busy ? t({ en: "Importing…", zh: "导入中…" }) : t({ en: "Import", zh: "导入" })}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
