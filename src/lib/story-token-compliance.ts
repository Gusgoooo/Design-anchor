/**
 * Storybook `meta.parameters` 扩展：侧栏组件名右侧圆点由 `.storybook/manager.tsx` 读取
 * `harnessTokenCompliance.sidebarStatus`（见各 `*.stories.tsx`）。
 */
export type HarnessTokenComplianceParameters = {
  /**
   * 侧栏：该组件下**每一条** Story 合并后的 parameters 均须为 `full`，圆点才为绿色。
   * 与 Controls 实际是否全 token 一致需人工/后续脚本校验。
   */
  sidebarStatus?: "full" | "partial";
  /** 不用于侧栏圆点；可留给画布或其它工具 */
  hide?: boolean;
  forceStatus?: "full" | "partial";
  tokenIdArgs?: string[];
  scanFreeTextControls?: boolean;
  ignoreArgNames?: string[];
};
