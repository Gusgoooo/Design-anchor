<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>给 AI 生成产品 UI 用的本地设计系统治理工具。</strong></p>

<p align="center">
  风格 prompt 生成 token。Token 驱动组件。规则约束 AI coding。
</p>

<p align="center">
  <a href="./README.md">English</a> &middot;
  <a href="#快速开始">快速开始</a> &middot;
  <a href="#核心能力">核心能力</a> &middot;
  <a href="#工作原理">工作原理</a>
</p>

---

## Design-anchor 是什么？

Design-anchor 是一套面向 AI coding 的本地设计系统控制面。它给 agent 一份明确的产品 UI 契约：应该使用哪些组件、应该引用哪些 token、应该如何同步规则，以及每次修改后如何审计。

它尤其适合 B 端和企业产品：dashboard、表单、设置页、表格和运营工作流需要长期保持清晰、克制、稳定，而不是每个 prompt 都生成一套新的视觉语言。

Design-anchor 把业务 UI 和产品控制面分开：

| 区域 | 位置 | 作用 |
|---|---|---|
| **组件** | `src/components/anchor-ui/` | 应用真实使用的 React + Tailwind 组件源码。 |
| **Design Token** | `src/design-tokens/tokens.json` | 项目颜色、圆角、字号、间距、图表色的唯一真源。 |
| **Anchor 控制面** | `.anchor/` | Portal、schema、rules、scripts、MCP、sync 和 audit。 |

业务代码从 `@design` 或 `@/components/anchor-ui` 引用组件。隐藏的 `.anchor/` 负责治理和同步，但不是运行时组件源码。

<a id="核心能力"></a>
## 核心能力

### 1. 组件优先的 AI 生码

Design-anchor 会把受治理的 UI 组件放进用户源码目录。AI agent 在写页面时会先复用这些组件，而不是手写原生标签替代品。

```tsx
import { Button } from "@design";

export function SaveAction() {
  return <Button>保存修改</Button>;
}
```

生成的 AI 规则会要求 agent 在已有项目组件时使用 `Button`、`Input`、`DataTable` 等组件，而不是原生 `<button>`、`<input>`、`<table>`。

### 2. 从风格 prompt 提取 design token

把产品风格 prompt 交给 Design-anchor：

```bash
npx design-anchor theme design-prompt.md
```

它会把可提取的设计值写入 `src/design-tokens/tokens.json`，重新生成 token CSS，保存原始 prompt，并生成一份克制的 AI 风格指导。prompt 可以影响节奏、层级、密度和氛围；组件规范和语义 token 始终是更强的约束。

### 3. Token 驱动的主题系统

Token 会编译成 CSS 变量和 Tailwind theme 值：

```
tokens.json -> seed-to-map.mjs -> CSS variables -> Tailwind semantic classes
```

业务代码使用 `bg-primary`、`text-muted-foreground`、`border-border`、`rounded-md` 这类语义 class。避免硬编码 hex、任意值颜色和 token-sensitive 的随意间距。

### 4. 面向 AI 工具的规则文件

Design-anchor 会为常见 AI coding 环境生成规则：

```
CLAUDE.md
.cursor/rules/anchor.mdc
.cursor/rules/anchor-selfcheck.mdc
.github/copilot-instructions.md
AGENTS.md
.mcp.json
.cursor/mcp.json
```

规则会让 AI 工作流显式化：

- UI 任务开始时输出 `Design Anchor 预检`。
- 优先使用 `@design` 组件和语义 token。
- 自动修复原生标签替代、硬编码颜色和不安全任意值。
- UI 任务结束时输出 `Design Anchor 自检`。

### 5. Audit、sync 与 MCP

`anchor audit` 会扫描常见设计系统违规。MCP 工具让 agent 可以读取组件、查看 token、更新 schema、运行 audit、同步规则，而不需要把文件内容来回复制。

当前 MCP 工具：

`list_components` · `read_component` · `create_component` · `list_tokens` · `update_token` · `list_schemas` · `read_schema` · `update_schema` · `run_audit` · `run_sync_rules` · `get_cursorrules` · `read_file` · `write_file`

<a id="快速开始"></a>
## 快速开始

```bash
npm install -D design-anchor
npx design-anchor start
```

这会完成以下设置：

1. 在 `src/components/anchor-ui/` 放入可见组件源码。
2. 建立 `src/design-tokens/tokens.json` 作为项目 token 真源。
3. 创建 `.anchor/` 本地控制面。
4. 为 Cursor、Claude、Copilot 和通用 agent 生成规则。
5. 配置 MCP，方便 agent 访问本地真源。
6. 打开 Portal，用于查看 token、组件、文档和治理状态。

已有项目如果只想先接治理：

```bash
npx design-anchor govern
```

之后可以逐步接入组件、token 和 audit。

## 典型工作流

### 用 AI 生成一个新页面

1. 让 AI coding 工具实现页面。
2. 规则会要求它先检查 `@design`、组件 spec 和 token。
3. AI 使用受治理组件和语义 token class。
4. 运行 `npx design-anchor audit`，或让配置好的 hooks 自动运行。
5. 任务结束时输出 `Design Anchor 自检`。

### 从产品风格 prompt 生成主题

```bash
npx design-anchor theme design-prompt.md
npx design-anchor sync
```

prompt 会转成 token 值和轻量风格指导。最终 UI 仍然使用受治理组件和语义 token class。

### 查看或调整设计系统状态

```bash
npx design-anchor portal theme
npx design-anchor portal components
npx design-anchor portal docs
```

Portal 用于查看和治理。业务运行时代码继续使用 `src/components/anchor-ui/` 中的可见组件源码。

<a id="工作原理"></a>
## 工作原理

### Token 流水线

```
14 个 seed (tokens.json) -> seed-to-map.mjs -> 200+ CSS variables -> Tailwind classes
```

| 类别 | Seeds | 驱动 |
|---|---|---|
| 品牌 | `colorPrimary`、`colorSuccess`、`colorWarning`、`colorError`、`colorInfo` | 语义色槽 |
| 表面 | `colorBgBase`、`colorTextBase` | 中性色、填充、边框 |
| 字号 | `fontSize` | 字号尺度 |
| 圆角 | `borderRadius` | 圆角梯度 |
| 间距 | `sizeUnit` | Tailwind 间距尺度 |
| 图表 | `chart1` 到 `chart5` | 图表色板 |

修改 `colorPrimary` 会影响所有 `bg-primary`。修改 `borderRadius` 会影响整套圆角尺度。组件使用比例圆角规则，让嵌套表面在不同圆角设置下仍然平衡。

### 组件契约

组件 spec 描述：

- import 路径
- props 和 variants
- 禁用的原生替代标签
- token 与样式约束
- AI 可以模仿的 examples

这些 spec 会生成 AI 规则和 audit 期望，所以生码前后的约束来自同一份契约。

### Audit 行为

`anchor audit` 会检查：

- 已有受治理组件时仍使用原生标签
- 硬编码颜色
- token-sensitive 的任意值 Tailwind
- 绕过可见组件源码的 import

明确数值会尽量映射回等值 token。固定宽度这类 layout-only 的一次性值可以保留。

## CLI

```
anchor start [dir]        初始化、安装并打开 Portal
anchor init  [dir]        仅 scaffold .anchor/
anchor govern             仅注入 AI 规则，不拷贝组件
anchor theme  <file>      从 design prompt 提取 token
anchor screenshot [img]   打印截图转 token 的工作流指导
anchor upgrade [dir]      更新模板，同时保留本地修改
anchor dev   [dir]        启动 Anchor Portal
anchor portal [tab] [dir] 打开 Portal tab：tokens/theme/components/specs/docs
anchor sync  [dir]        重新生成 rules 和 tokens
anchor audit [dir]        扫描设计系统违规
anchor mcp   [dir]        以 stdio 启动 MCP server
```

## 会写入项目哪些内容

```
your-project/
├── src/design-tokens/
│   └── tokens.json                    项目 token 真源
├── src/styles/
│   └── design-tokens.generated.css    生成的运行时 CSS
├── src/components/anchor-ui/          用户拥有的组件源码
├── .anchor/                           Portal、schema、sync、audit、MCP
│   ├── src/anchor/schema/
│   ├── src/anchor/component-demos/
│   ├── src/design-tokens/
│   └── package.json
├── CLAUDE.md
├── .cursor/rules/anchor.mdc
├── .github/copilot-instructions.md
├── AGENTS.md
├── .mcp.json
├── .cursor/mcp.json
└── .cursor/hooks.json
```

运行时依赖从项目根解析，避免 React 双实例和 context mismatch。

## 适合谁

| 团队 | 价值 |
|---|---|
| **B 端 SaaS 团队** | 让 dashboard、表单、表格、设置页在多轮 AI 修改后仍然一致。 |
| **企业平台** | 给多个贡献者和多个 agent 一份本地 UI 契约。 |
| **AI 辅助产品团队** | 让 AI 快速写 UI，同时不发明新的组件和 token。 |
| **已有产品** | 先接治理，再逐步迁移页面和 token。 |

## 技术栈

- React 19
- Tailwind CSS v4
- Radix UI 与 shadcn/ui 模式
- Ant Design 色彩算法做 token 派生
- Vite Portal
- MCP stdio JSON-RPC

## License

MIT.
