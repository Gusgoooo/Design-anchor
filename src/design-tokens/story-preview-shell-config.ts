/**
 * Story-level utility: radius options, compliance declaration.
 * Does not contain any wrapper components or global overrides.
 */
import { tokenIdsByCategory } from "./story-controls";

export function radiusTokenOptions(): string[] {
  return Array.from(
    new Set([...tokenIdsByCategory("radius"), ...tokenIdsByCategory("radius-scale")]),
  );
}

export function storyAccordCompliance(opts: {
  extraTokenIds?: string[];
  ignoreArgNames?: string[];
}) {
  return {
    sidebarStatus: "full" as const,
    tokenIdArgs: [...(opts.extraTokenIds ?? [])],
    scanFreeTextControls: true,
    ignoreArgNames: opts.ignoreArgNames ?? [],
  };
}
