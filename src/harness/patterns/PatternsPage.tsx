import * as React from "react";
import { Code, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/starter/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/starter/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/starter/tabs";
import carbonCatalog from "./carbon-universal-patterns.json";
import materialCatalog from "./material-universal-patterns.json";

type PatternRow = {
  id: string;
  title: string;
  path: string;
  officialSummaryEn: string;
  harnessHintZh: string;
};

type CatalogSource = {
  name: string;
  overviewUrl: string;
  communityPatternsUrl?: string;
  overviewSourceFile?: string;
  figmaKitUrl?: string;
};

type Catalog = {
  title: string;
  description: string;
  source: CatalogSource;
  baseUrl: string;
  patterns: PatternRow[];
};

const CATALOGS: Record<"carbon" | "material", Catalog> = {
  carbon: carbonCatalog as Catalog,
  material: materialCatalog as Catalog,
};

const DIGEST_FILENAMES: Record<"carbon" | "material", string> = {
  carbon: "carbon-universal-patterns.json",
  material: "material-universal-patterns.json",
};

/** 供 Agent / 复制：结构化清单（不含第三方长文，仅摘要 + URL） */
function buildMachineDigest(catalog: Catalog): object {
  const base = catalog.baseUrl.replace(/\/$/, "");
  return {
    source: catalog.source.name,
    overviewUrl: catalog.source.overviewUrl,
    policy:
      "Implement UI using this repo's Business components and *.spec.json; external pattern indexes are compositional reference only.",
    patterns: catalog.patterns.map((p) => ({
      id: p.id,
      title: p.title,
      url: `${base}${p.path}`,
      officialSummaryEn: p.officialSummaryEn,
      harnessHintZh: p.harnessHintZh,
    })),
  };
}

export function PatternsPage() {
  const [source, setSource] = React.useState<"carbon" | "material">("carbon");
  const catalog = CATALOGS[source];
  const base = catalog.baseUrl.replace(/\/$/, "");

  const digest = React.useMemo(() => JSON.stringify(buildMachineDigest(catalog), null, 2), [catalog]);

  const [codeOpen, setCodeOpen] = React.useState(false);
  const codeDialogRef = React.useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const el = codeDialogRef.current;
    if (!el) return;
    if (codeOpen && !el.open) el.showModal();
    else if (!codeOpen && el.open) el.close();
  }, [codeOpen]);

  async function copyDigest() {
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const attribution =
    source === "carbon"
      ? "IBM Carbon 及其贡献者"
      : "Google Material Design 及其贡献者";

  return (
    <div className="not-prose flex min-h-screen w-full min-w-0 flex-col text-foreground">
      <header className="w-full min-w-0 border-b border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">Patterns</h1>

            <Tabs value={source} onValueChange={(v) => setSource(v as "carbon" | "material")} className="w-full max-w-xl">
              <TabsList className="w-full justify-start sm:w-auto">
                <TabsTrigger value="carbon">IBM Carbon</TabsTrigger>
                <TabsTrigger value="material">Material Design 3</TabsTrigger>
              </TabsList>
            </Tabs>

            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              索引来源：
              <a
                className="ml-1 font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
                href={catalog.source.overviewUrl}
                target="_blank"
                rel="noreferrer"
              >
                {catalog.source.name}
              </a>
              。正文与示意图以官网为准；下方表格为<strong className="font-medium text-foreground">官方概述（英）</strong>与
              <strong className="font-medium text-foreground"> Harness 落地提示（中）</strong>。
            </p>
            {catalog.source.communityPatternsUrl ? (
              <p className="text-xs text-muted-foreground">
                Community patterns：
                <a
                  className="ml-1 text-foreground underline decoration-muted-foreground/40 underline-offset-2"
                  href={catalog.source.communityPatternsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {catalog.source.communityPatternsUrl}
                </a>
              </p>
            ) : null}
            {catalog.source.figmaKitUrl ? (
              <p className="text-xs text-muted-foreground">
                Figma 资源：
                <a
                  className="ml-1 text-foreground underline decoration-muted-foreground/40 underline-offset-2"
                  href={catalog.source.figmaKitUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  M3 Design Kit
                </a>
              </p>
            ) : null}
            {catalog.source.overviewSourceFile ? (
              <p className="text-xs text-muted-foreground">
                开源 / 资源：
                <a
                  className="ml-1 break-all text-foreground underline decoration-muted-foreground/40 underline-offset-2"
                  href={catalog.source.overviewSourceFile}
                  target="_blank"
                  rel="noreferrer"
                >
                  {catalog.source.overviewSourceFile}
                </a>
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setCodeOpen(true)}>
              <Code size={14} className="mr-2" />
              查看代码
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full min-w-0 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-border">
          <Table className="border-collapse text-left text-sm">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                <TableHead className="px-4 py-3 font-semibold text-foreground">模式</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">官方概述（英）</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">Harness 落地提示</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">文档</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.patterns.map((p) => (
                <TableRow key={p.id} className="border-b border-border/60 last:border-0">
                  <TableCell className="align-top px-4 py-3 font-medium text-foreground">{p.title}</TableCell>
                  <TableCell className="align-top px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    {p.officialSummaryEn}
                  </TableCell>
                  <TableCell className="align-top px-4 py-3 text-xs leading-relaxed text-foreground/90">
                    {p.harnessHintZh}
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap px-4 py-3">
                    <a
                      className="text-xs font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
                      href={`${base}${p.path}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      打开官网
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <p className="text-xs text-muted-foreground">
          文档著作权归 {attribution}。人读索引另见{" "}
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">docs/patterns/</code>
          ；AI 用 JSON 见右上角「查看代码」（随 Tab 切换当前来源）。
        </p>
      </div>

      <dialog
        ref={codeDialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-0 px-4 text-card-foreground shadow-2xl backdrop:bg-black/50 sm:px-0"
        onClose={() => setCodeOpen(false)}
        onClick={(e) => {
          if (e.target === codeDialogRef.current) setCodeOpen(false);
        }}
      >
        <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <h2 className="text-sm font-semibold text-foreground">patterns-ai-digest.json</h2>
              <span className="truncate text-xs text-muted-foreground">
                当前：{catalog.source.name} · {DIGEST_FILENAMES[source]}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setCodeOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="px-5 pb-4">
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              由{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{DIGEST_FILENAMES[source]}</code>{" "}
              生成的只读摘要；完整说明请点表格「打开官网」。切换上方 Tab 可生成另一来源的摘要。
            </p>
            <textarea
              readOnly
              className="min-h-60 max-h-96 w-full cursor-text select-all rounded-lg border border-input bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              spellCheck={false}
              value={digest}
            />
          </div>

          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <Button type="button" variant="outline" size="sm" onClick={() => void copyDigest()}>
              {copied ? (
                <>
                  <Check size={14} className="mr-2" />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-2" />
                  复制
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setCodeOpen(false)}>
              关闭
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
