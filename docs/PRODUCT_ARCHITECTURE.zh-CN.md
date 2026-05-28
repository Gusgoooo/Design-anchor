# Design-anchor 产品架构

Design-anchor 是一套 repo-native 的本地治理系统，用于 AI 辅助前端开发。它为 React + Tailwind 产品提供一条设计系统治理闭环：tokens、components、specs、AI 规则文件、MCP 工具、Portal 可视化维护和可执行 audit。

产品定位和落地话术见：[产品采用指南](./PRODUCT_ADOPTION_GUIDE.zh-CN.md)。英文架构文档见：[PRODUCT_ARCHITECTURE.md](./PRODUCT_ARCHITECTURE.md)。

## 1. 架构一句话

Design-anchor 把产品 UI 语言变成可版本化的本地资产，并同时暴露给人和 AI agent。

```
Token seeds
  -> 派生 CSS 变量
  -> 组件实现
  -> 组件 spec 契约
  -> AI 规则文件
  -> MCP 工具
  -> anchor audit
  -> CI 反馈
```

系统刻意选择 repo-local。设计系统与业务应用放在同一个仓库边界内，因此变更可以被 Git review，可以被本地 AI 工具读取，也可以被同一条 CI 管线执行检查。

## 2. 为什么采用这套架构

AI 编码工具可以很快生成 UI，但长期产品需要的不只是生成速度：

- 设计意图要跨越多次 session 和多位贡献者。
- Tokens 要能低成本变更，而不是逐屏修改。
- 组件要携带机器可读的使用契约。
- AI 工具要读取和工程师相同的真源。
- 违规要能被代码检查抓到，而不是只靠 review comment。

这对 B 端和企业产品尤其重要，因为表单、表格、dashboard、弹窗、设置页这些重复场景会让不一致变得非常显眼。

## 3. 角色与入口

| 角色 | 主要诉求 | Design-anchor 入口 |
|---|---|---|
| 产品设计师 | 调主题、看组件、保护产品语言 | Portal 的 Design Token 和 Components 视图 |
| 前端工程师 | 引用受管组件，减少 PR 里的 UI 返工 | `@design`、`anchor sync`、`anchor audit` |
| 设计系统负责人 | 维护 tokens、specs 和采用规则 | `src/design-tokens`、`.anchor/src/anchor/schema`、Portal |
| AI agent | 发现组件、读取规则、更新 tokens、自检 | 生成规则文件和 MCP tools |
| 工程负责人 | 让治理可见并进入 CI | Govern 视图、audit profiles、CI 集成 |

## 4. 运行时与仓库布局

在消费项目中，Design-anchor 会创建本地 `.anchor/` 控制面、可见组件源码目录和根目录治理文件。

```
your-project/
├── app or src/                         业务应用代码
├── src/components/anchor-ui/            React + Tailwind 组件实现真源
├── src/design-tokens/                   项目 token 真源
├── src/styles/                          生成的 token CSS
├── .anchor/                             Anchor 控制面
│   ├── src/anchor/schema/components/    每个组件的 *.spec.json
│   ├── src/anchor/component-demos/      Portal 专用组件预览
│   ├── src/design-tokens/               seed-to-map 管线与默认模板
│   ├── src/anchor-portal/               Vite Portal UI
│   └── scripts/                         sync、token、audit 辅助脚本
├── .cursor/rules/anchor.mdc             Cursor 项目规则
├── .cursor/rules/anchor-selfcheck.mdc   Cursor 编辑后检查清单
├── .github/copilot-instructions.md      Copilot Chat 指令
├── CLAUDE.md                            Claude Code 指令
├── AGENTS.md                            通用 AI 编码契约
├── .mcp.json                            MCP 客户端配置
└── ANCHOR_INTEGRATION.md                import 与接入指南
```

在 Design-anchor 产品仓库自身，同一套源代码位于 `src/` 下，并被打包成 `npx design-anchor start` 消费的 npm 模板。

## 5. 核心模块

| 模块 | 路径 | 职责 |
|---|---|---|
| CLI | `bin/anchor.mjs` | `start`、`init`、`dev`、`sync`、`audit`、`upgrade`、`mcp`、onboarding 编排 |
| MCP server | `bin/anchor-mcp.mjs` | 通过 stdio JSON-RPC 暴露 schema、tokens、files、audit、sync |
| Portal shell | `src/anchor-portal/` | Vite React app，承载 Docs、Design Token、Components、Onboarding、Govern |
| 组件源 | 消费项目 `src/components/anchor-ui/`；产品仓库模板源为 `src/components/base/` | 通过 `@design` 导出的 React + Tailwind 受管组件 |
| 组件 specs | 消费项目 `.anchor/src/anchor/schema/components/*.spec.json`；产品仓库模板源为 `src/anchor/schema/components/*.spec.json` | 用法、forbidden tags、primitives、AI hints 的机器契约 |
| Token 真源 | 消费项目 `src/design-tokens/tokens.json`；产品仓库模板源为 `src/design-tokens/tokens.json` | seed、暗色覆盖、自定义 seed、派生 token 覆盖 |
| Token 编译器 | `src/design-tokens/seed-to-map.mjs` | 把紧凑 seed 转成 200+ 语义 CSS 变量 |
| Sync 管线 | `scripts/sync-from-schema.mjs`、`scripts/emit-design-tokens-css.mjs` | 重新生成规则、CSS 变量和 Tailwind 扩展 |
| Audit | `scripts/anchor-audit.mjs` | AST 检查 forbidden tags 和 token-sensitive arbitrary Tailwind |
| 一致性检查 | `scripts/check-anchor-consistency.mjs` | 校验 schema、MCP、生成契约的一致性 |
| Dev API | `vite-plugin-schema-api.mjs` | Portal HTTP endpoints：schemas、tokens、导入/删除、audit status |

## 6. 数据流

### 6.1 Token 流

```
tokens.json
  -> seed-to-map.mjs
  -> design-tokens.generated.css
  -> Tailwind v4 @theme variables
  -> src/components/anchor-ui className utilities
  -> Portal live preview 和业务 UI
```

关键设计是紧凑的 seed surface。团队编辑少量可理解的值，系统派生出完整的语义 token map，覆盖组件、图表、surface、文字、边框和状态。

### 6.2 组件 Spec 流

```
*.spec.json
  -> Portal spec editor
  -> sync-from-schema.mjs
  -> ANCHOR_RULES.md / Cursor / Claude / Copilot / AGENTS.md
  -> anchor audit
  -> AI self-check 和 CI 反馈
```

Specs 是机器可读的契约。一份真源同时服务人类文档、AI 指令和可执行检查。

### 6.3 AI 工具流

```
AI agent
  -> 读取生成规则
  -> 可用时调用 MCP tools
  -> 编辑 app 或设计系统文件
  -> 运行 run_audit / run_sync_rules
  -> 接收诊断
  -> 返回前自我修正
```

系统默认 prompt 本身不够可靠。因此 AI 同时获得静态规则和可调用工具。

### 6.4 治理流

```
开发者或 AI 修改代码
  -> anchor audit
  -> file/line 诊断
  -> Govern 视图和终端输出
  -> pre-commit 或 CI enforcement
```

这让 UI 漂移更早可见，并在 merge 之前可阻断。

## 7. Portal 架构

Portal 是一个 Vite React 应用，不再依赖 Storybook runtime。它围绕产品治理设计：

- **Docs**：双语使用和接入文档。
- **Design Token**：可视化 token editor，支持 live preview 和 Save & Sync。
- **Components**：读取 `src/components/anchor-ui` 的真实组件，配合 `.anchor/src/anchor/component-demos` 做预览、controls、spec 编辑。
- **Onboarding**：默认 kit、导入现有组件到 `src/components/anchor-ui`、空白起步。
- **Govern**：audit 状态、scope 标签、issue 列表和规则健康度。

路由采用 lazy-loading，避免较重的工作台页面增加首屏负担。

## 8. CLI 架构

CLI 是用户的操作入口。

| 命令 | 作用 |
|---|---|
| `anchor start` | 一键 init、安装项目依赖、安装 Portal 工具链并启动 Portal |
| `anchor init` | scaffold `.anchor/` 控制面、`src/components/anchor-ui/` 组件源码和治理文件 |
| `anchor govern` | 给已有项目添加规则和治理，不强制接入完整组件工作区 |
| `anchor dev` | 为已有 workspace 启动 Portal |
| `anchor sync` | 重新生成 tokens、AI rules 和契约文件 |
| `anchor audit` | 运行 AST 治理检查 |
| `anchor upgrade` | 拉取最新模板，同时保留本地组件修改、tokens、specs 等产品资产 |
| `anchor mcp` | 为 AI 客户端启动 MCP server |
| `anchor screenshot` | 打印 screenshot-to-token 工作流 prompt |
| `anchor theme` | 从 markdown design prompt 提取 tokens |

## 9. MCP 架构

MCP server 给 agent 提供结构化访问本地真源的能力。当前工具类别包括：

- 组件发现与读取（默认读取 `src/components/anchor-ui`）。
- 组件创建（写入 `src/components/anchor-ui`，预览 demo 写入 `.anchor/src/anchor/component-demos`）。
- Token 列表与更新。
- Schema 列表、读取、更新。
- Audit 和 sync 执行。
- 生成规则读取。
- 在设计系统边界内安全读写文件。

这样 AI agent 不再依赖过期的聊天上下文，而是查询和修改受控系统。

## 10. Audit 架构

`anchor audit` 是 AST-based 治理检查器，支持 app、kit、portal、all 等 scope。

它优先检查两类高价值问题：

1. **来自 specs 的 forbidden native tags**，例如已经有受管 `Button` 时仍然写 raw `<button>`。
2. **token-sensitive 前缀上的 arbitrary Tailwind values**，例如颜色、间距、圆角、ring、shadow、border 等 class。

Audit 会刻意放过许多 layout-specific arbitrary values，例如宽高和定位。产品目标不是禁止所有像素值，而是阻止应该使用 token 的视觉语言漂移。

## 11. 设计原则

1. **Local first**：治理应该发生在代码被编写的仓库里。
2. **Single source of truth**：specs 和 tokens 应该生成 rules、docs 和 checks。
3. **AI-readable by default**：每个契约都应该以 AI 工具能使用的格式暴露。
4. **Executable over advisory**：文档重要，但 CI 检查才能闭环。
5. **Incremental adoption**：已有 B 端产品需要迁移路径，而不是全量重写。
6. **Design-system boundaries**：app 代码、组件代码、token 代码和生成治理文件必须边界清楚。

## 12. 已知边界

- AI 工具仍然会犯错。Design-anchor 通过上下文和检查降低漂移，但不会让模型行为数学意义上完美。
- Audit 当前优先覆盖高价值违规。未来可以继续增强复杂 `cn()` 表达式、inline styles 和依赖感知导入检查。
- 本地 `.anchor/` 是 Anchor 控制面；真实组件源码在 `src/components/anchor-ui/`。两者都应该可版本化、可 review，而不是隐藏在远程服务里。
- 中心化企业设计系统平台可以和 Design-anchor 共存。中心平台负责跨 repo 目录和资产聚合，Design-anchor 负责 repo-local 落地执行。
