import * as React from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddComponentDialog({ open, onClose }: Props) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  const reset = React.useCallback(() => {
    setFile(null);
    setBusy(false);
    setError(null);
  }, []);

  const close = React.useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-component", { method: "POST", body: fd });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error ?? res.statusText);
      close();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      className="m-0 w-[480px] max-w-[90vw] rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-zinc-950/30 backdrop:backdrop-blur-md"
    >
      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Add Component</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Upload size={14} />
            Upload .tsx component file
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setError(null);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-6 py-8 text-xs transition-colors hover:border-foreground/40",
              file ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted/40 text-muted-foreground",
            )}
          >
            <Upload size={20} />
            {file ? <span className="font-semibold">{file.name}</span> : <span>Click to select .tsx file</span>}
          </button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Files are added to <code className="font-mono">src/components/starter/</code>. A starter <code className="font-mono">*.demo.tsx</code>
            is generated automatically if one does not already exist.
          </p>
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || busy}
            onClick={() => void upload()}
            className="rounded-md bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload Component"}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
