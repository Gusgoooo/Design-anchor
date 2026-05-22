import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import readmeSrc from "../../../README.md?raw";
import { cn } from "@/lib/utils";

/**
 * Renders the project README at the Docs tab. Strips the top-of-file HTML
 * <p align="center"> badges block (GitHub-specific noise) and renders the
 * rest via react-markdown.
 */
function stripGitHubBadgesAndCenter(src: string): string {
  // Drop leading <p align="center">...</p> and <h1 align="center">...</h1>
  // blocks; everything after the first "---" hr is the real content.
  const hrIndex = src.indexOf("\n---\n");
  if (hrIndex > 0 && hrIndex < 800) {
    return src.slice(hrIndex + 5).trimStart();
  }
  return src;
}

export function DocsRoute() {
  const md = React.useMemo(() => stripGitHubBadgesAndCenter(readmeSrc), []);

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <article
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            // Tailwind v4 has no @tailwindcss/typography baked in here, so
            // explicit utility overrides keep the markdown readable.
            "[&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight",
            "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2",
            "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold",
            "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-foreground/90",
            "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_li]:mb-1.5",
            "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_li]:mb-1.5",
            "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
            "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/40 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
            "[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border-b [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
            "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
            "[&_hr]:my-8 [&_hr]:border-border",
            "[&_img]:my-4 [&_img]:rounded-md",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
