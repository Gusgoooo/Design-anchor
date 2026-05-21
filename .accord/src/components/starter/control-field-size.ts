/**
 * Vertical size tiers shared by form controls and Button (sm / default / lg), plus the Button-only icon size.
 * Exports only className string fragments; combined with each component's cva and horizontal padding.
 */
export const controlFieldSizeCore = {
  sm: "h-7 text-xs",
  default: "h-9 text-sm",
  lg: "h-11 text-sm",
  icon: "size-9 shrink-0",
} as const;

export type ControlFieldSizeCoreKey = keyof typeof controlFieldSizeCore;

/** Size tiers for Input, SelectTrigger, etc. aligned with Button (excludes icon) */
export type FormControlSize = Exclude<ControlFieldSizeCoreKey, "icon">;
