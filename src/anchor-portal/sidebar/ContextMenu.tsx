import * as React from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

type MenuState = {
  x: number;
  y: number;
  componentName: string;
  importPath: string;
} | null;

const subscribers = new Set<(state: MenuState) => void>();
let current: MenuState = null;

export function openContextMenu(s: NonNullable<MenuState>) {
  current = s;
  subscribers.forEach((fn) => fn(s));
}

export function closeContextMenu() {
  current = null;
  subscribers.forEach((fn) => fn(null));
}

/** Convert a registry glob key (`../anchor/component-demos/base/Button.demo.tsx`)
 *  into a repo-relative path (`src/anchor/component-demos/base/Button.demo.tsx`)
 *  that the schema API's delete endpoint understands. */
export function globPathToRepoPath(globKey: string): string {
  return globKey.replace(/^\.\.\//, "src/");
}

export function ComponentContextMenu() {
  const [state, setState] = React.useState<MenuState>(current);
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    subscribers.add(setState);
    return () => {
      subscribers.delete(setState);
    };
  }, []);

  React.useEffect(() => {
    if (!state) {
      setConfirm(false);
      setBusy(false);
      return;
    }
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [state]);

  if (!state) return null;

  async function doDelete() {
    if (!state) return;
    setBusy(true);
    try {
      const r = await fetch("/api/delete-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importPath: state.importPath }),
      });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !body.ok) throw new Error(body.error ?? r.statusText);
      closeContextMenu();
      window.location.reload();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert("Delete failed: " + String(e));
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: state.y, left: state.x, zIndex: 2147483647 }}
      className="min-w-[200px] rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg"
    >
      {confirm ? (
        <div className="px-3 py-2">
          <p className="mb-2 text-sm text-muted-foreground">
            Delete <strong>{state.componentName}</strong>? This removes the .demo.tsx, the
            component file, and the spec.json (if present).
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="rounded-md border border-border px-2 py-1 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void doDelete()}
              className="rounded-md bg-destructive px-2 py-1 text-sm font-medium text-destructive-foreground transition-opacity disabled:opacity-60"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-destructive transition-colors hover:bg-muted"
        >
          <Trash2 size={12} /> Delete component
        </button>
      )}
    </div>,
    document.body,
  );
}
