import * as React from "react";
import { createPortal } from "react-dom";
import { create } from "storybook/internal/theming";
import {
  addons,
  types,
  useStorybookApi,
  useStorybookState,
  type API,
} from "storybook/internal/manager-api";
import type { API_ComponentEntry, API_HashEntry } from "storybook/internal/types";
import {
  normalizePrimitives,
  serializePrimitives,
  type WrapPrimitiveInput,
  type WrapPrimitiveRef,
} from "../src/anchor/schema/types";

/* ── Dark mode basics ── */
const DARK_KEY = "anchor-dark-mode";
const _initDark = typeof localStorage !== "undefined" && localStorage.getItem(DARK_KEY) === "true";
if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", _initDark);

const lightTheme = create({
  base: "light",
  appBg: "#ffffff",
  appContentBg: "#ffffff",
  appBorderColor: "#e4e4e7",
  appBorderRadius: 8,
  textColor: "#18181b",
  textMutedColor: "#71717a",
  barBg: "#ffffff",
  barTextColor: "#18181b",
  barSelectedColor: "#18181b",
  brandTitle: "Design-anchor",
  colorPrimary: "#18181b",
  colorSecondary: "#18181b",
  inputBg: "#ffffff",
  inputBorder: "#e4e4e7",
  inputTextColor: "#18181b",
});

const darkTheme = create({
  base: "dark",
  appBg: "#1c1c1e",
  appContentBg: "#1c1c1e",
  appBorderColor: "#3f3f46",
  appBorderRadius: 8,
  textColor: "#fafafa",
  textMutedColor: "#a1a1aa",
  barBg: "#1c1c1e",
  barTextColor: "#fafafa",
  barSelectedColor: "#fafafa",
  brandTitle: "Design-anchor",
  colorPrimary: "#fafafa",
  colorSecondary: "#fafafa",
  inputBg: "#27272a",
  inputBorder: "#3f3f46",
  inputTextColor: "#fafafa",
});

function useManagerDarkMode() {
  const [dark, setDark] = React.useState(_initDark);
  React.useEffect(() => {
    function apply() {
      const v = localStorage.getItem(DARK_KEY) === "true";
      setDark(v);
      document.documentElement.classList.toggle("dark", v);
    }
    window.addEventListener("storage", apply);
    const ch = new BroadcastChannel(DARK_KEY);
    ch.onmessage = () => apply();
    return () => { window.removeEventListener("storage", apply); ch.close(); };
  }, []);
  return dark;
}

const DarkCtx = React.createContext(false);
function useIsDark() { return React.useContext(DarkCtx); }

/* ── Helpers ── */

/** Storybook Manager shares origin with preview; explicit origin avoids relative paths missing Vite middleware in some environments */
function devApi(path: string): string {
  if (typeof window === "undefined" || !path.startsWith("/")) return path;
  return `${window.location.origin}${path}`;
}

function getImportPath(api: API, item: API_ComponentEntry): string | null {
  for (const cid of item.children) {
    try {
      const d = api.getData(cid);
      if (d && "importPath" in d && typeof (d as any).importPath === "string") return (d as any).importPath;
    } catch {}
  }
  return null;
}


/* ── Kit version diff dots (manifest-driven) ── */

type KitStatusData = {
  kitVersion?: string;
  syncedAt?: string;
  dotColors?: { new?: string; modified?: string };
  components?: Record<string, { status: "new" | "modified" | "unchanged"; file?: string }>;
};

const kitStatusCache: { data: KitStatusData | null; loading: boolean } = { data: null, loading: false };

function loadKitStatus(): KitStatusData | null {
  if (kitStatusCache.data) return kitStatusCache.data;
  if (kitStatusCache.loading) return null;
  kitStatusCache.loading = true;
  fetch(devApi("/api/kit-status"))
    .then(r => r.json())
    .then((d: KitStatusData) => { kitStatusCache.data = d; })
    .catch(() => { kitStatusCache.data = { components: {} }; })
    .finally(() => { kitStatusCache.loading = false; });
  return null;
}

function useKitStatus(): KitStatusData | null {
  const [data, setData] = React.useState<KitStatusData | null>(() => loadKitStatus());
  React.useEffect(() => {
    if (data) return;
    const id = setInterval(() => {
      const d = loadKitStatus();
      if (d) { setData(d); clearInterval(id); }
    }, 300);
    return () => clearInterval(id);
  }, [data]);
  return data;
}

function getComponentKitStatus(kitStatus: KitStatusData | null, item: API_ComponentEntry): "new" | "modified" | "unchanged" | null {
  if (!kitStatus?.components) return null;
  const name = item.name;
  const entry = kitStatus.components[name];
  if (entry) return entry.status;
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(kitStatus.components)) {
    if (k.toLowerCase() === lower) return v.status;
  }
  return null;
}


/* ── Inline SVG icons ── */

const IcoPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcoSwatch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="12" r="1" fill="currentColor"/></svg>;
const IcoX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
/** Circled i, used for Anchor panel info */
const IcoInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

/** Shows info on hover/focus; fixed positioning prevents clipping by collapsed area overflow */
function InfoTip({ text }: { text: string }) {
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0, maxW: 280 });
  const closeT = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeT.current) clearTimeout(closeT.current);
    closeT.current = null;
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeT.current = setTimeout(() => setOpen(false), 140);
  }, [cancelClose]);

  const updatePos = React.useCallback(() => {
    const btn = wrapRef.current?.querySelector("button");
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const maxW = 280;
    const maxH = 200;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - maxW - 8);
    const gap = 6;
    let top = r.bottom + gap;
    if (top + maxH > window.innerHeight - 8) top = Math.max(8, r.top - maxH - gap);
    setPos({ top, left, maxW });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePos]);

  const tip = open && typeof document !== "undefined"
    ? createPortal(
        <div
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            maxWidth: pos.maxW,
            maxHeight: 200,
            overflowY: "auto" as const,
            zIndex: 2147483647,
            padding: "8px 10px",
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "#fafafa",
            background: "#27272a",
            borderRadius: 6,
            boxShadow: "0 4px 14px rgba(0,0,0,.2)",
            pointerEvents: "auto" as const,
          }}
        >
          {text}
        </div>,
        document.body,
      )
    : null;

  return (
    <span
      ref={wrapRef}
      style={{ position: "relative", display: "inline-flex", flexShrink: 0, alignItems: "center", verticalAlign: "middle" }}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label="Info"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onFocus={() => { cancelClose(); setOpen(true); updatePos(); }}
        onBlur={scheduleClose}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          padding: 0,
          border: "none",
          borderRadius: 4,
          background: "transparent",
          color: "var(--mgr-text-tertiary)",
          cursor: "help",
        }}
      >
        <IcoInfo />
      </button>
      {tip}
    </span>
  );
}
const IcoUp = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;

/* ── Custom sidebar icons ── */
const IcoChevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 150ms ease", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IcoComponent = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z"/><path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z"/></svg>;
const IcoStory = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>;
const IcoBrain = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>;
const IcoGrid = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;

/* ── Custom sidebar tree component (replaces native Storybook tree, Tailwind sidebar block style) ── */

type TreeNode = {
  id: string;
  name: string;
  type: string;
  children: TreeNode[];
};

const HIDDEN_IDS = new Set(["designtoken", "designtoken--docs", "patterns", "patterns--docs"]);

function buildSidebarTree(index: Record<string, API_HashEntry> | undefined): TreeNode[] {
  if (!index || Object.keys(index).length === 0) return [];
  const idx = index;
  const roots: TreeNode[] = [];

  function buildNode(id: string): TreeNode | null {
    const entry = idx[id];
    if (!entry || HIDDEN_IDS.has(id)) return null;
    const children: TreeNode[] = [];
    if ("children" in entry && Array.isArray(entry.children)) {
      for (const cid of entry.children) {
        const child = buildNode(cid);
        if (child) children.push(child);
      }
    }
    return { id: entry.id, name: entry.name, type: entry.type, children };
  }

  for (const entry of Object.values(index)) {
    if (entry.type === "root") {
      const node = buildNode(entry.id);
      if (node) roots.push(node);
    }
  }
  return roots;
}

function SidebarTreeItem({
  node,
  api,
  currentStoryId,
  expandedMap,
  onToggle,
  depth,
}: {
  node: TreeNode;
  api: API;
  currentStoryId: string | undefined;
  expandedMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  depth: number;
}) {
  const dark = useIsDark();
  const isExpanded = expandedMap[node.id] ?? false;
  const isSelected = node.id === currentStoryId;
  const hasChildren = node.children.length > 0;
  const indent = depth * 16;

  const selectedBg = dark ? "#27272a" : "#f4f4f5";
  const hoverBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  if (node.type === "root") {
    const isAI = node.name === "AI";
    return (
      <div style={{ marginTop: depth === 0 ? 0 : undefined }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 12px 4px",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
          color: "var(--mgr-text-tertiary)",
          userSelect: "none",
        }}>
          <span style={{ display: "inline-flex", flexShrink: 0 }}>
            {isAI ? <IcoBrain /> : <IcoGrid />}
          </span>
          <span>{node.name}</span>
        </div>
        <div>
          {node.children.map(child => (
            <SidebarTreeItem key={child.id} node={child} api={api}
              currentStoryId={currentStoryId} expandedMap={expandedMap}
              onToggle={onToggle} depth={0} />
          ))}
        </div>
      </div>
    );
  }

  if (node.type === "component" || node.type === "group") {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            const wasExpanded = expandedMap[node.id] ?? false;
            onToggle(node.id);
            if (!wasExpanded && node.children.length > 0) {
              const first = node.children[0];
              if (first.type === "story" || first.type === "docs") {
                api.selectStory(first.id);
              }
            }
          }}
          onContextMenu={(e) => {
            if (node.type === "component") {
              e.preventDefault();
              e.stopPropagation();
              const entry = (api as any).getData?.(node.id) as API_ComponentEntry | undefined;
              if (entry) {
                const importPath = getImportPath(api, entry);
                if (importPath) {
                  ctxMenuBus.open({ x: e.clientX, y: e.clientY, item: entry, api, importPath });
                }
              }
            }
          }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            width: "100%", boxSizing: "border-box",
            padding: `5px 10px 5px ${12 + indent}px`,
            border: "none", borderRadius: 6,
            margin: "1px 6px", marginRight: 6,
            background: "transparent",
            color: "var(--mgr-text)",
            fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            cursor: "pointer", textAlign: "left",
            transition: "background 100ms ease",
          }}
          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--mgr-text-tertiary)", width: 12 }}>
            {hasChildren && <IcoChevron open={isExpanded} />}
          </span>
          <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--mgr-text-muted)" }}>
            <IcoComponent />
          </span>
          <span style={{
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{node.name}</span>
          <ComponentKitDot node={node} api={api} />
        </button>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => (
              <SidebarTreeItem key={child.id} node={child} api={api}
                currentStoryId={currentStoryId} expandedMap={expandedMap}
                onToggle={onToggle} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (node.type === "story" || node.type === "docs") {
    return (
      <button
        type="button"
        onClick={() => api.selectStory(node.id)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          width: "calc(100% - 12px)", boxSizing: "border-box",
          padding: `4px 10px 4px ${12 + indent + 16}px`,
          border: "none", borderRadius: 6,
          margin: "1px 6px",
          background: isSelected ? selectedBg : "transparent",
          color: isSelected ? "var(--mgr-text)" : "var(--mgr-text-secondary)",
          fontSize: 13, fontWeight: isSelected ? 500 : 400, fontFamily: "inherit",
          cursor: "pointer", textAlign: "left",
          transition: "background 100ms ease",
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? selectedBg : "transparent"; }}
      >
        <span style={{ display: "inline-flex", flexShrink: 0, color: isSelected ? "var(--mgr-text-muted)" : "var(--mgr-text-tertiary)" }}>
          <IcoStory />
        </span>
        <span style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{node.name}</span>
      </button>
    );
  }

  return null;
}

function ComponentKitDot({ node, api }: { node: TreeNode; api: API }) {
  const kitStatus = useKitStatus();
  if (!kitStatus?.components) return null;
  const entry = (api as any).getData?.(node.id) as API_ComponentEntry | undefined;
  if (!entry) return null;
  const status = getComponentKitStatus(kitStatus, entry);
  if (!status || status === "unchanged") return null;
  const colors = kitStatus.dotColors ?? {};
  const color = status === "new" ? (colors.new ?? "#3b82f6") : (colors.modified ?? "#f59e0b");
  return (
    <span style={{
      width: 6, height: 6, borderRadius: 9999,
      background: color, flexShrink: 0, marginLeft: "auto",
      boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
    }} />
  );
}

function SidebarTree() {
  const api = useStorybookApi();
  const state = useStorybookState();
  const tree = React.useMemo(() => buildSidebarTree(state.index), [state.index]);
  const [expandedMap, setExpandedMap] = React.useState<Record<string, boolean>>({});

  const onToggle = React.useCallback((id: string) => {
    setExpandedMap(prev => ({ ...prev, [id]: !(prev[id] ?? false) }));
  }, []);

  const currentStoryId = state.storyId;

  if (tree.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, color: "var(--mgr-text-tertiary)", fontSize: 13,
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 4, paddingBottom: 16 }}>
      {tree.map(rootNode => (
        <SidebarTreeItem key={rootNode.id} node={rootNode} api={api}
          currentStoryId={currentStoryId} expandedMap={expandedMap}
          onToggle={onToggle} depth={0} />
      ))}
    </div>
  );
}

/* ── Add component dialog (upload .tsx only) ── */

function AddComponentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tsxFile, setTsxFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const dlg = React.useRef<HTMLDialogElement>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { const e = dlg.current; if (!e) return; if (open && !e.open) e.showModal(); else if (!open && e.open) e.close(); }, [open]);

  function reset() { setTsxFile(null); setBusy(false); }
  function close() { reset(); onClose(); }

  async function upload() {
    if (!tsxFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("mode", "upload");
      fd.append("file", tsxFile);
      const r = await fetch(devApi("/api/upload-component"), { method: "POST", body: fd });
      if (r.ok) { close(); window.location.reload(); } else alert("Upload failed: " + (await r.text()));
    } catch (e) { alert(String(e)); } finally { setBusy(false); }
  }

  const dark = useIsDark();
  const D = {
    bg: dark ? "#1c1c1e" : "#fff",
    border: dark ? "#3f3f46" : "#e4e4e7",
    text: dark ? "#fafafa" : "#18181b",
    muted: dark ? "#a1a1aa" : "#71717a",
    blue: dark ? "#3b82f6" : "#2563eb",
    radius: 8,
    bgMuted: dark ? "#27272a" : "#fafafa",
  };

  return (
    <dialog ref={dlg} onClose={close} onClick={e => { if (e.target === dlg.current) close(); }}
      style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", margin: 0,
        width: 480, padding: 0,
        border: `1px solid ${D.border}`, borderRadius: 12, background: D.bg, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)",
        overflow: "hidden", color: D.text, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${D.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Add Component</span>
          <button type="button" onClick={close} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: D.muted, display: "flex" }}><IcoX /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: D.blue, marginBottom: 16 }}>
            <IcoUp /><span style={{ fontSize: 14, fontWeight: 600 }}>Upload .tsx component file</span>
          </div>
          <input ref={fileInput} type="file" accept=".tsx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setTsxFile(e.target.files[0]); }} />
          <button type="button" onClick={() => fileInput.current?.click()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32, width: "100%", boxSizing: "border-box",
              border: `2px dashed ${D.border}`, borderRadius: D.radius, background: tsxFile ? (dark ? "#052e16" : "#f0fdf4") : D.bgMuted,
              cursor: "pointer", color: tsxFile ? "#16a34a" : D.muted, fontSize: 13, fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = D.blue} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
            <IcoUp />{tsxFile ? <span style={{ fontWeight: 600 }}>{tsxFile.name}</span> : <span>Click to select .tsx file</span>}
          </button>
          <p style={{ fontSize: 12, color: D.muted, marginTop: 12, lineHeight: 1.5 }}>
            Supports uploading component files (*.tsx), files will be added to the src/components/starter/ directory.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: `1px solid ${D.border}` }}>
          <button type="button" onClick={close} style={{ padding: "8px 20px", fontSize: 13, background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radius, cursor: "pointer", fontFamily: "inherit", color: D.text }}>Cancel</button>
          <button type="button" disabled={!tsxFile || busy} onClick={() => void upload()} style={{
            padding: "8px 20px", fontSize: 13, fontWeight: 600, color: D.bg, background: D.text,
            border: "none", borderRadius: D.radius, cursor: "pointer", fontFamily: "inherit", opacity: (!tsxFile || busy) ? .5 : 1,
          }}>{busy ? "Uploading..." : "Upload Component"}</button>
        </div>
      </div>
    </dialog>
  );
}

/* ── Hide native sidebar tree & fix layout chain ── */

function useHideNativeSidebar() {
  React.useEffect(() => {
    function apply() {
      const container = document.querySelector(".sidebar-container");
      if (!container) return;

      container.querySelectorAll<HTMLElement>("nav").forEach(el => {
        el.style.display = "none";
      });
      container.querySelectorAll<HTMLElement>(".sidebar-subheading").forEach(el => {
        el.style.display = "none";
      });
      container.querySelectorAll<HTMLElement>(".search-field").forEach(el => {
        el.style.display = "none";
      });
      container.querySelectorAll<HTMLElement>('[data-action="create-new-story"], button[aria-label="Create a new story"]').forEach(el => {
        el.style.display = "none";
      });

      const header = container.querySelector<HTMLElement>(".sidebar-header");
      if (header) {
        let el: HTMLElement | null = header;
        while (el && el !== container) {
          el.style.height = "100%";
          el.style.maxHeight = "100%";
          el.style.overflow = "hidden";
          el = el.parentElement;
        }
        header.style.display = "flex";
        header.style.flexDirection = "column";
        header.style.height = "100%";
        header.style.overflow = "hidden";
      }

      const top = container.querySelector<HTMLElement>("[data-anchor-sidebar-top]");
      if (top) {
        top.style.flex = "1 1 0%";
        top.style.minHeight = "0";
      }
    }
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
}

/* ── Sidebar top ── */

function SidebarTop() {
  const api = useStorybookApi();
  const dark = useManagerDarkMode();
  const [addOpen, setAddOpen] = React.useState(false);
  useHideNativeSidebar();

  React.useEffect(() => {
    addons.setConfig({ theme: dark ? darkTheme : lightTheme });
  }, [dark]);

  const secColor = dark ? "#a1a1aa" : "#52525b";
  const secBorder = dark ? "#3f3f46" : "#e4e4e7";
  const secHoverBg = dark ? "#27272a" : "#f4f4f5";
  const secHoverText = dark ? "#fafafa" : "#18181b";
  const primaryBg = dark ? "#fafafa" : "#18181b";
  const primaryText = dark ? "#18181b" : "#fff";
  const primaryHover = dark ? "#d4d4d8" : "#333";
  const themeToggleIconColor = dark ? "#ffffff" : "var(--mgr-text-muted)";
  const themeToggleHoverColor = dark ? "#ffffff" : "#18181b";

  return (
    <DarkCtx.Provider value={dark}>
    <div data-anchor-sidebar-top="" style={{
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
      fontFamily: "system-ui,-apple-system,sans-serif",
    }}>
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0, display: "flex", flexDirection: "column", gap: 10,
        padding: "16px 12px 12px",
        borderBottom: `1px solid var(--mgr-border-light)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
          <div style={{ fontSize: 21, fontWeight: 700, color: "var(--mgr-text)", letterSpacing: "-0.01em", flex: 1 }}>
            Design-anchor
          </div>
          <button
            type="button"
            title="Toggle dark mode to preview all dark components"
            onClick={() => {
              const next = !dark;
              localStorage.setItem(DARK_KEY, String(next));
              document.documentElement.classList.toggle("dark", next);
              try { const ch = new BroadcastChannel(DARK_KEY); ch.postMessage(next); ch.close(); } catch {}
              window.dispatchEvent(new StorageEvent("storage", { key: DARK_KEY, newValue: String(next) }));
            }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, padding: 0, flexShrink: 0,
              border: "none", borderRadius: 6, cursor: "pointer",
              background: "transparent", color: themeToggleIconColor,
              transition: "color 120ms, background 120ms",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = dark ? "#27272a" : "#f4f4f5";
              e.currentTarget.style.color = themeToggleHoverColor;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = themeToggleIconColor;
            }}
          >
            {dark
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button type="button" onClick={() => setAddOpen(true)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "7px 12px",
            fontSize: 13, fontWeight: 500, color: primaryText, background: primaryBg,
            border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
            transition: "background 120ms",
          }}
            onMouseEnter={e => e.currentTarget.style.background = primaryHover}
            onMouseLeave={e => e.currentTarget.style.background = primaryBg}>
            <IcoPlus /> Add Component
          </button>

          <button type="button"
            onClick={() => api.selectStory("designtoken--docs", undefined, { viewMode: "docs" })}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", padding: "7px 12px",
              fontSize: 13, fontWeight: 500, color: secColor, background: "transparent",
              border: `1px solid ${secBorder}`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
              transition: "all 120ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = secHoverBg; e.currentTarget.style.color = secHoverText; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = secColor; }}>
            <IcoSwatch /> DesignToken
          </button>
        </div>
      </div>

      {/* ── Scrollable Tree ── */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: "auto", overflowX: "hidden",
      }}>
        <SidebarTree />
      </div>

      <AddComponentDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ComponentContextMenu />
    </div>
    </DarkCtx.Provider>
  );
}

/* ── Spec.json panel: spec editing linked to the current Story (persists to *.spec.json; optional storyAnchor variant layer) ── */

type SpecData = {
  id: string;
  componentName: string;
  version: string;
  intent: string;
  wraps: { module: string; primitives: WrapPrimitiveRef[] };
  requiredProps: { name: string; description: string; type: string; required: boolean; defaultValue?: unknown; enumMap?: Record<string, string[]> }[];
  optionalProps?: { name: string; description: string; type: string; required: boolean; defaultValue?: unknown; enumMap?: Record<string, string[]> }[];
  styleLock: { baselineTokens: string[]; blacklist: { description: string; pattern: string }[] };
  aiPrompt: string;
  forbidden?: { htmlTag: string; reason: string; useInstead: string }[];
  corrections?: { id: string; violation: string; fixPrompt: string }[];
  referencePriority: string[];
  /** Few-shot, written into .cursorrules, 1-2 per component recommended */
  examples?: { title: string; description?: string; snippet: string }[];
  tailwindExtend?: Record<string, Record<string, string>>;
  meta?: Record<string, unknown>;
};

type SchemaListItem = { filename: string; id: string; componentName: string };

type AnchorStoryContext = {
  storyId: string | null;
  storyName: string | null;
  componentTitle: string | null;
  leafTitle: string | null;
  isStory: boolean;
};

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function deepMergePlain(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const pb = patch[k];
    const bk = base[k];
    if (isPlainObject(pb) && isPlainObject(bk)) {
      out[k] = deepMergePlain(bk, pb);
    } else {
      out[k] = pb;
    }
  }
  return out;
}

/** Deep-merges variant patch into the component baseline spec (array fields are replaced wholesale) */
function deepMergeSpecData(base: SpecData, patch: unknown): SpecData {
  if (!isPlainObject(patch)) return base;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch)) {
    if (k === "storyAnchor") continue;
    const pb = patch[k];
    const bk = (base as Record<string, unknown>)[k];
    if (isPlainObject(pb) && isPlainObject(bk)) {
      out[k] = deepMergePlain(bk, pb);
    } else {
      out[k] = pb;
    }
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

/** Diff relative to component baseline -> writes to storyAnchor[storyId]; if no diff, deletes that variant entry */
function extractAnchorPatch(edited: SpecData, base: SpecData): Record<string, unknown> | undefined {
  const patch: Record<string, unknown> = {};
  for (const key of SPEC_PATCH_KEYS) {
    if (JSON.stringify(edited[key]) !== JSON.stringify(base[key])) {
      patch[key as string] = edited[key] as unknown;
    }
  }
  return Object.keys(patch).length ? patch : undefined;
}

function normalizeSpecBaseFromRaw(raw: Record<string, unknown>): SpecData {
  const { anchorNarrative: _hn, storyAnchor: _sh, ...rest } = raw;
  const r = rest as SpecData;
  const wrapsRaw = raw.wraps;
  const wraps: SpecData["wraps"] =
    wrapsRaw && typeof wrapsRaw === "object"
      ? {
          module:
            typeof (wrapsRaw as Record<string, unknown>).module === "string"
              ? ((wrapsRaw as Record<string, unknown>).module as string)
              : "",
          primitives: normalizePrimitives(
            (wrapsRaw as Record<string, unknown>).primitives as WrapPrimitiveInput[],
          ),
        }
      : { module: "", primitives: [] };
  return {
    ...r,
    wraps,
    forbidden: Array.isArray(raw.forbidden) ? raw.forbidden as SpecData["forbidden"] : [],
    corrections: Array.isArray(raw.corrections) ? raw.corrections as SpecData["corrections"] : [],
    examples: Array.isArray(raw.examples) ? raw.examples as SpecData["examples"] : [],
    referencePriority: Array.isArray(raw.referencePriority) ? raw.referencePriority as string[] : [],
  };
}

/** Compresses primitives notation before persisting, recursively processing storyAnchor fragments */
function compactSpecForDisk(doc: Record<string, unknown>): Record<string, unknown> {
  function compactWraps(w: unknown): unknown {
    if (!w || typeof w !== "object") return w;
    const o = w as Record<string, unknown>;
    const pr = normalizePrimitives(o.primitives as WrapPrimitiveInput[]);
    return { ...o, primitives: serializePrimitives(pr) };
  }
  const out = { ...doc };
  if (out.wraps) out.wraps = compactWraps(out.wraps);
  const sh = out.storyAnchor;
  if (sh && typeof sh === "object") {
    const next: Record<string, unknown> = { ...(sh as Record<string, unknown>) };
    for (const [k, frag] of Object.entries(next)) {
      if (frag && typeof frag === "object" && (frag as Record<string, unknown>).wraps != null) {
        next[k] = {
          ...(frag as Record<string, unknown>),
          wraps: compactWraps((frag as Record<string, unknown>).wraps),
        };
      }
    }
    out.storyAnchor = next;
  }
  return out;
}

const HS = {
  wrap: { padding: 0, fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 13, display: "flex", flexDirection: "column" as const, height: "100%", boxSizing: "border-box" as const, background: "var(--mgr-bg)" },
  header: { display: "flex", alignItems: "center" as const, gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--mgr-border)", flexShrink: 0 as const },
  body: { flex: 1, overflowY: "auto" as const, padding: "16px" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 600 as const, color: "var(--mgr-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 },
  field: { display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 500 as const, color: "var(--mgr-text-secondary)" },
  input: { padding: "6px 10px", fontSize: 13, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const, outline: "none", background: "var(--mgr-input-bg)", color: "var(--mgr-text)" },
  textarea: { padding: "6px 10px", fontSize: 13, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const, minHeight: 60, resize: "vertical" as const, outline: "none", lineHeight: 1.5, background: "var(--mgr-input-bg)", color: "var(--mgr-text)" },
  mono: { padding: "6px 10px", fontSize: 12, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "ui-monospace,monospace", width: "100%", boxSizing: "border-box" as const, minHeight: 40, resize: "vertical" as const, outline: "none", lineHeight: 1.5, background: "var(--mgr-input-bg)", color: "var(--mgr-text)" },
  tag: { display: "inline-block", padding: "2px 8px", fontSize: 11, background: "var(--mgr-bg-subtle)", borderRadius: 4, color: "var(--mgr-text-muted)", marginRight: 4, marginBottom: 4 },
  btn: (primary?: boolean) => ({
    padding: "6px 14px", fontSize: 12, fontWeight: 500 as const, border: primary ? "none" : "1px solid var(--mgr-border)",
    borderRadius: 6, cursor: "pointer" as const, fontFamily: "inherit",
    background: primary ? "var(--mgr-text)" : "var(--mgr-bg)", color: primary ? "var(--mgr-bg)" : "var(--mgr-text)",
  }),
  select: { padding: "6px 10px", fontSize: 13, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "inherit", background: "var(--mgr-input-bg)", color: "var(--mgr-text)", outline: "none" },
  status: { padding: "8px 12px", fontSize: 12, borderRadius: 6, margin: "0 16px 8px", whiteSpace: "pre-wrap" as const } as React.CSSProperties,
  propRow: { display: "flex", gap: 8, alignItems: "flex-start" as const, padding: "8px 0", borderBottom: "1px solid var(--mgr-bg-subtle)" },
  propName: { fontSize: 13, fontWeight: 600 as const, color: "var(--mgr-text)", minWidth: 100, flexShrink: 0 as const },
  blacklistRow: { display: "flex", gap: 8, alignItems: "center" as const, padding: "6px 0", borderBottom: "1px solid var(--mgr-bg-subtle)" },
};

function PropEditor({ prop, onChange }: { prop: SpecData["requiredProps"][0]; onChange: (p: SpecData["requiredProps"][0]) => void }) {
  return (
    <div style={{ border: "1px solid var(--mgr-border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--mgr-bg-muted)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={HS.label}>Name</div>
          <input style={HS.input} value={prop.name} onChange={e => onChange({ ...prop, name: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={HS.label}>Type</div>
          <input style={HS.input} value={prop.type} onChange={e => onChange({ ...prop, type: e.target.value })} />
        </div>
      </div>
      <div style={HS.label}>Description</div>
      <input style={HS.input} value={prop.description} onChange={e => onChange({ ...prop, description: e.target.value })} />
      {prop.enumMap && (
        <div style={{ marginTop: 6 }}>
          <div style={HS.label}>Enum Map (JSON)</div>
          <textarea style={HS.mono} value={JSON.stringify(prop.enumMap, null, 2)} onChange={e => {
            try { const v = JSON.parse(e.target.value); onChange({ ...prop, enumMap: v }); } catch {}
          }} />
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, hint, defaultOpen, children }: { title: string; hint?: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14, border: "1px solid var(--mgr-border)", borderRadius: 8, overflow: "visible", background: "var(--mgr-bg)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", background: "var(--mgr-bg-muted)", border: "none", cursor: "pointer",
          fontWeight: 600, fontSize: 13, color: "var(--mgr-text)", textAlign: "left" as const, fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          {hint ? <InfoTip text={hint} /> : null}
        </span>
        <span style={{ color: "var(--mgr-text-muted)", fontSize: 11, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{open ? "▼ Collapse" : "▶ Expand"}</span>
      </button>
      {open && <div style={{ padding: 12, borderTop: "1px solid var(--mgr-border)" }}>{children}</div>}
    </div>
  );
}

function ExamplesEditor({ examples, onChange }: { examples: NonNullable<SpecData["examples"]>; onChange: (next: NonNullable<SpecData["examples"]>) => void }) {
  const list = examples ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((ex, i) => (
        <div key={i} style={{ padding: 10, background: "var(--mgr-bg)", borderRadius: 6, border: "1px solid var(--mgr-border)" }}>
          <div style={HS.label}>Example Title {i + 1}</div>
          <input
            style={HS.input}
            value={ex.title}
            onChange={(e) => {
              const n = [...list];
              n[i] = { ...ex, title: e.target.value };
              onChange(n);
            }}
          />
          <div style={{ ...HS.label, marginTop: 6 }}>One-line description (optional)</div>
          <input
            style={HS.input}
            value={ex.description ?? ""}
            placeholder="e.g.: Primary button within list row"
            onChange={(e) => {
              const n = [...list];
              const v = e.target.value.trim();
              n[i] = { ...ex, ...(v ? { description: v } : { description: undefined }) };
              onChange(n);
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <div style={HS.label}>Minimal JSX</div>
            <InfoTip text="Minimal runnable JSX; after saving and sync, written into .cursorrules as a template for models to imitate structure and imports." />
          </div>
          <textarea
            style={{ ...HS.mono, minHeight: 64 }}
            value={ex.snippet}
            placeholder={'e.g.: <BusinessButton variant="default">Save</BusinessButton>'}
            onChange={(e) => {
              const n = [...list];
              n[i] = { ...ex, snippet: e.target.value };
              onChange(n);
            }}
          />
          <button
            type="button"
            style={{ ...HS.btn(), marginTop: 6, fontSize: 11 }}
            onClick={() => onChange(list.filter((_, j) => j !== i))}
          >
            Delete this example
          </button>
        </div>
      ))}
      {list.length < 2 && (
        <button
          type="button"
          style={{ ...HS.btn(), fontSize: 12 }}
          onClick={() => onChange([...list, { title: `Example ${list.length + 1}`, snippet: "" }])}
        >
          + Add example (max 2)
        </button>
      )}
    </div>
  );
}

function BlacklistEditor({ rules, onChange }: { rules: SpecData["styleLock"]["blacklist"]; onChange: (r: SpecData["styleLock"]["blacklist"]) => void }) {
  return (
    <div>
      {rules.map((rule, i) => (
        <div key={i} style={HS.blacklistRow}>
          <div style={{ flex: 2 }}>
            <input style={HS.input} placeholder="Description" value={rule.description} onChange={e => {
              const n = [...rules]; n[i] = { ...rule, description: e.target.value }; onChange(n);
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={{ ...HS.input, fontFamily: "ui-monospace,monospace", fontSize: 12 }} placeholder="pattern" value={rule.pattern} onChange={e => {
              const n = [...rules]; n[i] = { ...rule, pattern: e.target.value }; onChange(n);
            }} />
          </div>
          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mgr-text-tertiary)", padding: 4 }} onClick={() => {
            const n = rules.filter((_, j) => j !== i); onChange(n);
          }}><IcoX /></button>
        </div>
      ))}
      <button type="button" style={{ ...HS.btn(), fontSize: 11, marginTop: 6 }} onClick={() => {
        onChange([...rules, { description: "", pattern: "" }]);
      }}>+ Add blacklist rule</button>
    </div>
  );
}

function PrimitivesEditor({
  primitives,
  onChange,
}: {
  primitives: WrapPrimitiveRef[];
  onChange: (next: WrapPrimitiveRef[]) => void;
}) {
  const rows = primitives.length > 0 ? primitives : [{ symbol: "" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap" as const,
            alignItems: "flex-end",
            padding: "8px 0",
            borderBottom: "1px solid var(--mgr-bg-subtle)",
          }}
        >
          <div style={{ flex: "1 1 140px", minWidth: 100 }}>
            <div style={HS.label}>Export symbol</div>
            <input
              style={{ ...HS.input, fontFamily: "ui-monospace,monospace", fontSize: 12 }}
              placeholder="e.g. TableCell, DialogContent"
              value={row.symbol}
              onChange={(e) => {
                const next = [...primitives];
                const sym = e.target.value;
                if (!next[i]) next[i] = { symbol: sym };
                else next[i] = { ...next[i], symbol: sym };
                onChange(next);
              }}
            />
          </div>
          <div style={{ flex: "1 1 160px", minWidth: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={HS.label}>Spec display name</span>
              <InfoTip text="Can differ from code symbol: written into .cursorrules with a readable name to help models understand sub-component responsibilities; leave empty to use symbol only." />
            </div>
            <input
              style={HS.input}
              placeholder="Defaults to symbol, e.g.: Table Header Cell"
              value={row.displayName ?? ""}
              onChange={(e) => {
                const next = [...primitives];
                const base = next[i] ?? { symbol: "" };
                const v = e.target.value;
                const trimmed = v.trim();
                next[i] = trimmed ? { ...base, displayName: trimmed } : { symbol: base.symbol };
                onChange(next);
              }}
            />
          </div>
          <button
            type="button"
            style={{ ...HS.btn(), fontSize: 11, flexShrink: 0 }}
            onClick={() => onChange(primitives.filter((_, j) => j !== i))}
          >
            Delete
          </button>
        </div>
      ))}
      <button
        type="button"
        style={{ ...HS.btn(), fontSize: 12 }}
        onClick={() => onChange([...primitives, { symbol: "" }])}
      >
        + Add sub-component
      </button>
    </div>
  );
}

function useAnchorStoryContext(): AnchorStoryContext {
  const api = useStorybookApi();
  const [ctx, setCtx] = React.useState<AnchorStoryContext>({
    storyId: null,
    storyName: null,
    componentTitle: null,
    leafTitle: null,
    isStory: false,
  });
  React.useEffect(() => {
    function sync() {
      try {
        const current = api.getCurrentStoryData?.();
        if (!current || !("type" in current)) {
          setCtx({
            storyId: null,
            storyName: null,
            componentTitle: null,
            leafTitle: null,
            isStory: false,
          });
          return;
        }
        const title = "title" in current && typeof current.title === "string" ? current.title : "";
        const leaf = title.split("/").pop() ?? title;
        const isStory = current.type === "story";
        const storyId = isStory && "id" in current && typeof current.id === "string" ? current.id : null;
        const storyName = isStory && "name" in current && typeof current.name === "string" ? current.name : null;
        setCtx({
          storyId,
          storyName,
          componentTitle: title || null,
          leafTitle: leaf || null,
          isStory,
        });
      } catch {
        setCtx({
          storyId: null,
          storyName: null,
          componentTitle: null,
          leafTitle: null,
          isStory: false,
        });
      }
    }
    sync();
    const channel = addons.getChannel();
    channel.on("storyChanged", sync);
    channel.on("setCurrentStory", sync);
    const timer = setInterval(sync, 500);
    return () => {
      channel.off("storyChanged", sync);
      channel.off("setCurrentStory", sync);
      clearInterval(timer);
    };
  }, [api]);
  return ctx;
}

function matchSchemaForTitle(schemas: SchemaListItem[], title: string | null): SchemaListItem | null {
  if (!title || schemas.length === 0) return null;
  const lower = title.toLowerCase().replace(/\s+/g, "");
  return schemas.find(s => s.componentName.toLowerCase() === lower)
    ?? schemas.find(s => lower.includes(s.componentName.toLowerCase()))
    ?? schemas.find(s => s.componentName.toLowerCase().includes(lower))
    ?? null;
}

function CreateSchemaPrompt({ leafTitle, onCreated }: { leafTitle: string; onCreated: (filename: string) => void }) {
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
      wraps: { module: `@/components/starter/${kebab}`, primitives: [leafTitle] },
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
      const r = await fetch(devApi("/api/save-schema"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: JSON.stringify(spec, null, 2) }),
      });
      const b = await r.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!r.ok || !b.ok) throw new Error(b.error ?? r.statusText);
      onCreated(filename);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)", gap: 12, padding: 24, textAlign: "center" as const }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--mgr-text-secondary)" }}>{leafTitle}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 320 }}>
        No <strong>Spec</strong> has been created for this component yet (<code style={{ fontSize: 11 }}>*.spec.json</code>)
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void create()}
        style={{
          ...HS.btn(true),
          marginTop: 4,
          opacity: busy ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <IcoPlus /> {busy ? "Creating..." : "Create Spec"}
      </button>
      {error && <div style={{ fontSize: 12, color: "#dc2626", maxWidth: 300 }}>{error}</div>}
    </div>
  );
}

function AnchorPanel() {
  const [schemas, setSchemas] = React.useState<SchemaListItem[]>([]);
  const [filename, setFilename] = React.useState("");
  const [baseCore, setBaseCore] = React.useState<SpecData | null>(null);
  const [storyAnchorMap, setStoryAnchorMap] = React.useState<Record<string, unknown>>({});
  const [spec, setSpec] = React.useState<SpecData | null>(null);
  const [status, setStatus] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const anchorCtx = useAnchorStoryContext();

  React.useEffect(() => {
    fetch(devApi("/api/schemas")).then(r => r.json()).then((list: SchemaListItem[]) => {
      setSchemas(list);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const matched = matchSchemaForTitle(schemas, anchorCtx.leafTitle);
    if (matched && matched.filename !== filename) {
      setFilename(matched.filename);
    }
  }, [anchorCtx.leafTitle, schemas, filename]);

  const load = React.useCallback(async () => {
    if (!filename) return;
    setLoading(true); setStatus(null);
    try {
      const r = await fetch(devApi(`/api/schema/${encodeURIComponent(filename)}`));
      if (!r.ok) throw new Error(await r.text());
      const raw = (await r.json()) as Record<string, unknown>;
      const shRaw = raw.storyAnchor;
      const map = isPlainObject(shRaw) ? { ...shRaw } : {};
      const { storyAnchor: _sh, anchorNarrative: _legacyNarrative, ...rawBase } = raw;
      const normalized = normalizeSpecBaseFromRaw(rawBase);
      setStoryAnchorMap(map);
      setBaseCore(normalized);
    } catch (e) {
      setBaseCore(null);
      setStoryAnchorMap({});
      setSpec(null);
      setStatus({ text: `Load failed: ${String(e)}`, ok: false });
    }
    finally { setLoading(false); }
  }, [filename]);

  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    if (!baseCore) {
      setSpec(null);
      return;
    }
    if (!anchorCtx.isStory || !anchorCtx.storyId) {
      setSpec(null);
      return;
    }
    const frag = storyAnchorMap[anchorCtx.storyId];
    const merged = deepMergeSpecData(baseCore, frag ?? {});
    setSpec({
      ...merged,
      wraps: {
        ...(merged.wraps ?? {}),
        module: merged.wraps?.module ?? "",
        primitives: normalizePrimitives((merged.wraps?.primitives ?? []) as WrapPrimitiveInput[]),
      },
    });
  }, [baseCore, storyAnchorMap, anchorCtx.storyId, anchorCtx.isStory]);

  function update<K extends keyof SpecData>(key: K, val: SpecData[K]) {
    if (!spec) return;
    setSpec({ ...spec, [key]: val });
  }

  async function save() {
    if (!spec || !filename || !baseCore) return;
    if (!anchorCtx.isStory || !anchorCtx.storyId) {
      setStatus({ text: "Please select a specific Story variant from the sidebar before saving (group root / canvas overview cannot map to a single storyId).", ok: false });
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
      const patch = extractAnchorPatch(pruned, baseCore);
      const newMap = { ...storyAnchorMap };
      if (!patch) delete newMap[anchorCtx.storyId];
      else newMap[anchorCtx.storyId] = patch;
      const doc: Record<string, unknown> = { ...(baseCore as unknown as Record<string, unknown>) };
      if (Object.keys(newMap).length > 0) doc.storyAnchor = newMap;
      const r = await fetch(devApi("/api/save-schema"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: JSON.stringify(compactSpecForDisk(doc), null, 2) }),
      });
      const b = await r.json().catch(() => ({})) as {
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
      const parts: string[] = [`Written to disk: ${b.path ?? filename}`];
      if (b.syncOk === false && b.syncError) {
        parts.push(`⚠️ sync:anchor failed (spec is saved, please run npm run sync:anchor manually in terminal):\n${b.syncError}`);
      } else if (b.syncOk !== false) {
        parts.push("sync:anchor executed.");
      }
      if (b.audit && b.audit.passed === false) parts.push(`⚠️ Audit: ${b.audit.output}`);
      const ok = b.syncOk !== false && (b.audit == null || b.audit.passed !== false);
      setStatus({ text: parts.join("\n"), ok });
      await load();
    } catch (e) { setStatus({ text: `Save failed: ${String(e)}`, ok: false }); }
  }

  const matched = matchSchemaForTitle(schemas, anchorCtx.leafTitle);

  if (!matched && anchorCtx.leafTitle) {
    return (
      <CreateSchemaPrompt
        leafTitle={anchorCtx.leafTitle}
        onCreated={(fn) => {
          setFilename(fn);
          fetch(devApi("/api/schemas")).then(r => r.json()).then((list: SchemaListItem[]) => setSchemas(list)).catch(() => {});
        }}
      />
    );
  }

  if (loading && !baseCore) {
    return <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)" }}>加载中…</div>;
  }

  if (matched && (!anchorCtx.isStory || !anchorCtx.storyId)) {
    return (
      <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)", gap: 10, padding: 24, textAlign: "center" as const, maxWidth: 360 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--mgr-text-secondary)" }}>{anchorCtx.leafTitle}</div>
        <div style={{ fontSize: 12, lineHeight: 1.55 }}>
          <strong>Spec.json</strong> 面板按 <strong>Story 变体</strong> 写入：请在左侧树展开本组件，点选一条具体 Story（不要停在分组根或仅画布预览）。
        </div>
      </div>
    );
  }

  if (!spec) {
    return <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)" }}>请在左侧选择一个组件</div>;
  }

  return (
    <div style={HS.wrap}>
      <div style={{ ...HS.header, flexDirection: "column", alignItems: "stretch", gap: 8, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mgr-text)", whiteSpace: "nowrap" }}>{spec.componentName}</div>
          <span style={{
            fontSize: 10, fontWeight: 500, color: "var(--mgr-text-muted)",
            padding: "2px 6px", borderRadius: 4,
            background: "var(--mgr-bg-subtle)", fontFamily: "ui-monospace,monospace",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>{filename}</span>
          <div style={{ flex: 1 }} />
        </div>
        {anchorCtx.storyId ? (
          <div style={{ fontSize: 11, color: "var(--mgr-text-muted)", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 4 }}>
            <span>当前变体:</span>
            <span style={{
              fontWeight: 600, color: "var(--mgr-text)",
              padding: "1px 6px", borderRadius: 3,
              background: "var(--mgr-bg-subtle)",
            }}>{anchorCtx.storyName ?? anchorCtx.storyId}</span>
          </div>
        ) : null}
      </div>

      <div style={{ ...HS.body, flex: 1, minHeight: 0, overflow: "auto" }}>
        <CollapsibleSection
          title="Spec · 业务意图与依赖"
          hint="与当前 Story 变体绑定：保存后写入 storyAnchor[storyId]，与顶层 spec 深度合并，再经 sync 进入 .cursorrules；各变体互不影响。常用：Intent、schema 指令、首选 import。"
          defaultOpen={true}
        >
          <div style={HS.field}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={HS.label}>业务意图（Intent）</div>
              <InfoTip text="可判定的一句话：何时必须用本组件、与兄弟组件如何分工、禁止的典型误用（建议写成「若…则…」）。" />
            </div>
            <textarea
              style={HS.textarea}
              placeholder={'若页内需要主操作，则必须用 BusinessButton；禁止原生 <button>。'}
              value={spec.intent}
              onChange={e => update("intent", e.target.value)}
            />
          </div>
          <div style={HS.field}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={HS.label}>Schema 指令（写入 .cursorrules）</div>
              <InfoTip text="给代码助手的硬条款：import 别名、variant/density 取值、禁止手写的 Tailwind 模式等；短句、可执行，避免散文。" />
            </div>
            <textarea
              style={{ ...HS.textarea, minHeight: 80 }}
              placeholder={'危险操作须 variant="destructive"；禁止在业务侧覆盖 styleLock 中的间距/品牌色类。'}
              value={spec.aiPrompt}
              onChange={e => update("aiPrompt", e.target.value)}
            />
          </div>
          <div style={HS.field}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={HS.label}>首选 import 路径</div>
              <InfoTip text="只填一条最推荐路径，降低模型乱选；若有多条合法入口，在下方「引用优先」完整列表中维护。" />
            </div>
            <input
              style={{ ...HS.input, fontFamily: "ui-monospace,monospace" }}
              placeholder="@/components/business/…"
              value={(spec.referencePriority ?? [])[0] ?? ""}
              onChange={e => {
                const t = e.target.value.trim();
                const tail = (spec.referencePriority ?? []).slice(1);
                update("referencePriority", t ? [t, ...tail] : tail);
              }}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Spec · 禁止项、纠错与 Few-shot"
          hint="与 anchor-audit、`.cursorrules` 对齐：原生标签替代关系、可判定违规→修复话术、可直接复制的最小 JSX；建议由熟悉业务语义的同学维护。"
          defaultOpen={false}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>禁止项（Forbidden）</div>
            <InfoTip text="每条包含：HTML 标签、为何禁止、应改用的业务组件 import；与审计提示一一对应。" />
          </div>
          {(spec.forbidden ?? []).map((f, i) => (
            <div key={i} style={{ border: "1px solid var(--mgr-border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--mgr-bg-muted)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <div style={{ flex: "0 0 88px", minWidth: 72 }}>
                  <div style={HS.label}>HTML 标签</div>
                  <input style={{ ...HS.input, fontFamily: "ui-monospace,monospace" }} value={f.htmlTag} onChange={e => {
                    const arr = [...(spec.forbidden ?? [])]; arr[i] = { ...f, htmlTag: e.target.value }; update("forbidden", arr);
                  }} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <div style={HS.label}>原因</div>
                  <input style={HS.input} value={f.reason} onChange={e => {
                    const arr = [...(spec.forbidden ?? [])]; arr[i] = { ...f, reason: e.target.value }; update("forbidden", arr);
                  }} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <div style={HS.label}>替代组件</div>
                  <input style={HS.input} value={f.useInstead} onChange={e => {
                    const arr = [...(spec.forbidden ?? [])]; arr[i] = { ...f, useInstead: e.target.value }; update("forbidden", arr);
                  }} />
                </div>
              </div>
              <button type="button" style={{ ...HS.btn(), marginTop: 8, fontSize: 11 }} onClick={() => {
                update("forbidden", (spec.forbidden ?? []).filter((_, j) => j !== i));
              }}>删除此项</button>
            </div>
          ))}
          <button type="button" style={{ ...HS.btn(), fontSize: 12 }} onClick={() => {
            update("forbidden", [...(spec.forbidden ?? []), { htmlTag: "", reason: "", useInstead: "" }]);
          }}>+ 添加禁止项</button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 8 }}>
            <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>纠错（Corrections）</div>
            <InfoTip text="「可判定违规」与「修复指令」成对：前者用于 grep/审计，后者直接给模型照做。" />
          </div>
          {(spec.corrections ?? []).map((c, i) => (
            <div key={i} style={{ border: "1px solid var(--mgr-border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--mgr-bg-muted)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={HS.label}>ID</div>
                  <input style={{ ...HS.input, fontFamily: "ui-monospace,monospace", fontSize: 12 }} value={c.id} onChange={e => {
                    const arr = [...(spec.corrections ?? [])]; arr[i] = { ...c, id: e.target.value }; update("corrections", arr);
                  }} />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <div style={HS.label}>违规（可判定）</div>
                  <input style={HS.input} value={c.violation} onChange={e => {
                    const arr = [...(spec.corrections ?? [])]; arr[i] = { ...c, violation: e.target.value }; update("corrections", arr);
                  }} />
                </div>
              </div>
              <div style={HS.label}>修复指令</div>
              <input style={HS.input} value={c.fixPrompt} onChange={e => {
                const arr = [...(spec.corrections ?? [])]; arr[i] = { ...c, fixPrompt: e.target.value }; update("corrections", arr);
              }} />
              <button type="button" style={{ ...HS.btn(), marginTop: 8, fontSize: 11 }} onClick={() => {
                update("corrections", (spec.corrections ?? []).filter((_, j) => j !== i));
              }}>删除此项</button>
            </div>
          ))}
          <button type="button" style={{ ...HS.btn(), fontSize: 12 }} onClick={() => {
            update("corrections", [...(spec.corrections ?? []), { id: "", violation: "", fixPrompt: "" }]);
          }}>+ 添加纠错</button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 8 }}>
            <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>Few-shot 示例</div>
            <InfoTip text="每组件 1～2 条：标题 + 可选一句场景说明 + 最小 JSX；保存并经 sync 写入 .cursorrules，供模型模仿结构与 import。" />
          </div>
          <ExamplesEditor examples={spec.examples ?? []} onChange={ex => update("examples", ex)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="工程字段：标识、上游子组件、Props、样式锁定与引用列表"
          hint="组件 id / 版本、wraps.module 与子组件 symbol、Props 类型与 enumMap JSON、styleLock 正则、referencePriority 多行；供设计系统或工程角色维护。"
          defaultOpen={false}
        >
          <div style={HS.section}>
            <div style={HS.sectionTitle}>基本信息</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ ...HS.field, flex: 1 }}>
                <div style={HS.label}>组件名称</div>
                <input style={HS.input} value={spec.componentName} onChange={e => update("componentName", e.target.value)} />
              </div>
              <div style={{ ...HS.field, flex: 1 }}>
                <div style={HS.label}>ID</div>
                <input style={HS.input} value={spec.id} onChange={e => update("id", e.target.value)} />
              </div>
              <div style={{ ...HS.field, width: 100, flexShrink: 0 }}>
                <div style={HS.label}>版本</div>
                <input style={HS.input} value={spec.version} onChange={e => update("version", e.target.value as any)} />
              </div>
            </div>
          </div>

          <div style={HS.section}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={HS.sectionTitle}>上游封装 · 模块与子组件</div>
              <InfoTip text="module 指向 starter / ui 的 re-export；子组件列表对应组合导出中的符号，可为每个符号配置 Spec 展示名（进入 .cursorrules 时更易读）。" />
            </div>
            <div style={{ ...HS.field, marginBottom: 12 }}>
              <div style={HS.label}>模块路径 wraps.module</div>
              <input style={HS.input} value={spec.wraps.module} onChange={e => update("wraps", { ...spec.wraps, module: e.target.value })} />
            </div>
            <PrimitivesEditor
              primitives={spec.wraps.primitives}
              onChange={(next) => update("wraps", { ...spec.wraps, primitives: next })}
            />
          </div>

          <div style={HS.section}>
            <div style={HS.sectionTitle}>必需 Props ({spec.requiredProps.length})</div>
            {spec.requiredProps.map((p, i) => (
              <PropEditor key={`req-${i}`} prop={p} onChange={np => {
                const arr = [...spec.requiredProps]; arr[i] = np; update("requiredProps", arr);
              }} />
            ))}
          </div>

          {spec.optionalProps && spec.optionalProps.length > 0 && (
            <div style={HS.section}>
              <div style={HS.sectionTitle}>可选 Props ({spec.optionalProps.length})</div>
              {spec.optionalProps.map((p, i) => (
                <PropEditor key={`opt-${i}`} prop={p} onChange={np => {
                  const arr = [...(spec.optionalProps ?? [])]; arr[i] = np; update("optionalProps", arr);
                }} />
              ))}
            </div>
          )}

          <div style={HS.section}>
            <div style={HS.sectionTitle}>样式锁定</div>
            <div style={HS.field}>
              <div style={HS.label}>Baseline Tokens (逗号分隔)</div>
              <input style={HS.input} value={spec.styleLock.baselineTokens.join(", ")} onChange={e => update("styleLock", { ...spec.styleLock, baselineTokens: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
            </div>
            <div style={HS.field}>
              <div style={HS.label}>黑名单规则</div>
              <BlacklistEditor rules={spec.styleLock.blacklist} onChange={bl => update("styleLock", { ...spec.styleLock, blacklist: bl })} />
            </div>
          </div>

          <div style={HS.section}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>引用优先（完整列表，每行一条）</div>
              <InfoTip text="首行应与核心区内「主 import」一致；多路径时在此编辑全部，保存后同步 .cursorrules。" />
            </div>
            <textarea
              style={{ ...HS.mono, minHeight: 56 }}
              value={(spec.referencePriority ?? []).join("\n")}
              onChange={e => update("referencePriority", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* 底部操作条 */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", borderTop: "1px solid var(--mgr-border)",
        background: "var(--mgr-bg)",
      }}>
        {status && (
          <div style={{
            flex: 1, fontSize: 12, padding: "4px 8px", borderRadius: 4, whiteSpace: "pre-wrap" as const,
            background: status.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${status.ok ? "#bbf7d0" : "#fecaca"}`,
            color: status.ok ? "#166534" : "#991b1b",
          }}>
            {status.text}
          </div>
        )}
        {!status && <div style={{ flex: 1 }} />}
        <button type="button" style={HS.btn()} onClick={() => void load()}>刷新</button>
        <button type="button" style={HS.btn(true)} onClick={() => void save()}>保存</button>
      </div>
    </div>
  );
}

/* ── 右键上下文菜单 ── */

type CtxMenuState = {
  x: number;
  y: number;
  item: API_ComponentEntry;
  api: API;
  importPath: string;
} | null;

const ctxMenuBus = {
  _listeners: new Set<(s: CtxMenuState) => void>(),
  _state: null as CtxMenuState,
  open(s: CtxMenuState) { this._state = s; this._listeners.forEach(fn => fn(s)); },
  close() { this.open(null); },
  subscribe(fn: (s: CtxMenuState) => void) { this._listeners.add(fn); return () => { this._listeners.delete(fn); }; },
};

function useCtxMenuState(): CtxMenuState {
  const [s, setS] = React.useState<CtxMenuState>(ctxMenuBus._state);
  React.useEffect(() => ctxMenuBus.subscribe(setS), []);
  return s;
}

function ComponentContextMenu() {
  const state = useCtxMenuState();
  const close = React.useCallback(() => ctxMenuBus.close(), []);
  const dark = useIsDark();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!state) { setConfirmDelete(false); return; }
  }, [state]);

  React.useEffect(() => {
    if (!state) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", esc); };
  }, [state, close]);

  if (!state) return null;

  const D = {
    bg: dark ? "#27272a" : "#ffffff",
    border: dark ? "#3f3f46" : "#e4e4e7",
    text: dark ? "#fafafa" : "#18181b",
    muted: dark ? "#a1a1aa" : "#71717a",
    hover: dark ? "#3f3f46" : "#f4f4f5",
    danger: "#ef4444",
  };

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: state.y,
    left: state.x,
    zIndex: 2147483647,
    minWidth: 160,
    padding: "4px 0",
    background: D.bg,
    border: `1px solid ${D.border}`,
    borderRadius: 8,
    boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
    fontFamily: "system-ui,-apple-system,sans-serif",
    fontSize: 13,
    color: D.text,
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 12px",
    border: "none",
    background: "none",
    color: D.text,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    fontSize: 13,
  };

  async function doDelete() {
    try {
      const r = await fetch(devApi("/api/delete-component"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importPath: state!.importPath }),
      });
      const d = (await r.json()) as any;
      if (!d.ok) { alert("删除失败: " + (d.error ?? "")); return; }
      close();
      window.location.reload();
    } catch (e) {
      alert("删除失败: " + String(e));
    }
  }

  if (confirmDelete) {
    return createPortal(
      <div ref={menuRef} style={menuStyle}>
        <div style={{ padding: "8px 12px", fontSize: 12, color: D.muted }}>确认删除「{state.item.name}」？此操作不可撤销。</div>
        <div style={{ display: "flex", gap: 6, padding: "4px 12px 8px" }}>
          <button type="button" onClick={() => setConfirmDelete(false)}
            style={{ ...itemStyle, padding: "5px 12px", width: "auto", border: `1px solid ${D.border}`, borderRadius: 6 }}>取消</button>
          <button type="button" onClick={() => void doDelete()}
            style={{ ...itemStyle, padding: "5px 12px", width: "auto", background: D.danger, color: "#fff", borderRadius: 6, fontWeight: 600 }}>删除</button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div ref={menuRef} style={menuStyle}>
      <button type="button" onClick={() => setConfirmDelete(true)}
        onMouseEnter={e => (e.currentTarget.style.background = D.hover)}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
        style={{ ...itemStyle, color: D.danger }}>删除组件</button>
    </div>,
    document.body,
  );
}


/* ── 注册 ── */

addons.setConfig({
  theme: _initDark ? darkTheme : lightTheme,
  /** 避免误点「在新标签打开画布」进入孤立 iframe.html（无侧栏/难返回）；并关闭画布全屏按钮以免误触 */
  toolbar: {
    eject: { hidden: true },
    fullscreen: { hidden: true },
  },
  sidebar: {
    showRoots: true,
  },
});

addons.register("design-anchor", () => {
  addons.add("design-anchor/sidebar-top", {
    type: types.experimental_SIDEBAR_TOP,
    render: () => <SidebarTop />,
  });

  addons.add("design-anchor/anchor-panel", {
    type: types.PANEL,
    title: "Spec.json",
    render: ({ active }) => active ? <AnchorPanel /> : null,
  });
});
