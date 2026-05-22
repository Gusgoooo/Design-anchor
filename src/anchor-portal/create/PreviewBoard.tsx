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
 * item layout: a fixed-width column grid that does NOT shrink-to-fit the
 * viewport. When the panel is narrower than the grid, the user scrolls
 * (drags) horizontally — matching shadcn's behaviour. Card chrome stays at
 * its intrinsic size so internal padding / layout never breaks.
 *
 * The whole tree is scoped with [data-anchor-preview] and the draft tokens
 * are injected as CSS variables on that scope so every left-panel edit
 * re-styles the components instantly.
 */
export function PreviewBoard({
  vars,
  darkMode,
}: {
  vars: Record<string, string>;
  darkMode: boolean;
}) {
  const css = React.useMemo(() => buildScopedCss(vars), [vars]);

  // 4 fixed columns × 360px column width + 4 × 16px gap = 1488px content,
  // wider than typical panel widths so horizontal scroll kicks in. Adjust
  // COLUMN_PX / COLUMN_COUNT if more density is needed.
  const COLUMN_PX = 360;
  const COLUMN_COUNT = 4;
  const GAP_PX = 16;
  const gridWidth = COLUMN_PX * COLUMN_COUNT + GAP_PX * (COLUMN_COUNT - 1);

  return (
    <div
      {...{ [PREVIEW_ROOT_ATTR]: "" }}
      className={cn(
        "relative h-full w-full overflow-auto bg-muted/40 dark:bg-background",
        darkMode && "dark",
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="flex min-w-max justify-center p-4">
        <div
          className="grid items-start"
          style={{
            width: `${gridWidth}px`,
            gridTemplateColumns: `repeat(${COLUMN_COUNT}, ${COLUMN_PX}px)`,
            gap: `${GAP_PX}px`,
          }}
        >
          {/* Column-major: shadcn-style. Each column is its own vertical
              stack so cards don't reflow when one grows. */}
          <div className="flex flex-col gap-4">
            <StyleOverview />
            <TypographySpecimen />
          </div>
          <div className="flex flex-col gap-4">
            <IconPreviewGrid />
            <UIElements />
          </div>
          <div className="flex flex-col gap-4">
            <EnvironmentVariables />
            <BarChartCard />
          </div>
          <div className="flex flex-col gap-4">
            <CodespacesCard />
            <Shortcuts />
          </div>
        </div>
      </div>
    </div>
  );
}
