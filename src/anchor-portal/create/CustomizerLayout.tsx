import { useTheme } from "../theme/DarkModeProvider";
import { useTokenDraft } from "./useTokenDraft";
import { Customizer } from "./Customizer";
import { PreviewBoard } from "./PreviewBoard";

const SIDEBAR_WIDTH_PX = 360;

/**
 * Top-level shell for the Create-style token customizer.
 * Two floating rounded-rect panels on a muted page background:
 *   • Left: fixed-width Customizer (seed editor)
 *   • Right: PreviewBoard (live preview, scroll-x)
 *
 * Dark mode flows one-way from the portal-wide DarkModeProvider into
 * useTokenDraft; the top-nav toggle is the single source of truth.
 */
export function CustomizerLayout() {
  const { dark } = useTheme();
  const draft = useTokenDraft(dark);

  return (
    <div className="h-full w-full bg-muted/30 p-4 dark:bg-background/40">
      <div className="flex h-full gap-4">
        <div
          className="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-border"
          style={{ width: SIDEBAR_WIDTH_PX }}
        >
          <Customizer draft={draft} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl ring-1 ring-border">
          <PreviewBoard vars={draft.resolvedVars} darkMode={draft.darkMode} />
        </div>
      </div>
    </div>
  );
}
