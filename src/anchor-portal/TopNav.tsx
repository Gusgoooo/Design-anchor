import * as React from "react";
import { Check, Copy, Globe, HelpCircle, Moon, Sun, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme/DarkModeProvider";
import { useLocale, type Bilingual } from "./i18n/LocaleProvider";
import { navigateTo, tabForRoute, useRoute, type TopTab } from "./router";
import { HealthWidget } from "./HealthWidget";

const BASH_COMMAND = "npx design-anchor start";

const TABS: { id: TopTab; label: Bilingual; onClick: () => void }[] = [
  { id: "designtoken", label: { en: "Theme", zh: "主题" }, onClick: () => navigateTo({ kind: "designtoken" }) },
  { id: "components", label: { en: "Library", zh: "组件库" }, onClick: () => navigateTo({ kind: "components" }) },
];

export function TopNav() {
  const route = useRoute();
  const active = tabForRoute(route);
  const { dark, toggle } = useTheme();
  const { locale, toggle: toggleLocale, t } = useLocale();

  return (
    <header className="flex shrink-0 items-center gap-6 border-b border-border bg-background px-5 py-2.5">
      <a
        href="#/theme"
        className="text-base font-bold tracking-tight text-foreground no-underline hover:opacity-80"
      >
        DesignAnchor
      </a>

      <nav className="flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={tab.onClick}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {t(tab.label)}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <HealthWidget />
        <button
          type="button"
          onClick={() => navigateTo({ kind: "docs" })}
          title={t({ en: "Help and docs", zh: "帮助和文档" })}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            route.kind === "docs" ? "bg-muted text-foreground" : "",
          )}
        >
          <HelpCircle size={14} />
          <span>{t({ en: "Docs", zh: "文档" })}</span>
        </button>
        <BashHint command={BASH_COMMAND} hintLabel={t({ en: "Launch this product locally", zh: "本地启动该产品" })} />
        <button
          type="button"
          onClick={toggleLocale}
          title={locale === "en" ? "切换到中文" : "Switch to English"}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Globe size={13} />
          <span className="font-semibold">{locale === "en" ? "EN" : "中文"}</span>
        </button>
        <button
          type="button"
          onClick={toggle}
          title={t({ en: dark ? "Switch to light" : "Switch to dark", zh: dark ? "切换到亮色" : "切换到暗色" })}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

function BashHint({ command, hintLabel }: { command: string; hintLabel: string }) {
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
      title={hintLabel}
    >
      <Terminal size={12} className="shrink-0 text-muted-foreground" />
      <code className="font-mono text-sm text-foreground/85">{command}</code>
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
