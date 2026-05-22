import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useTheme } from "../theme/DarkModeProvider";
import { useTokenDraft } from "./useTokenDraft";
import { Customizer } from "./Customizer";
import { PreviewBoard } from "./PreviewBoard";

const SEP_H = "w-px bg-border hover:bg-foreground/30 data-[dragging]:bg-foreground/40 transition-colors";

/**
 * Top-level shell for the Create-style token customizer.
 * Left: compact seed editor (Customizer)
 * Right: live preview board styled with current draft tokens (PreviewBoard)
 *
 * Dark mode is shared with the global portal theme so toggling here also
 * flips the chrome (sidebar / panel tabs).
 */
export function CustomizerLayout() {
  const { dark, setDark } = useTheme();
  const draft = useTokenDraft(dark);

  // Keep portal-wide dark mode in sync with the customizer's local toggle.
  React.useEffect(() => {
    if (draft.darkMode !== dark) setDark(draft.darkMode);
  }, [draft.darkMode, dark, setDark]);

  return (
    <div className="h-full w-full">
      <Group id="anchor-customizer-h" orientation="horizontal" className="flex h-full w-full">
        <Panel id="customizer" defaultSize="28%" minSize="22%" maxSize="42%" className="flex flex-col bg-background">
          <Customizer draft={draft} />
        </Panel>
        <Separator className={SEP_H} />
        <Panel id="preview" defaultSize="72%" minSize="40%" className="flex flex-col">
          <PreviewBoard vars={draft.resolvedVars} darkMode={draft.darkMode} />
        </Panel>
      </Group>
    </div>
  );
}
