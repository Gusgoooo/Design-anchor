/**
 * 表单控件与 Button 共用的垂直档位（sm / default / lg），及 Button 独有的 icon。
 * 仅导出类名字符串片段，由各组件 cva 与横向 padding 等组合。
 */
export const controlFieldSizeCore = {
  sm: "h-7 text-xs",
  default: "h-9 text-sm",
  lg: "h-11 text-sm",
  icon: "size-9 shrink-0",
} as const;

export type ControlFieldSizeCoreKey = keyof typeof controlFieldSizeCore;

/** Input、SelectTrigger 等与按钮对齐的档位（不含 icon） */
export type FormControlSize = Exclude<ControlFieldSizeCoreKey, "icon">;
