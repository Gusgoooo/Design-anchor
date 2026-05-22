import * as React from "react";
import type { DemoModule, Meta, StoryObj } from "./argTypes-types";

/**
 * Discover all *.demo.tsx files under src/components/.
 * Lazy loaders are returned so we don't bundle every story into the entry chunk.
 *
 * Pattern uses the `@/` alias (resolved by Vite to src/) so glob discovery works
 * when this file lives under a different vite root than the demos.
 */
const demoLoaders = import.meta.glob<DemoModule>("../components/**/*.demo.tsx");

export type StoryEntry = {
  id: string;             // "base-button--default"
  storyName: string;      // "Default"
  exportName: string;     // "Default" (matches the demo file export)
  componentId: string;    // "base-button"
  componentTitle: string; // "Base/Button"
  filePath: string;       // glob key, e.g., "../components/base/Button.demo.tsx"
};

export type ComponentEntry = {
  id: string;             // "base-button"
  title: string;          // "Base/Button"
  segments: string[];     // ["Base", "Button"]
  filePath: string;
  stories: StoryEntry[];
};

export type TreeNode =
  | { kind: "group"; id: string; name: string; children: TreeNode[] }
  | { kind: "component"; id: string; name: string; entry: ComponentEntry };

const moduleCache = new Map<string, Promise<DemoModule>>();

export function loadDemoModule(filePath: string): Promise<DemoModule> {
  const cached = moduleCache.get(filePath);
  if (cached) return cached;
  const loader = demoLoaders[filePath];
  if (!loader) throw new Error(`anchor-portal: unknown demo path "${filePath}"`);
  const p = loader();
  moduleCache.set(filePath, p);
  return p;
}

/** kebab-case path segment — matches the legacy Storybook id derivation */
function kebab(input: string): string {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
}

export function componentIdFromTitle(title: string): string {
  return title.split("/").map(kebab).filter(Boolean).join("-");
}

export function storyIdFromExport(componentId: string, exportName: string): string {
  return `${componentId}--${kebab(exportName)}`;
}

function isStoryObj(x: unknown): x is StoryObj {
  return Boolean(x) && typeof x === "object";
}

async function readEntry(filePath: string): Promise<ComponentEntry | null> {
  let mod: DemoModule;
  try {
    mod = await loadDemoModule(filePath);
  } catch (err) {
    console.warn(`[anchor-portal] failed to load ${filePath}:`, err);
    return null;
  }
  const meta = mod.default as Meta | undefined;
  if (!meta?.title) {
    console.warn(`[anchor-portal] ${filePath} missing default export with title`);
    return null;
  }
  const componentId = componentIdFromTitle(meta.title);
  const segments = meta.title.split("/").map((s) => s.trim()).filter(Boolean);
  const stories: StoryEntry[] = [];
  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === "default") continue;
    if (!isStoryObj(value)) continue;
    const storyName = (value as StoryObj).name ?? exportName;
    stories.push({
      id: storyIdFromExport(componentId, exportName),
      storyName,
      exportName,
      componentId,
      componentTitle: meta.title,
      filePath,
    });
  }
  return { id: componentId, title: meta.title, segments, filePath, stories };
}

let registryPromise: Promise<ComponentEntry[]> | null = null;

export function getRegistry(): Promise<ComponentEntry[]> {
  if (registryPromise) return registryPromise;
  registryPromise = (async () => {
    const entries = await Promise.all(
      Object.keys(demoLoaders).map((fp) => readEntry(fp)),
    );
    return entries
      .filter((e): e is ComponentEntry => e !== null)
      .sort((a, b) => a.title.localeCompare(b.title));
  })();
  return registryPromise;
}

/** Build a nested tree from component titles (split by "/") */
export function buildTree(entries: ComponentEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  function findGroup(parent: TreeNode[], name: string): TreeNode {
    const existing = parent.find((n) => n.kind === "group" && n.name === name);
    if (existing) return existing;
    const node: TreeNode = { kind: "group", id: `group:${name}`, name, children: [] };
    parent.push(node);
    return node;
  }

  for (const entry of entries) {
    if (entry.segments.length === 0) continue;
    let cursor = root;
    let path = "";
    for (let i = 0; i < entry.segments.length - 1; i++) {
      const seg = entry.segments[i];
      path = path ? `${path}/${seg}` : seg;
      const group = findGroup(cursor, seg);
      group.id = `group:${path}`;
      cursor = (group as Extract<TreeNode, { kind: "group" }>).children;
    }
    const leafName = entry.segments[entry.segments.length - 1];
    cursor.push({ kind: "component", id: entry.id, name: leafName, entry });
  }

  return sortTree(root);
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return [...nodes]
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "group" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((n) =>
      n.kind === "group"
        ? { ...n, children: sortTree(n.children) }
        : n,
    );
}

export function findStoryById(entries: ComponentEntry[], storyId: string): StoryEntry | null {
  for (const entry of entries) {
    for (const story of entry.stories) {
      if (story.id === storyId) return story;
    }
  }
  return null;
}

/** React hook: resolves the registry once, returns null while pending */
export function useRegistry(): ComponentEntry[] | null {
  const [data, setData] = React.useState<ComponentEntry[] | null>(null);
  React.useEffect(() => {
    let alive = true;
    getRegistry().then((r) => {
      if (alive) setData(r);
    });
    return () => {
      alive = false;
    };
  }, []);
  return data;
}
