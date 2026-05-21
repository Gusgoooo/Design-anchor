import * as React from "react";
import { DesignTokenPage } from "@/design-tokens/DesignTokenPage";

/**
 * Hosts the existing DesignTokenPage inside the portal's canvas area.
 * The page itself manages its own dark mode + sticky header, so the
 * wrapper just provides a full-height scroll surface.
 */
export function DesignTokenRoute() {
  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <DesignTokenPage />
    </div>
  );
}
