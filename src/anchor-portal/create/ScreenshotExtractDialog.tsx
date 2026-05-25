import * as React from "react";
import { Camera, Check, Copy, RefreshCw, X } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider";
import type { TokenDraft } from "./useTokenDraft";

type Props = {
  open: boolean;
  onClose: () => void;
  draft: TokenDraft;
};

const CLI_COMMAND = "npx design-anchor screenshot";

export function ScreenshotExtractDialog({ open, onClose, draft }: Props) {
  const { t } = useLocale();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [reloading, setReloading] = React.useState(false);

  React.useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(CLI_COMMAND);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = CLI_COMMAND;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
    }
  }

  async function handleReload() {
    setReloading(true);
    try {
      await draft.reload();
    } finally {
      setReloading(false);
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed left-1/2 top-1/2 w-[480px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-zinc-950/30 backdrop:backdrop-blur-md"
    >
      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Camera size={14} />
            {t({ en: "Extract tokens from a screenshot", zh: "从截图提取 Token" })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t({ en: "Close", zh: "关闭" })}
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t({
              en: "Run the command below in your terminal — it will walk you through pasting the prompt into your AI tool (Cursor / Claude Code / Copilot / ChatGPT). The AI will write tokens directly into tokens.json via MCP; nothing comes back through this dialog.",
              zh: "在终端里运行下面这条命令——它会一步步告诉你怎么把 prompt 粘给你自己的 AI 工具（Cursor / Claude Code / Copilot / ChatGPT 都行）。AI 通过 MCP 直接改 tokens.json，无需把结果粘回这里。",
            })}
          </p>

          <div className="relative">
            <pre className="rounded-md border border-border bg-muted/40 px-3 py-2.5 pr-12 font-mono text-sm leading-relaxed text-foreground">
              <span className="select-none text-muted-foreground/70">$ </span>
              {CLI_COMMAND}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
              title={t({ en: "Copy command", zh: "复制命令" })}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied
                ? t({ en: "Copied", zh: "已复制" })
                : t({ en: "Copy", zh: "复制" })}
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            {t({
              en: "When the AI is done, click \"Reload tokens\" below to pull the changes into the Portal.",
              zh: "AI 改完之后，点下方「重新加载 token」把改动同步进 Portal",
            })}
          </p>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t({ en: "Close", zh: "关闭" })}
          </button>
          <button
            type="button"
            onClick={handleReload}
            disabled={reloading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw size={11} className={reloading ? "animate-spin" : ""} />
            {reloading
              ? t({ en: "Reloading…", zh: "加载中…" })
              : t({ en: "Reload tokens", zh: "重新加载 token" })}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
