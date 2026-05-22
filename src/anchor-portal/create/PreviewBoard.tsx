import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BarChartCard,
  CodespacesCard,
  EnvironmentVariables,
  IconPreviewGrid,
  Shortcuts,
  StyleOverview,
  TypographySpecimen,
  UIElements,
} from "./preview-cards";

const PREVIEW_ROOT_ATTR = "data-anchor-preview";

/** Stringify resolvedVars as a CSS rule scoped to the preview root. */
function buildScopedCss(vars: Record<string, string>): string {
  const decls = Object.entries(vars)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(" ");
  return `[${PREVIEW_ROOT_ATTR}] { ${decls} }`;
}

/**
 * Right-side preview composition. Mirrors shadcn /create's preview registry
 * item (apps/v4/registry/bases/base/blocks/preview/index.tsx) using our base
 * components. The whole tree is scoped with [data-anchor-preview] and the
 * draft tokens are injected as CSS variables on that scope so every edit on
 * the left re-styles the components instantly.
 */
export function PreviewBoard({
  vars,
  darkMode,
}: {
  vars: Record<string, string>;
  darkMode: boolean;
}) {
  const css = React.useMemo(() => buildScopedCss(vars), [vars]);

  return (
    <div
      {...{ [PREVIEW_ROOT_ATTR]: "" }}
      className={cn(
        "relative h-full w-full overflow-y-auto bg-muted/40 p-4 dark:bg-background",
        darkMode && "dark",
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="mx-auto grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {/* Column-major arrangement mirroring shadcn's preview index */}
        <div className="flex flex-col gap-4">
          <StyleOverview />
          <TypographySpecimen />
          <CodespacesCard />
        </div>
        <div className="flex flex-col gap-4">
          <IconPreviewGrid />
          <UIElements />
          <Shortcuts />
        </div>
        <div className="flex flex-col gap-4">
          <EnvironmentVariables />
          <BarChartCard />
        </div>
      </div>
    </div>
  );
}
