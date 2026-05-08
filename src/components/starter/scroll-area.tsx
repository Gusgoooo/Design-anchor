import * as React from "react";

import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 可视区域最大高度，例如 `max-h-60` */
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative overflow-auto overscroll-contain", className)} {...props}>
    {children}
  </div>
));
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
