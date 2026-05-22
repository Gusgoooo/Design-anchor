import * as React from "react";
import { Check, Copy, Moon, Sun, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme/DarkModeProvider";
import { navigateTo, tabForRoute, useRoute, type TopTab } from "./router";

const BASH_COMMAND = "npx anchor start";

const TABS: { id: TopTab; label: string; onClick: () => void }[] = [
  { id: "docs", label: "Docs", onClick: () => navigateTo({ kind: "docs" }) },
  { id: "designtoken", label: "Design Token", onClick: () => navigateTo({ kind: "designtoken" }) },
  { id: "components", label: "Components", onClick: () => navigateTo({ kind: "components" }) },
];

export function TopNav() {
  const route = useRoute();
  const active = tabForRoute(route);
  const { dark, toggle } = useTheme();

  return (
    <header className="flex shrink-0 items-center gap-6 border-b border-border bg-background px-5 py-2.5">
      <a
        href="#/docs"
        className="text-[15px] font-bold tracking-tight text-foreground no-underline hover:opacity-80"
      >
        DesignAnchor
      </a>

      <nav className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={t.onClick}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active === t.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <BashHint command={BASH_COMMAND} />
        <button
          type="button"
          onClick={toggle}
          title={dark ? "Switch to light" : "Switch to dark"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

function BashHint({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="group flex items-center gap-2 rounded-md border border-border bg-muted/40 pl-2.5 pr-1 py-1"
      title="Launch this product locally with the following command"
    >
      <Terminal size={12} className="shrink-0 text-muted-foreground" />
      <code className="font-mono text-[11px] text-foreground/85">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </div>
  );
}
