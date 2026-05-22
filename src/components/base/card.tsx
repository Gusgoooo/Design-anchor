import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Card chrome mirrors shadcn v4 base-Maia preset:
 *   - ring-1 ring-foreground/10 instead of border  (softer outline)
 *   - flex flex-col with gap-6 between header / content / footer
 *     (vertical rhythm via parent gap, no rigid per-child p-6)
 *   - py-6 once on the root; children only handle horizontal px
 *   - size="sm" tightens to gap-4 / py-4 / px-4
 *   - text-sm body, text-base font-medium title
 *
 * API note: every existing call site that just nested <CardHeader> +
 * <CardContent> + <CardFooter> works without changes — the internal
 * spacing model improved but the export surface is identical.
 */

type CardSize = "default" | "sm";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: CardSize }
>(({ className, size = "default", ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    data-size={size}
    className={cn(
      "group/card flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground text-sm ring-1 ring-border",
      size === "sm" ? "gap-4 py-4" : "gap-6 py-6",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 px-6 group-data-[size=sm]/card:px-4",
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn("text-base font-medium leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("text-sm leading-snug text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 px-6 group-data-[size=sm]/card:px-4",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
