import * as React from "react";

import { cn } from "@/lib/utils";

/** 仅为 Storybook / 简单场景；复杂定位请后续接入 Radix Tooltip。 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("group/tooltip relative inline-flex", className)}>{children}</span>;
}

export function TooltipTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <span className={cn("inline-flex", className)} {...props}>
      {children}
    </span>
  );
}

export function TooltipContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-50 mb-[var(--padding-xs)] max-w-xs -translate-x-1/2 rounded-md border border-border bg-popover px-[var(--padding-sm)] py-[var(--padding-xxs)] text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-150",
        "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
}
