import * as React from "react";
import {
  Brain,
  ChevronRight,
  Component as ComponentIcon,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildTree,
  type ComponentEntry,
  type StoryEntry,
  type TreeNode,
} from "../story-registry";
import { navigateTo, type Route } from "../router";
import { dotColorFor, getComponentStatus, useKitStatus } from "./kit-status";

type Props = {
  entries: ComponentEntry[];
  currentStoryId: string | null;
};

export function SidebarTree({ entries, currentStoryId }: Props) {
  const tree = React.useMemo(() => buildTree(entries), [entries]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() =>
    initialExpanded(tree, currentStoryId, entries),
  );

  // Auto-expand path to current story when route changes
  React.useEffect(() => {
    if (!currentStoryId) return;
    const path = pathToStory(tree, currentStoryId);
    if (!path.length) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const id of path) next[id] = true;
      return next;
    });
  }, [currentStoryId, tree]);

  const toggle = React.useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (tree.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
        No components discovered.
        <br />
        Add a <code className="font-mono">*.demo.tsx</code> file under
        <br />
        <code className="font-mono">src/components/</code>.
      </div>
    );
  }

  return (
    <div className="py-1">
      {tree.map((node, i) => (
        <TreeRow
          key={node.id}
          node={node}
          depth={0}
          isRoot
          rootKind={rootKindFor(node)}
          expanded={expanded}
          toggle={toggle}
          currentStoryId={currentStoryId}
          isFirstRoot={i === 0}
        />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  isRoot,
  rootKind,
  expanded,
  toggle,
  currentStoryId,
  isFirstRoot,
}: {
  node: TreeNode;
  depth: number;
  isRoot: boolean;
  rootKind?: "ai" | "default";
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  currentStoryId: string | null;
  isFirstRoot?: boolean;
}) {
  if (isRoot && node.kind === "group") {
    return (
      <div className={cn(!isFirstRoot && "mt-2")}>
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 select-none">
          {rootKind === "ai" ? <Brain size={13} /> : <LayoutGrid size={13} />}
          <span>{node.name}</span>
        </div>
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={0}
              isRoot={false}
              expanded={expanded}
              toggle={toggle}
              currentStoryId={currentStoryId}
            />
          ))}
        </div>
      </div>
    );
  }

  if (node.kind === "group") {
    const isOpen = expanded[node.id] ?? false;
    return (
      <div>
        <RowButton
          depth={depth}
          chevron={isOpen ? "open" : "closed"}
          icon={<LayoutGrid size={13} className="text-muted-foreground" />}
          label={node.name}
          onClick={() => toggle(node.id)}
          isSelected={false}
        />
        {isOpen && (
          <div>
            {node.children.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                isRoot={false}
                expanded={expanded}
                toggle={toggle}
                currentStoryId={currentStoryId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // component
  return <ComponentRow entry={node.entry} depth={depth} expanded={expanded} toggle={toggle} currentStoryId={currentStoryId} />;
}

function ComponentRow({
  entry,
  depth,
  expanded,
  toggle,
  currentStoryId,
}: {
  entry: ComponentEntry;
  depth: number;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  currentStoryId: string | null;
}) {
  const isOpen = expanded[entry.id] ?? false;
  const hasStories = entry.stories.length > 0;
  const containsCurrent = currentStoryId
    ? entry.stories.some((s) => s.id === currentStoryId)
    : false;

  return (
    <div>
      <RowButton
        depth={depth}
        chevron={hasStories ? (isOpen ? "open" : "closed") : "none"}
        icon={<ComponentIcon size={13} className="text-muted-foreground" />}
        label={entry.title.split("/").pop() ?? entry.title}
        onClick={() => {
          toggle(entry.id);
          // jump to first story when expanding for the first time
          if (!isOpen && hasStories) {
            navigateTo({ kind: "story", storyId: entry.stories[0].id } satisfies Route);
          }
        }}
        isSelected={containsCurrent && !isOpen}
        statusName={entry.title.split("/").pop()}
      />
      {isOpen &&
        entry.stories.map((story) => (
          <StoryRow
            key={story.id}
            story={story}
            depth={depth + 1}
            isSelected={story.id === currentStoryId}
          />
        ))}
    </div>
  );
}

function StoryRow({
  story,
  depth,
  isSelected,
}: {
  story: StoryEntry;
  depth: number;
  isSelected: boolean;
}) {
  return (
    <RowButton
      depth={depth}
      chevron="none"
      icon={<FileText size={11} className="text-muted-foreground/70" />}
      label={story.storyName}
      onClick={() => navigateTo({ kind: "story", storyId: story.id })}
      isSelected={isSelected}
      compact
    />
  );
}

function RowButton({
  depth,
  chevron,
  icon,
  label,
  onClick,
  isSelected,
  compact,
  statusName,
}: {
  depth: number;
  chevron: "open" | "closed" | "none";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isSelected: boolean;
  compact?: boolean;
  statusName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: 8 + depth * 14 }}
      className={cn(
        "group mx-1.5 flex w-[calc(100%-12px)] items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[13px] transition-colors",
        compact ? "font-normal" : "font-medium",
        isSelected
          ? "bg-muted text-foreground"
          : "text-foreground/85 hover:bg-muted/60",
      )}
    >
      <span className="flex h-3 w-3 shrink-0 items-center justify-center text-muted-foreground/70">
        {chevron === "none" ? null : (
          <ChevronRight
            size={11}
            className={cn("transition-transform", chevron === "open" && "rotate-90")}
          />
        )}
      </span>
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {statusName ? <KitDot componentName={statusName} /> : null}
    </button>
  );
}

function KitDot({ componentName }: { componentName: string }) {
  const kit = useKitStatus();
  const status = getComponentStatus(kit, componentName);
  if (!status || status === "unchanged") return null;
  return (
    <span
      title={`${componentName}: ${status}`}
      className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-black/10"
      style={{ background: dotColorFor(kit, status) }}
    />
  );
}

function rootKindFor(node: TreeNode): "ai" | "default" {
  return node.kind === "group" && node.name.toLowerCase() === "ai" ? "ai" : "default";
}

function pathToStory(tree: TreeNode[], storyId: string): string[] {
  const out: string[] = [];
  function walk(nodes: TreeNode[], trail: string[]): boolean {
    for (const n of nodes) {
      if (n.kind === "component") {
        if (n.entry.stories.some((s) => s.id === storyId)) {
          for (const id of trail) out.push(id);
          out.push(n.id);
          return true;
        }
      } else if (walk(n.children, [...trail, n.id])) {
        return true;
      }
    }
    return false;
  }
  walk(tree, []);
  return out;
}

function initialExpanded(
  tree: TreeNode[],
  currentStoryId: string | null,
  _entries: ComponentEntry[],
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  if (!currentStoryId) return map;
  for (const id of pathToStory(tree, currentStoryId)) map[id] = true;
  return map;
}
