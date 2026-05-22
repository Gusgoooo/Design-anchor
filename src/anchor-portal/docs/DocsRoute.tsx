import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../i18n/LocaleProvider";
import { SECTIONS, type DocsSection } from "./sections";

/**
 * Three-column docs page modeled on shadcn /docs:
 *   • Left: section list (within Docs)
 *   • Center: rendered markdown of the active section
 *   • Right: auto-extracted "On this page" ToC from the active section
 *
 * Component list lives in the Components tab — this page is purely for
 * usage / installation / MCP / governance docs.
 */

const NAV_GROUPS: { title: { en: string; zh: string }; sectionIds: string[] }[] = [
  { title: { en: "Get started", zh: "上手" }, sectionIds: ["introduction", "quickstart"] },
  { title: { en: "Token system", zh: "Token 体系" }, sectionIds: ["token-system"] },
  { title: { en: "Tooling", zh: "工具链" }, sectionIds: ["cli", "mcp-server", "auditing"] },
  { title: { en: "AI integration", zh: "AI 接入" }, sectionIds: ["ai-integration"] },
  { title: { en: "Reference", zh: "参考" }, sectionIds: ["spec-json", "faq"] },
];

export function DocsRoute() {
  const [activeId, setActiveId] = React.useState<string>(SECTIONS[0]!.id);
  const active = React.useMemo(
    () => SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]!,
    [activeId],
  );

  // Reset scroll when switching sections.
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeId]);

  return (
    <div className="grid h-full grid-cols-[220px_minmax(0,1fr)_220px] gap-0 bg-background text-foreground">
      <LeftNav activeId={activeId} onSelect={setActiveId} />
      <main ref={contentRef} className="overflow-y-auto px-10 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <SectionHeader section={active} />
          <SectionBody section={active} />
          <SectionFooter activeId={activeId} onSelect={setActiveId} />
        </div>
      </main>
      <RightToc section={active} contentRef={contentRef} />
    </div>
  );
}

/* ── Left nav ────────────────────────────────────────────────────────── */

function LeftNav({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useLocale();
  return (
    <aside className="overflow-y-auto border-r border-border px-4 py-10">
      <div className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title.en}>
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t(group.title)}
            </div>
            <nav className="flex flex-col gap-0.5">
              {group.sectionIds.map((id) => {
                const s = SECTIONS.find((x) => x.id === id);
                if (!s) return null;
                const isActive = activeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelect(id)}
                    className={cn(
                      "w-full rounded-md px-2 py-1 text-left text-[13px] transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {t(s.title)}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ── Section header (title + description + copy-page) ─────────────────── */

function SectionHeader({ section }: { section: DocsSection }) {
  const { t } = useLocale();
  const [copied, setCopied] = React.useState(false);
  async function copyAll() {
    try {
      await navigator.clipboard.writeText(t(section.markdown).trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t(section.title)}</h1>
        {section.description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(section.description)}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={copyAll}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title={t({ en: "Copy this page as markdown", zh: "复制本页 markdown" })}
      >
        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        {copied ? t({ en: "Copied", zh: "已复制" }) : t({ en: "Copy Page", zh: "复制" })}
      </button>
    </div>
  );
}

/* ── Section body — react-markdown with prose styles ──────────────────── */

const PROSE_CLASSES = cn(
  "prose prose-sm dark:prose-invert max-w-none",
  "[&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:scroll-mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2",
  "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-8 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-sm [&_h4]:font-semibold",
  "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-foreground/90",
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:mb-1.5",
  "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_li]:mb-1.5",
  "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:before:content-none [&_code]:after:content-none",
  "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/40 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
  "[&_td]:border-b [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
  "[&_hr]:my-8 [&_hr]:border-border",
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const headingComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={slugify(String(props.children))} {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 id={slugify(String(props.children))} {...props} />
  ),
};

function SectionBody({ section }: { section: DocsSection }) {
  const { t } = useLocale();
  return (
    <article className={PROSE_CLASSES}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={headingComponents}>
        {t(section.markdown).trim()}
      </ReactMarkdown>
    </article>
  );
}

/* ── Section footer (prev / next nav) ─────────────────────────────────── */

function SectionFooter({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useLocale();
  const idx = SECTIONS.findIndex((s) => s.id === activeId);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
  return (
    <div className="mt-16 flex items-center justify-between gap-4 border-t border-border pt-6">
      {prev ? (
        <button
          type="button"
          onClick={() => onSelect(prev.id)}
          className="group flex flex-col items-start gap-0.5 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
        >
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t({ en: "Previous", zh: "上一节" })}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ChevronRight size={14} className="rotate-180 text-muted-foreground" />
            {t(prev.title)}
          </span>
        </button>
      ) : <span />}
      {next ? (
        <button
          type="button"
          onClick={() => onSelect(next.id)}
          className="group ml-auto flex flex-col items-end gap-0.5 rounded-md border border-border bg-background px-3 py-2 text-right transition-colors hover:bg-muted"
        >
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t({ en: "Next", zh: "下一节" })}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            {t(next.title)}
            <ChevronRight size={14} className="text-muted-foreground" />
          </span>
        </button>
      ) : null}
    </div>
  );
}

/* ── Right ToC ────────────────────────────────────────────────────────── */

type TocEntry = { id: string; text: string; level: 2 | 3 };

function extractToc(markdown: string): TocEntry[] {
  const out: TocEntry[] = [];
  const lines = markdown.split("\n");
  let inCodeFence = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const m2 = /^##\s+(.+?)$/.exec(line);
    if (m2) {
      out.push({ id: slugify(m2[1]), text: m2[1], level: 2 });
      continue;
    }
    const m3 = /^###\s+(.+?)$/.exec(line);
    if (m3) out.push({ id: slugify(m3[1]), text: m3[1], level: 3 });
  }
  return out;
}

function RightToc({
  section,
  contentRef,
}: {
  section: DocsSection;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLocale();
  const md = t(section.markdown);
  const entries = React.useMemo(() => extractToc(md), [md]);
  const [activeHash, setActiveHash] = React.useState<string | null>(null);

  // Track which heading is currently in view.
  React.useEffect(() => {
    const root = contentRef.current;
    if (!root || entries.length === 0) return;
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((r) => r.isIntersecting).sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        );
        if (visible[0]) setActiveHash(visible[0].target.id);
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    for (const e of entries) {
      const el = root.querySelector<HTMLElement>(`#${CSS.escape(e.id)}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [entries, contentRef]);

  function jumpTo(id: string) {
    const root = contentRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (entries.length === 0) return <aside className="border-l border-border" />;

  return (
    <aside className="overflow-y-auto border-l border-border px-4 py-10">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {t({ en: "On this page", zh: "本节目录" })}
      </div>
      <nav className="mt-3 flex flex-col gap-1">
        {entries.map((e) => {
          const isActive = activeHash === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => jumpTo(e.id)}
              className={cn(
                "text-left text-[12px] leading-snug transition-colors",
                e.level === 3 && "pl-3",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {e.text}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
