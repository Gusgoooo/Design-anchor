import * as React from "react";
import { CustomizerLayout } from "../create/CustomizerLayout";

/**
 * Hosts the Create-style token customizer (left panel = seed editor with
 * collapsible derived tokens, right panel = live component preview board).
 * Replaces the older DesignTokenPage; that file remains as a deep-link
 * target for the JSON modal but is no longer reachable from this route.
 */
export function DesignTokenRoute() {
  return (
    <div className="h-full w-full">
      <CustomizerLayout />
    </div>
  );
}
