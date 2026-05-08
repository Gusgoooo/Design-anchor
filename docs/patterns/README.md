# 模式（Patterns）参考 — 文档型索引

本目录提供**第三方设计系统 Pattern 的官方深链**，供设计师、前端与 Cursor 查阅；**不镜像**各站点的完整正文（避免版权与内容漂移问题）。

## IBM Carbon Design System — Universal Patterns

- **人读**：[carbon-design-system.md](./carbon-design-system.md)（中英对照表 + 官方链接）
- **机读**：[../../src/harness/patterns/carbon-universal-patterns.json](../../src/harness/patterns/carbon-universal-patterns.json)（可给脚本、MCP、后续 Portal 使用）
- **官方总览**：[Patterns overview](https://www.carbondesignsystem.com/patterns/overview/)
- **社区模式**：[Community patterns](https://www.carbondesignsystem.com/community/patterns)

### 如何更新索引

当 Carbon 官网增减 Pattern 时：

1. 打开官方 [overview 源码](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/patterns/overview.mdx) 中的表格；
2. 同步修改 `docs/patterns/carbon-design-system.md` 与 `src/harness/patterns/carbon-universal-patterns.json`（保持 URL 与官方一致）。

### 与 Harness 组件规范的关系

- **`*.spec.json`**：仍是你产品内 **Business 组件** 的单一事实来源（intent、forbidden、styleLock 等）。
- **Carbon Patterns**：描述**组合与流程**的业界参考；实现时应用 **本仓库的 Business 组件** 满足同类场景，而不是照搬 Carbon React 组件 API。

### Material Design 3

- **人读**：[material-design.md](./material-design.md)（与 JSON 同步的深链表）
- **机读**：[../../src/harness/patterns/material-universal-patterns.json](../../src/harness/patterns/material-universal-patterns.json)
- **官方入口**：[Get started](https://m3.material.io/get-started)

与 Carbon 相同：**仅索引 + 深链**，不镜像正文。Portal 内 **Patterns** 页顶部 **Tab** 可在 Carbon 与 Material 之间切换；「查看代码」会随当前 Tab 生成对应摘要。

### Portal（Storybook）入口

侧栏与 **DesignToken** 同款的 **Patterns** 按钮可打开全屏文档页（`src/harness/patterns/Patterns.mdx` → `PatternsPage.tsx`），内含 **Tab 切换来源**、可复制的 **AI/Agent 用 JSON 摘要** 与官网深链表。
