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
npx storybook dev -p 6006 --no-open          # 当前临时验证用
```

> Storybook 是阶段 2 要被替换掉的（见下文）。当前阶段 1 完成时仍依赖它做回归测试。

---

## 整体目标（用户原始诉求）

1. **重命名**：DesignAccord → Design-anchor，所有 `harness` / `accord` 引用清除，统一为 `anchor`
2. **去 Storybook 化**：完全复刻 Storybook 当前提供的功能（侧边栏 / Controls / Spec.json 编辑 / DesignToken 文档 / 暗黑切换 / kit-status / 添加组件），但不再依赖 `storybook` / `@storybook/*` 任何包；产品可自由演化
3. **Radix UI 全量对齐**：每个组件补齐 Radix UI 文档中的所有 sub-component 与 variant
4. **Token 驱动**：所有视觉属性（color / spacing / radius / shadow / typography / motion）必须映射 design tokens；修改 token 后所有组件自动响应；硬编码值由 `accord-audit`（已改名 `anchor-audit`）扫出
5. **零遗留错误**：全盘排查，确保产品无错误或隐藏问题

---

## 关键决策（用户已确认）

| # | 决策 | 选择 |
|---|---|---|
| 1 | 阶段 2 预览隔离方式 | **B**：同帧 + CSS scope（不用 iframe） |
| 2 | Stories 文件类型 | **B**：阶段 2 改名 `*.stories.tsx` → `*.demo.tsx` |
| 3 | Controls UI 风格 | **A**：复刻 Storybook 两列表格（Name + Control 两栏，可选 expanded 显示 Description） |

> 注意：决策 1 选了同帧，但用户后续要求各组件预览可以居中且限宽（默认 480px），并支持 stories 通过 `parameters: { layout: "fullscreen" | "centered" | "padded" }` 控制。这一行为已在 `.storybook/preview.tsx` 实现，迁移到阶段 2 portal 时需保留同样语义。

---

## 阶段进度

### ✅ 阶段 0 — 基线（commit `1cf5167`、`b3f50a4`）
- 干净 git 工作树、`.accord/` 加入 .gitignore（postinstall 产物）
- 完整代码盘点

### ✅ 阶段 1 — 全局重命名（commit `f7d8e57`）
**已完成**：
- `src/accord/` → `src/anchor/`
- `bin/{accord,accord-mcp}.mjs` → `bin/{anchor,anchor-mcp}.mjs`
- `scripts/accord-audit.mjs` → `scripts/anchor-audit.mjs`
- `scripts/lib/render-accord-rules.mjs` → `render-anchor-rules.mjs`
- `tailwind.accord.generated.ts` → `tailwind.anchor.generated.ts`
- `accord-vite.d.ts` → `anchor-vite.d.ts`
- `.cursor/{rules,hooks}/accord-*.{mdc,mjs}` → `anchor-*`
- `docs/ACCORD_*.md` → `docs/ANCHOR_*.md`
- 仓库父目录 `~/Documents/DesignAccord/` → `~/Documents/Design-anchor/`
- 157 个文件中的标识符替换：`accord` / `Accord` / `ACCORD` → `anchor` / `Anchor` / `ANCHOR`
- 包名 `design-accord` → `design-anchor`，CLI `accord` → `anchor`
- `Accordion` / `AccordionPrimitive`（Radix UI 原语）保留未改
- `tsc --noEmit` 通过，Storybook 启动正常（93 stories）

### ⏳ 阶段 2 — 去 Storybook 化（**未开始**）

**目标**：用 Vite + React 自定义 SPA 完全替代 Storybook，移除所有 storybook 依赖。

**待办子任务**（按建议执行顺序）：

1. **新建 `src/anchor-portal/`**（替代当前 `src/design-portal/` 与 `.storybook/`）
   ```
   src/anchor-portal/
   ├── index.html
   ├── main.tsx
   ├── App.tsx                # 三栏布局：sidebar / preview / controls+spec
   ├── vite.config.ts
   ├── router.ts              # 自研轻量路由（hash-based 简单）
   ├── story-registry.ts      # import.meta.glob('../components/**/*.demo.tsx', { eager: false })
   ├── sidebar/               # 移植自 .storybook/manager.tsx 的自定义树
   │   ├── SidebarTree.tsx
   │   ├── SidebarTop.tsx     # 含 DesignToken / Add Component 按钮、暗黑切换
   │   └── kit-status.ts      # 红点（manifest 驱动）
   ├── canvas/
   │   └── PreviewFrame.tsx   # 同帧 + CSS scope；尊重 layout 参数
   ├── controls/
   │   ├── ControlsPanel.tsx  # Name / Description / Control 两栏（决策 3A）
   │   ├── controls/          # select / boolean / text / number / color / object
   │   └── argTypes-types.ts  # 自定义 Meta / StoryObj 类型替代 @storybook/react
   ├── spec-editor/
   │   └── SpecPanel.tsx      # 移植自 manager.tsx 的 AccordPanel（已改名）
   ├── docs/
   │   ├── DesignTokenRoute.tsx # 直接渲染 DesignTokenPage（已是 TSX）
   │   └── PatternsRoute.tsx    # 替代 patterns.mdx
   └── theme/
       └── DarkModeProvider.tsx # localStorage 'anchor-dark-mode' + class 切换
   ```

2. **修改 `*.stories.tsx` → `*.demo.tsx`**（62 个文件）
   - `git mv` 保留历史
   - 替换 import：`import type { Meta, StoryObj } from "@storybook/react"` → `import type { Meta, StoryObj } from "@/anchor-portal/controls/argTypes-types"`
   - 自定义 Meta 类型签名要兼容现有写法（title, parameters.layout, args, argTypes, decorators, render, parameters.anchorTokenCompliance）

3. **MDX 改 TSX**
   - `src/design-tokens/DesignToken.mdx` 是个空 wrapper（仅 import DesignTokenPage），删除
   - `src/components/starter/patterns.mdx`（如有）改为纯 TSX

4. **schemaApiPlugin 复用**
   - `vite-plugin-schema-api.mjs` 已有的 `/api/schemas`、`/api/schema/:f`、`/api/save-schema`、`/api/upload-component`、`/api/delete-component`、`/api/kit-status` 端点保留，挂到 anchor-portal 的 vite dev server 即可

5. **移除依赖**
   - `package.json` 卸载：`storybook`、`@storybook/*`（addon-docs、addon-essentials、react、react-vite）
   - `package.json` `keywords` 去掉 `"storybook"`
   - `scripts.storybook` / `scripts.build-storybook` 删除，改为 `dev: "vite --config src/anchor-portal/vite.config.ts"` / `build`
   - `bin/anchor.mjs` 中关于 storybook 的命令（accord dev / start）改为启动 anchor-portal
   - 删除 `.storybook/` 整个目录
   - `package.json` `files` 列表里去掉 `.storybook/`

6. **回归测试清单**
   - [ ] 侧边栏树渲染、点击切换组件
   - [ ] DesignToken 编辑面板（含 sticky 标题 + 4 按钮）
   - [ ] Spec.json 面板按 story 变体加载、保存调用 sync:anchor
   - [ ] Add Component 上传 .tsx 走 `/api/upload-component`
   - [ ] 右键删除组件
   - [ ] 暗黑切换（标题、画布、Controls 三处一致）
   - [ ] kit-status 红点
   - [ ] 自动 Token Override · Bound controls（来自 `tw-class-audit`）
   - [ ] AI 组件（Thread / Attachment / FollowUpSuggestions / MarkdownText / AssistantSidebar / AssistantModal）能渲染（依赖 `_story-runtime.tsx`）

### ⏳ 阶段 3 — Radix UI 对齐（未开始）

每组件 1-2 小时，~80-100 小时人工。建议拆 batch、每批 5-10 个组件提交一次。优先级：高频通用（Button / Input / Select / Dialog / Popover / Tabs / Form / Checkbox / Radio）→ 数据展示（Table / DataTable / Pagination）→ 反馈（Alert / Toast / Tooltip）→ 复杂（Calendar / Carousel）→ AI 组件（最后做，因为 assistant-ui 还有依赖兼容问题）。

每组件需做：
1. 对照 https://www.radix-ui.com/primitives/docs/components/ 列出缺失的 sub-components / parts
2. 补齐 size / variant / state / orientation 等 variant
3. 所有视觉属性走 token CSS 变量；用 `npm run anchor:audit` 扫硬编码
4. 更新 `src/anchor/schema/components/<name>.spec.json`：完整 `wraps.primitives`、`styleLock.baselineTokens`、`styleLock.blacklist`、`forbidden`、`corrections`

### ⏳ 阶段 4 — Token 驱动验收（未开始）
- 修改任意 token，全组件实时响应
- 暗黑切换无视觉遗漏
- `npm run anchor:audit` 全量通过
- 构建产物 / 运行时性能基线对比

---

## 当前已知问题（阶段 1 后遗留）

1. **`@assistant-ui/store` 类型定义不完整**：`ClientSchema` 在 index.d.ts 重导出但 client.d.ts 实际名为 `ClientSchemas`（复数）。运行时不影响（仅类型层面）。但 AI 组件之前出现"Failed to fetch dynamically imported module" 错误，建议在阶段 2 顺手锁版本或升级。
2. **Storybook Canvas 模式下的 Controls 面板原生 select 全宽**：是 Storybook 默认行为，**阶段 2 自研 Controls 时按决策 3A 复刻为两栏表格但限制 control 列宽 320px 即可解决**。
3. **未提交的工作树修改**（编辑器/HMR 期产生）：
   - `.storybook/preview.tsx` — decorator 按 `parameters.layout` 分支（fullscreen / padded / centered）
   - `src/components/starter/ai/{Attachment,FollowUpSuggestions,MarkdownText}.stories.tsx` — layout 改 fullscreen
   - `src/design-tokens/DesignTokenPage.tsx` — 标题+4 按钮 sticky，描述独占一行
   - **下次新对话开始前应先 `git add -A && git commit`**，或读这份 doc 时让 Claude 处理

---

## 关键文件 / 模块速查

| 模块 | 路径 | 作用 |
|---|---|---|
| Schema 端点 | `vite-plugin-schema-api.mjs` | dev server middleware，spec.json 读写 + sync 触发 |
| 自定义侧边栏 | `.storybook/manager.tsx`（待迁出） | 1860 行，含 SidebarTree / AccordPanel(SpecPanel) / AddComponentDialog / kit-status |
| 自动 Controls | `src/design-tokens/tw-class-audit.ts` | 扫描组件源码生成 Token Override · Bound 控件 |
| Story 兼容声明 | `src/design-tokens/story-preview-shell.tsx` | 导出 `storyAnchorCompliance`（重命名后） |
| 组件 spec | `src/anchor/schema/components/*.spec.json` | 64 个组件协议 |
| Token 数据 | `src/design-tokens/tokens.json` | seed / seedDark / mapOverrides / customSeeds |
| 生成产物 | `src/styles/design-tokens.generated.css`、`tailwind.anchor.generated.ts` | sync:tokens 输出，禁止手改 |
| Postinstall | `bin/postinstall.mjs` → `bin/anchor.mjs start` | 安装到消费者项目时初始化 .anchor |

---

## 下次会话 Claude 的开场动作（建议）

1. `git status` / `git log --oneline -5` 确认基线
2. 读取 `docs/PROGRESS.md`（这份文档）
3. 检查工作树是否有未提交修改 — 若有，问用户是否提交
4. 询问用户："继续阶段 2 还是阶段 3？" 然后按这份文档列出的待办子任务执行
5. 阶段 2 是大动作，建议先按 SidebarTree / Canvas / Controls 三个组件分支独立开发，每个完成后回来集成

---

**最后更新**：阶段 1 完成 + DesignToken 标题 sticky 修复（commit f7d8e57 之后的工作树状态）
