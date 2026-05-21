import * as React from "react";
import { Layers } from "lucide-react";

/**
 * Placeholder for design patterns documentation. The legacy patterns.mdx
 * was never authored, so this is intentionally a stub until product
 * content arrives.
 */
export function PatternsRoute() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-12 text-center">
      <Layers size={28} className="text-muted-foreground" />
      <h2 className="text-base font-semibold text-foreground">Patterns</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Design pattern documentation lives here. Add MDX or TSX content under
        <code className="mx-1 rounded bg-muted px-1 font-mono">src/anchor-portal/docs/patterns/</code>
        and surface it through this route.
      </p>
    </div>
  );
}
