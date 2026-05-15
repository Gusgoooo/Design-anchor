/**
 * Fullscreen overlay: light-gray translucent + backdrop blur (not deep black), consistent with modern floating layers like ChatGPT.
 * Used for Dialog / AlertDialog / Sheet / Drawer and other Radix Portal overlays.
 */
export const modalOverlayClasses =
  "fixed inset-0 z-50 bg-zinc-950/25 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-zinc-950/45"
