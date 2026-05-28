<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>AI Coding 的设计系统护栏。</strong></p>

<p align="center">
  Rules 约束生码 &rarr; Hooks 自动审计 &rarr; MCP 灵活调度。
</p>

<p align="center">
  <a href="./README.md">English</a> &middot;
  <a href="#快速开始">简体中文</a>
</p>

---

## 问题

每个 AI 编码工具都能吐出"能跑的"UI。但跨 session 一拉长，输出就开始漂移：

```tsx
// 周一 —— agent A
<button className="bg-blue-500 px-4 py-2 rounded-lg">保存</button>

// 周五 —— 同一个 agent
<button className="bg-[#3b82f6] px-[15px] py-2.5 rounded-[10px]">保存</button>

// 下个 sprint —— agent B
<button className="bg-indigo-500 px-3.5 py-1.5 rounded-md">保存</button>
```

同一个意图，三套实现，三种蓝，三种圆角。乘以每个页面的每个 UI 原语——产品看起来像十个团队拼出来的。Figma 和 design.md 治不了这个，软约束到第 50 次编辑就被忘了。

## 解法

Design-anchor 把软文档换成三层硬约束，让漂移在机制上不可能：

| 层 | 做什么 | 什么时候生效 |
|---|---|---|
| **Rules** | 从 `spec.json` 生成 AI 可读契约（`.cursorrules` / `CLAUDE.md` / `copilot-instructions.md`）。AI 在写错之前就被告知「有 `<Button>` 别用 `<button>`」 | 生码之前 |
| **Hooks** | `anchor audit` AST 扫描，保存/pre-commit/CI 三处触发。`bg-[#0204a3]`、`<button>` 会被拦截；明确 px 值会先尝试映射到等值 token，再决定是否保留手写值。 | 生码之后 |
| **MCP** | 13 个工具让 agent 读 schema、改 token、跑 audit、同步规则——零拷贝 | 按需调度 |

AI 生码时，Design-anchor 的反馈应该直接出现在同一段对话里：开始 UI 任务时先出现 `Design Anchor 预检`，自动修复时明确说 `Design Anchor 自动治理`，只有需要产品判断时才提确认问题，任务结束时追加轻量自检，例如 `Design Anchor 自检：复用了 8 个 @design 组件，未发现硬编码颜色，规则已同步。`。

<a id="快速开始"></a>
## 快速开始

```bash
npm install -D design-anchor
npx design-anchor start
```

这条命令做三件事：

1. **Scaffold** `.anchor/` + `src/components/anchor-ui/` — Anchor 控制面，以及放在业务源码里的 60+ 受治理 React + Tailwind 组件
2. **Patch 项目** — 注入组件依赖、往 `globals.css` 添加 token 导入（保留你现有的样式）、生成 Cursor / Claude / Copilot 的 AI 规则文件
3. **打开 Portal** — 选择品牌预设或从 Tailwind Default 开始

选完预设后，Design-anchor 展示注入确认页，确认项目已配置完毕。可以继续浏览组件库样式，或直接关闭 Portal 开始 Coding——护栏已经生效。

## 使用组件

```ts
// tsconfig.json
{ "compilerOptions": { "paths": { "@design": ["src/components/anchor-ui"], "@design/*": ["src/components/anchor-ui/*"] } } }
```

```tsx
import { Button } from "@design";

export function CTA() {
  return <Button>保存修改</Button>;
}
```

## 工作原理

### Token 流水线

```
14 个 seed（tokens.json） → seed-to-map.mjs → 200+ CSS 变量 → @theme → className
```

把 `colorPrimary` 从 `#000` 改成 `#635BFF`，所有 `bg-primary` 立刻变。把 `borderRadius` 从 `8` 改成 `12`，所有 `rounded-md` 跟着走。跑 `anchor sync`，不需要全局替换。

| 类别 | Seeds | 驱动 |
|---|---|---|
| 品牌 | colorPrimary / Success / Warning / Error / Info | 所有语义色 |
| 表面 | colorBgBase / colorTextBase | 30+ 派生中性色、填充、边框 |
| 字号 | fontSize | `text-xs` 到 `text-3xl` |
| 圆角 | borderRadius | `rounded-sm/md/lg/xl` 梯度 |
| 间距 | sizeUnit | 完整 Tailwind `p-N` / `gap-N` 尺度 |
| 图表 | chart1 – chart5 | 图表配色（已接 Recharts） |

组件遵循比例圆角规则：内部圆角 = 外部圆角 - padding，通过 `calc(var(--radius-md) - var(--spacing-1))` 实现，最小 2px。下拉选项、Toggle 高亮、Tab 指示器在任意圆角设置下都保持视觉比例。

### AI 规则文件

从 `spec.json` 生成——单一来源，多个输出：

```
your-project/
├── CLAUDE.md                           Claude Code / Claude Desktop
├── .cursor/rules/anchor.mdc            Cursor（alwaysApply）
├── .cursor/rules/anchor-selfcheck.mdc  编辑后 checklist
├── .github/copilot-instructions.md     Copilot Chat
├── AGENTS.md                           通用 AI 契约
├── .mcp.json                           Claude Code / Cline / Zed MCP
├── .cursor/mcp.json                    Cursor MCP
└── .cursor/hooks.json                  保存后跑 audit
```

### `anchor audit`

AST 扫描，执行两类规则：

- **Forbidden 原生标签** — 有 `<Button>` 还写 `<button>` 则拒
- **Token 敏感前缀上的 arbitrary value** — `bg-[#hex]` 这类硬编码颜色拒；`p-[24px]`、`rounded-[16px]`、`text-[14px]` 这类明确数值会先映射到等值 token（如 `p-6`、`rounded-lg`、`text-sm`），没有等值 token 时才保留手写值；`w-[280px]`、`max-w-[480px]` 过（layout 一次性像素允许）

### MCP server

```jsonc
// init 时自动配置
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["design-anchor", "mcp", "."]
    }
  }
}
```

13 个工具：`list_components` · `read_component` · `create_component` · `list_tokens` · `update_token` · `list_schemas` · `read_schema` · `update_schema` · `run_audit` · `run_sync_rules` · `get_cursorrules` · `read_file` · `write_file`

## CLI

```
anchor start [dir]        Init + install + 打开 Portal
anchor init  [dir]        仅 scaffold .anchor/
anchor govern             仅注入 AI 规则（不拷贝组件）
anchor dev   [dir]        在已有 .anchor/ 上启动 Portal
anchor portal [tab] [dir] 打开指定 Portal tab：tokens/theme/theme-editor/components/specs/docs
anchor sync  [dir]        重新生成规则 + token
anchor audit [dir]        AST 扫描违规
anchor upgrade [dir]      更新模板（保留你的修改）
anchor mcp [dir]          启动 MCP server
anchor screenshot [图片]  截图驱动 token 提取
anchor theme <prompt.md>  从设计 prompt 提取 token
```

React 是 peer dependency（`>=18 <20`）。业务项目通过 `@design` 引用可见的 `src/components/anchor-ui` 源码时，`react` 和 `react-dom` 必须 dedupe 到宿主项目这一份。

## 项目结构

```
your-project/
├── src/design-tokens/                  项目 token 唯一真源
│   └── tokens.json
├── src/styles/
│   └── design-tokens.generated.css     业务应用导入的运行时 CSS
├── src/components/anchor-ui/           60+ React + Tailwind 组件
├── .anchor/                            Anchor Portal + schema + sync 控制面
│   ├── src/anchor/schema/              每个组件的 spec.json 契约
│   ├── src/anchor/component-demos/     Portal 专用组件 demo
│   ├── src/design-tokens/              派生算法 + 默认模板
│   └── package.json                    仅 Portal 工具链；运行时依赖从项目根 resolve
├── CLAUDE.md                           AI 规则（Claude）
├── .cursor/rules/anchor.mdc            AI 规则（Cursor）
├── .github/copilot-instructions.md     AI 规则（Copilot）
├── AGENTS.md                           AI 契约（通用）
├── .mcp.json + .cursor/mcp.json        MCP 配置
└── .cursor/hooks.json                  保存后审计
```

所有组件运行时依赖（React、Radix 等）安装在项目根 node_modules——不会出现 React 双实例和 Context 冲突。

## 适合谁

| 团队类型 | 为什么 |
|---|---|
| **B 端 SaaS** | Dashboard、表单、表格到处重复，用户每天在 UI 里工作，小的不一致会长期放大 |
| **企业平台** | 多个贡献者跨年维护，所有人和 AI 遵守同一套契约 |
| **AI 辅助团队** | 让 AI 放手写前端，同时不允许它把按钮发明五种写法 |
| **老项目** | 先接治理，再逐步迁移页面，不需要一次性重构 |

## 技术栈

- **React 19** + **Tailwind v4** + **Radix UI** + **shadcn/ui** 模式
- **Antd 5** 色彩算法做 token 派生
- **Vite 6**（Portal）
- **MCP** stdio JSON-RPC 对接 AI

## License

MIT.
