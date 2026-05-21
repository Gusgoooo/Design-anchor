# Design-anchor — 改造进度与计划

> **下次开新对话给 Claude 的话**：
> 「读 `docs/PROGRESS.md` 继续未完成阶段。」
> Claude 会从这份文档恢复上下文、计划、决策、待办。

---

## 产品信息

| 项 | 值 |
|---|---|
| 产品名 | **Design-anchor** |
| 仓库 | `~/Documents/Design-anchor/` |
| npm 包名 | `design-anchor` |
| CLI 命令 | `npx anchor` |
| 来源 | https://github.com/Gusgoooo/DesignAccord.git（已重命名为 Design-anchor） |

## 启动开发环境

```bash
cd ~/Documents/Design-anchor
claude --permission-mode bypassPermissions   # 免确认 Claude 会话
# 然后在 Claude 内或另一个终端：
npm run dev                                  # 启动 anchor-portal（Vite + 自研 SPA）
# 或： npx anchor dev .                      # CLI 入口
# 默认 6006 端口；端口被占会自动找下一个
```

> Storybook 已在阶段 2 完全移除：依赖卸载、`.storybook/` 删除、所有 `*.stories.tsx` 改名 `*.demo.tsx`，运行时切换到 `src/anchor-portal/`。

---

## 整体目标（用户原始诉求）

1. ✅ **重命名**：DesignAccord → Design-anchor，所有 `harness` / `accord` 引用清除，统一为 `anchor`
2. ✅ **去 Storybook 化**：完全复刻 Storybook 当前提供的功能；不再依赖 `storybook` / `@storybook/*` 任何包；产品自由演化
3. ⏳ **Radix UI 全量对齐**：每个组件补齐 Radix UI 文档中的所有 sub-component 与 variant
4. ⏳ **Token 驱动**：所有视觉属性（color / spacing / radius / shadow / typography / motion）必须映射 design tokens；修改 token 后所有组件自动响应；硬编码值由 `anchor-audit` 扫出
5. ⏳ **零遗留错误**：全盘排查，确保产品无错误或隐藏问题

---

## 关键决策（用户已确认）

| # | 决策 | 选择 |
|---|---|---|
| 1 | 阶段 2 预览隔离方式 | **B**：同帧 + CSS scope（不用 iframe） |
| 2 | Stories 文件类型 | **B**：阶段 2 改名 `*.stories.tsx` → `*.demo.tsx` ✅ |
| 3 | Controls UI 风格 | **A**：复刻 Storybook 两栏表格（Name + Control 两栏，可选 expanded 显示 Description） ✅ |
| 4 | 布局形态 | Storybook-like：左栏导航 / 右上 Canvas / 右下 Controls·Spec tabs；icon 用 `lucide-react` |

---

## 阶段进度

### ✅ 阶段 0 — 基线（commit `1cf5167`、`b3f50a4`）
干净 git 工作树、`.accord/` `.anchor/` 加入 `.gitignore`、完整代码盘点。

### ✅ 阶段 1 — 全局重命名（commit `f7d8e57`）
157 个文件、目录、CLI、包名全部替换为 `anchor`。`Accordion` Radix 原语未改。

### ✅ 阶段 2 — 去 Storybook 化（commits `66bbd98` → `589e097`）

**已交付**（按 sub-stage 顺序）：

| Sub-stage | Commit | 内容 |
|---|---|---|
| 2.A 基础设施 | `66bbd98` | `src/anchor-portal/{vite.config.ts, index.html, main.tsx, argTypes-types.ts, story-registry.ts, router.ts, theme/DarkModeProvider.tsx, App.tsx}` + Button.stories→Button.demo 烟雾测试 |
| 2.B App shell | `66bbd98` | `react-resizable-panels` v4 三区可拖拽（左 sidebar / 右上 canvas / 右下 panel tabs），lucide 图标 |
| 2.C 侧边栏 | `3530ddd` | `sidebar/{SidebarTop.tsx, SidebarTree.tsx, kit-status.ts}`，递归树 + 红点 + 暗黑切换 + DesignToken 按钮 |
| 2.D Canvas | `0168642` | `canvas/{Canvas.tsx, PreviewFrame.tsx}` + `usePreviewState.tsx`（StorySessionProvider）；layout 装饰器 fullscreen/centered/padded；StoryErrorBoundary |
| 2.E Controls | `92a32bb` | `controls/{ControlsPanel.tsx, normalize.ts, controls/ControlInput.tsx}`，两栏表格、八种控件类型、分类分组、reset |
| 2.F SpecPanel | `6c52f86` | `spec-editor/SpecPanel.tsx`（直接移植 `AnchorPanel`），`docs/{DesignTokenRoute, PatternsRoute}.tsx`，`sidebar/{AddComponentDialog, ContextMenu}.tsx` |
| 2.G 批量改名 | `dad6609` | 61 个 `*.stories.tsx → *.demo.tsx`（git mv 保留历史），sed 替换 `@storybook/react` import → `@/anchor-portal/argTypes-types`，relaxed `Meta.component` 兼容泛型 |
| 2.H 清理依赖 | `fd38f0b` | 卸载 `storybook` / `@storybook/*` / `react-docgen-typescript`；package.json scripts `dev`/`build`；删除 `.storybook/` 与 `DesignToken.mdx`；schema plugin 更新 `.demo.tsx` 与 `.anchor-portal/kit-status.json`；bin/anchor.mjs CLI 全部走 Vite |
| 2.I 回归 + 文档 | _本次_ | audit-config 增 `/anchor-portal/`、`.demo.` 排除；本文档更新 |

**自动化验证（已通过）**：
- ✅ `npx tsc --noEmit` 全量通过
- ✅ `npm run anchor:audit` 通过（扫描 1 个 .tsx，无违规）
- ✅ `npm run sync:tokens` 通过
- ✅ `npm install` 已剥离 storybook 包，lockfile 减少 ~2200 行
- ✅ Portal `/api/schemas` 返回 64 条；`/api/kit-status` 返回空 components；`/api/design-tokens` 可读
- ✅ Vite glob 发现 62 个 `*.demo.tsx`

**回归测试清单（用户需在浏览器验证）**：

打开 http://localhost:6006/（或 portal 启动时显示的端口），逐项核对：

- [ ] **侧边栏树渲染、点击切换组件**：左栏出现树，点击 chevron 展开 stories；点击 story 名进入预览
- [ ] **DesignToken 编辑面板**：点 "DesignToken" 按钮，sticky 标题 + 4 按钮（Light/Dark、JSON、Reload、Save & Sync）正常
- [ ] **Spec.json 面板按 story 变体加载、保存调用 sync:anchor**：选 Button → Default，切到 Spec.json tab，编辑 intent 字段后 Save，应看到 "Written to disk + sync:anchor executed"
- [ ] **Add Component 上传 .tsx 走 `/api/upload-component`**：点 "Add Component" 按钮，选一个 .tsx 文件，上传成功后 portal reload，新组件出现
- [ ] **右键删除组件**：sidebar 中右键任意组件 → Delete confirm → 文件被删除（小心！可在测试组件上验证）
- [ ] **暗黑切换（标题、画布、Controls 三处一致）**：点 sidebar 头部的月亮/太阳图标，整个 portal 切换
- [ ] **kit-status 红点**：仅在消费者项目（`anchor init` 后）有 `.anchor-portal/kit-status.json` 才会显示；dev 仓库默认为空，跳过
- [ ] **自动 Token Override · Bound controls**：在 Button story 的 Controls 面板里能看到 "Token Override · Bound" 类别下的 select 控件（来自 `autoClassControls`）
- [ ] **AI 组件**：sidebar AI 分组下 Thread / Attachment / FollowUpSuggestions / MarkdownText / AssistantSidebar / AssistantModal 都能渲染（layout 多为 fullscreen）

### 🟡 阶段 3 — Radix UI 对齐（Radix 系全部完成，custom 系剩 AI 组件）

**已完成的 Radix-backed 组件（commit `5b390ea`、`338455e`）**：

| 组件 | 改动 | 新导出 / 变体 |
|---|---|---|
| Select | 补齐 Radix 全表面 | SelectPortal / SelectIcon / SelectViewport / SelectItemText / SelectItemIndicator / SelectArrow + selectTriggerVariants |
| Popover | 补齐 Radix 全表面 | PopoverAnchor / PopoverPortal / PopoverClose / PopoverArrow（fill-popover token） |
| Checkbox | 补齐状态与尺寸 | indeterminate 状态（Minus 图标）+ size sm/default/lg + CheckboxIndicator |
| RadioGroup | 补齐排版与尺寸 | orientation horizontal/vertical + size sm/default/lg + RadioGroupIndicator |
| Tabs | 补齐风格与方向 | variant pill/underline + orientation horizontal/vertical |
| Accordion | 补齐 Header | AccordionHeader |
| ScrollArea | 补齐 Radix 全表面 | ScrollAreaViewport / ScrollAreaCorner / ScrollAreaThumb / ScrollAreaScrollbar |
| Tooltip | 补齐 Portal / Arrow | TooltipPortal / TooltipArrow |
| HoverCard | 补齐 Portal / Arrow | HoverCardPortal / HoverCardArrow |
| DropdownMenu | 补齐 Arrow / Indicator | DropdownMenuArrow / DropdownMenuItemIndicator |
| ContextMenu | 补齐 Arrow / Indicator | ContextMenuArrow / ContextMenuItemIndicator |
| Menubar | 补齐 Arrow / Indicator | MenubarArrow / MenubarItemIndicator |
| Switch | 补齐尺寸 + Thumb | size sm/default/lg + SwitchThumb |
| Slider | 补齐方向 + 子部件 | orientation horizontal/vertical + SliderTrack / SliderRange / SliderThumb |
| Progress | 补齐 Indicator | ProgressIndicator |
| Avatar | 切换到 Radix UI | 使用 @radix-ui/react-avatar 获得图像加载失败自动 fallback |

**已验收 / Radix 表面已齐全的组件（无需改动）**：

Dialog, AlertDialog, Sheet（Radix Dialog 实现）, Menubar*, NavigationMenu, DropdownMenu*, ContextMenu*, Collapsible, AspectRatio, Label, Toggle, ToggleGroup, Separator
*：通过 3.4 commit 补齐了 Arrow / Indicator

**非 Radix（自定义实现，按需补 variants）**：

Button, Input, InputGroup, InputOtp, Textarea, Card, Badge, Alert, Empty, Skeleton, Spinner, Kbd, Item, ButtonGroup, Breadcrumb, Pagination, Calendar（react-day-picker）, Carousel（embla）, Command（cmdk）, Resizable（react-resizable-panels）, Drawer（vaul）, Sidebar, Sonner, Form, Field, Chart, Table, DataTable

> 这些组件本身不是 Radix 包装，主要是产品级变体（size/variant/intent）补全工作；变体口径由产品决定，建议按使用频率逐个补。

**spec.json 同步**：所有改动的组件 `wraps.primitives` 已写齐；`npm run sync:anchor` 重新生成 `.cursorrules` / `ANCHOR_RULES.md` / tailwind 扩展（覆盖 64 个 spec）。

**自动化验证（已通过）**：
- ✅ `npx tsc --noEmit`
- ✅ `npm run anchor:audit`（portal/demo 已加入排除）
- ✅ `npm run sync:anchor`

### ✅ 阶段 3.7 — AI 组件（assistant-ui 系列）

12 个 AI 组件 wrapper 与 demo 此前已搭建完毕；本次只修订 `wraps.primitives` 与实际命名导出对齐，确保 `anchor:audit` / `sync:anchor` 看到完整组件表面：

| 组件 | 新增（之前漏写） |
|---|---|
| Reasoning | `Reasoning`、`ReasoningGroup`、`ReasoningFade` |
| ToolFallback | `ToolFallback`（all-in-one wrapper） |
| ToolGroup | `ToolGroup`（all-in-one wrapper） |
| ModelSelector | `ModelSelectorItem`、`ModelSelectorValue` |

其余 8 个 spec（Thread、ThreadList、AssistantModal、AssistantSidebar、Attachment、FollowUpSuggestions、MarkdownText、TooltipIconButton）的 primitives 已经齐全，未改。

**已确认**：
- `npx tsc --noEmit` 通过 — 旧 PROGRESS 中提到的 `@assistant-ui/store` `ClientSchema` vs `ClientSchemas` 类型问题在当前依赖（`@assistant-ui/store@0.2.10`）下已不复现，不再是阻塞。
- `npm run sync:anchor` 重新生成 64 个 spec catalog（`.cursorrules` / `ANCHOR_RULES.md` 同步更新）。
- `npm run anchor:audit` 通过。
- 所有 12 个 AI demo 已挂载在 portal sidebar `AI/*` 分组下，`MockRuntimeProvider` 提供假运行时供预览。

### ⏳ 阶段 4 — Token 驱动验收（未开始）
- 修改任意 token，全组件实时响应
- 暗黑切换无视觉遗漏
- `npm run anchor:audit` 全量通过
- 构建产物 / 运行时性能基线对比

---

## 当前已知问题 / 阶段 2 遗留

1. **Patterns 路由是占位符**：`docs/PatternsRoute.tsx` 仅渲染一个空白页面，等产品内容到位再补。
2. **kit-status 路径迁移**：消费者 `anchor init` 后新位置是 `.anchor-portal/kit-status.json`；schema plugin 同时兼容 `.storybook/kit-status.json` 旧路径。老消费者跑一次 `anchor upgrade` 后会迁移。
3. **`src/design-portal/`** 仍保留（SchemaEditor 独立工具，与 anchor-portal 不冲突）。如果未来不再需要，可整体删除。

---

## 关键文件 / 模块速查（阶段 2 后）

| 模块 | 路径 | 作用 |
|---|---|---|
| Portal 入口 | `src/anchor-portal/main.tsx` | React 19 createRoot |
| App shell | `src/anchor-portal/App.tsx` | `react-resizable-panels` 三区布局 |
| Story 注册表 | `src/anchor-portal/story-registry.ts` | `import.meta.glob('../components/**/*.demo.tsx')` |
| Meta 类型 | `src/anchor-portal/argTypes-types.ts` | 替代 `@storybook/react` 的类型层 |
| 路由 | `src/anchor-portal/router.ts` | hash-based `/story/...` `/_designtoken` `/_patterns` |
| Session 状态 | `src/anchor-portal/usePreviewState.tsx` | StorySessionProvider + useStorySession() |
| 暗黑切换 | `src/anchor-portal/theme/DarkModeProvider.tsx` | localStorage `anchor-dark-mode` + BroadcastChannel |
| 侧边栏树 | `src/anchor-portal/sidebar/SidebarTree.tsx` | 递归 + 选中 + kit-status 红点 |
| 顶部 + 按钮 | `src/anchor-portal/sidebar/SidebarTop.tsx` | 含 Add Component / DesignToken / 暗黑 |
| 添加组件弹窗 | `src/anchor-portal/sidebar/AddComponentDialog.tsx` | 上传 .tsx 走 `/api/upload-component` |
| 右键菜单 | `src/anchor-portal/sidebar/ContextMenu.tsx` | 删除组件走 `/api/delete-component` |
| 预览框 | `src/anchor-portal/canvas/PreviewFrame.tsx` | layout 装饰器 + 错误边界 |
| Canvas | `src/anchor-portal/canvas/Canvas.tsx` | 路由分派 + toolbar |
| Controls 主面板 | `src/anchor-portal/controls/ControlsPanel.tsx` | 两栏表格 + 分类分组（决策 3A） |
| 控件渲染器 | `src/anchor-portal/controls/controls/ControlInput.tsx` | 八种 control kind |
| argType 规范化 | `src/anchor-portal/controls/normalize.ts` | shorthand → NormalizedArgType |
| Spec 编辑器 | `src/anchor-portal/spec-editor/SpecPanel.tsx` | 旧 AnchorPanel 直接移植 |
| DesignToken 路由 | `src/anchor-portal/docs/DesignTokenRoute.tsx` | 包装 `DesignTokenPage` |
| Schema 端点 | `vite-plugin-schema-api.mjs` | dev server middleware（spec.json / tokens / kit-status / upload / delete） |
| 自动 Controls | `src/design-tokens/tw-class-audit.ts` | 扫描组件源码生成 Token Override · Bound 控件 |
| Story 兼容声明 | `src/design-tokens/story-preview-shell.tsx` | 导出 `storyAnchorCompliance` |
| 组件 spec | `src/anchor/schema/components/*.spec.json` | 64 个组件协议 |
| Token 数据 | `src/design-tokens/tokens.json` | seed / seedDark / mapOverrides / customSeeds |
| 生成产物 | `src/styles/design-tokens.generated.css`、`tailwind.anchor.generated.ts` | sync:tokens 输出，禁止手改 |
| Postinstall | `bin/postinstall.mjs` → `bin/anchor.mjs start` | 安装到消费者项目时初始化 .anchor |

---

## 下次会话 Claude 的开场动作（建议）

1. `git status` / `git log --oneline -10` 确认基线（应在 `589e097` 或更新提交）
2. 读取 `docs/PROGRESS.md`（这份文档）
3. 检查工作树是否有未提交修改 — 若有，问用户是否提交
4. 询问用户："开始阶段 3（Radix UI 对齐）？" 或 "继续完善阶段 2 的某个 portal 子模块？"
5. **阶段 3 注意事项**：
   - 按 PROGRESS.md 上的优先级分批做
   - 每批 5-10 个组件一个 commit
   - 每改完一个组件，跑 `npm run anchor:audit` + `npm run dev` 在浏览器看 demo 是否仍然渲染
   - 修改组件源后，对应的 `.spec.json` 也要同步更新 `wraps.primitives` / `styleLock.baselineTokens`，否则 `anchor-audit` 会漏报新 Radix 子组件

---

**最后更新**：阶段 3 全部完成（包含 3.7 AI 组件 spec primitives 对齐），下一步进入阶段 4 token 验收
