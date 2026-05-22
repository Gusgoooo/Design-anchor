/**
 * Docs page sections — bilingual (en / zh).
 *
 * Translation guideline: technical terms stay in English (token, MCP,
 * Tailwind, Vite, CSS variable, seed, derived, spec.json, Cursor,
 * Claude Code, Portal, Customizer, etc.). Connective text is in
 * natural conversational Chinese, not a literal word-by-word render.
 */

import type { Bilingual } from "../i18n/LocaleProvider";

export type DocsSection = {
  id: string;
  title: Bilingual;
  description?: Bilingual;
  markdown: Bilingual;
};

export const SECTIONS: DocsSection[] = [
  /* ============================ Introduction ========================== */
  {
    id: "introduction",
    title: { en: "Introduction", zh: "介绍" },
    description: {
      en: "What Design-anchor is and why it exists.",
      zh: "Design-anchor 是什么，为什么需要它。",
    },
    markdown: {
      en: `
## What is Design-anchor?

Design-anchor is a **token-driven design system + AI governance pipeline** that makes it structurally hard for AI coding tools to drift away from your design language.

Drop it into any React + Tailwind project with one command. You get:

- A complete component library (60+ shadcn-aligned base components)
- A live visual **token customizer** (color / radius / spacing / font seeds → derives 100+ semantic tokens)
- A **spec.json contract** per component (what props, what's forbidden, what tokens are baseline)
- Generated AI rules consumed by Cursor / Claude Code / Copilot / Qoder
- An **MCP server** that exposes the schema and audit tooling to any MCP-aware agent

## The problem

AI coding tools generate beautiful UI in isolation, but lose context across conversations:

- Same button rendered with 3 different border radii across 3 pages
- The same grey is \`gray-100\` here, \`#e5e7eb\` there, \`gray-200\` in a third place
- Spacing drifts from \`p-4\` to \`p-[15px]\` to \`py-3.5\`

After a few weeks of AI-assisted work, an enterprise product starts to look like it was built by 10 different teams. Adding a Figma library or design.md prompt doesn't fix it — soft constraints get forgotten on the 50th edit.

## How Design-anchor fixes it

Design seeds → derived tokens → component className → AST audit. Every node in the chain is **enforced**, not "documented":

1. You set ~14 seed tokens (colorPrimary, fontSize, borderRadius, sizeUnit, …)
2. The seed-to-map algorithm derives 200+ CSS variables (semantic colors, spacing scale, font scale)
3. Components reference tokens (\`bg-primary\` → \`var(--primary)\`); changing the seed re-skins everything live
4. \`spec.json\` per component declares what's allowed (forbidden tags, baseline classes, blacklist patterns)
5. \`anchor audit\` AST-scans business code for violations
6. AI tools read \`.cursorrules\` / \`CLAUDE.md\` / MCP responses and self-correct
`,
      zh: `
## Design-anchor 是什么

Design-anchor 是一套 **以 token 驱动的设计系统 + AI 治理管线**，让 AI 编码工具在结构上没法偏离你的设计语言。

任何 React + Tailwind 项目，一行命令就能接入。你会拿到：

- 一套完整的组件库（60+ 个对齐 shadcn 的 base 组件）
- 一个实时可视化的 **token customizer**（color / radius / spacing / font 等 seed → 自动派生 100+ 语义 token）
- 每个组件配套一份 **spec.json 契约**（声明 props、禁止用法、baseline token）
- 一组自动生成的 AI 规则文件，供 Cursor / Claude Code / Copilot / Qoder 等工具直接读取
- 一个 **MCP server**，把 schema 和 audit 工具暴露给任何支持 MCP 的 agent

## 要解决的问题

AI 编码工具单次生成 UI 时表现很好，但跨对话就丢失上下文：

- 同一个按钮在 3 个页面里出现 3 种圆角
- 同一个灰色，这里是 \`gray-100\`、那里是 \`#e5e7eb\`、再换个地方又是 \`gray-200\`
- 间距从 \`p-4\` 漂到 \`p-[15px]\` 再漂到 \`py-3.5\`

几周之后，一个企业级产品看上去像 10 个团队拼凑出来的。靠 Figma library 或者 design.md 这种 soft constraints 解决不了 —— AI 在第 50 次编辑时早就忘了。

## Design-anchor 怎么解决

设计 seed → 派生 token → 组件 className → AST audit。整条链路**强制**，不是"文档"：

1. 你设定 ~14 个 seed token（colorPrimary、fontSize、borderRadius、sizeUnit 等）
2. seed-to-map 算法派生出 200+ CSS 变量（语义色、间距尺度、字体尺度）
3. 组件直接引用 token（\`bg-primary\` → \`var(--primary)\`）；改 seed 整个 UI 实时换肤
4. 每个组件的 \`spec.json\` 声明允许哪些用法（forbidden tags、baseline classes、blacklist 模式）
5. \`anchor audit\` 在 AST 层扫描业务代码找违规
6. AI 工具读 \`.cursorrules\` / \`CLAUDE.md\` / MCP 响应来自我纠偏
`,
    },
  },

  /* ============================ Quickstart ============================ */
  {
    id: "quickstart",
    title: { en: "Quickstart", zh: "快速上手" },
    description: {
      en: "Zero to running portal in one command.",
      zh: "一条命令从零到 Portal 运行。",
    },
    markdown: {
      en: `
## One command

In any project directory:

\`\`\`bash
npx design-anchor start
\`\`\`

This is the all-in-one. It will:

1. **\`init\`** — install the \`.anchor/\` subtree (a complete component library sub-project)
2. **\`install\`** — \`npm install\` inside \`.anchor/\` so the portal can run
3. **\`dev\`** — start the Portal at <http://localhost:6006>

Open the printed URL in your browser.

## What gets created in your project

\`\`\`
your-project/
├── .anchor/                    ← Design-anchor subtree (gitignored or vendored)
│   ├── src/components/base/   60+ ready-to-use React + Tailwind components
│   ├── src/anchor/schema/     per-component spec.json contracts
│   ├── src/design-tokens/     tokens.json + seed-to-map algorithm
│   └── package.json           own deps (Vite + React + Radix + …)
├── .cursorrules                AI-readable design contract (auto-regenerated)
├── .cursor/rules/anchor.mdc    Cursor-specific rule file
├── CLAUDE.md                   Claude Code project instructions
└── ANCHOR_INTEGRATION.md       one-page consumer guide
\`\`\`

## First interactions

In the Portal (top nav):

- **Docs** — you're reading them.
- **Design Token** — the visual customizer. Edit a seed on the left, watch the right preview update live. Hit **Save & Sync** to write to disk and regenerate \`.cursorrules\`.
- **Components** — browse the 60+ base components. Pick one to see its preview + controls.

## Importing components into your app

Add a TypeScript path alias \`@design\` → \`.anchor/src\` so imports stay short:

\`\`\`ts
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
\`\`\`

Then in your business code:

\`\`\`tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
\`\`\`
`,
      zh: `
## 一条命令

任意项目目录下执行：

\`\`\`bash
npx design-anchor start
\`\`\`

这是 all-in-one 命令，会自动：

1. **\`init\`** —— 在项目里铺一个 \`.anchor/\` 子目录（一个完整的组件库子项目）
2. **\`install\`** —— 在 \`.anchor/\` 里跑 \`npm install\`，让 Portal 跑得起来
3. **\`dev\`** —— 在 <http://localhost:6006> 启动 Portal

打开命令行里打印的 URL 就行。

## 这条命令在你项目里创建了什么

\`\`\`
your-project/
├── .anchor/                    ← Design-anchor 子目录（可 gitignore 也可 vendor）
│   ├── src/components/base/   60+ 个开箱即用的 React + Tailwind 组件
│   ├── src/anchor/schema/     每个组件的 spec.json 契约
│   ├── src/design-tokens/     tokens.json + seed-to-map 算法
│   └── package.json           独立 deps（Vite + React + Radix 等）
├── .cursorrules                给 AI 读的设计契约（自动重新生成）
├── .cursor/rules/anchor.mdc    Cursor 专属 rule 文件
├── CLAUDE.md                   Claude Code 项目指令
└── ANCHOR_INTEGRATION.md       一页纸接入指南
\`\`\`

## 进 Portal 之后干啥

顶部导航三块：

- **Docs** —— 就是你正在读的这个
- **Design Token** —— 可视化 customizer。左侧改 seed，右侧实时预览。**Save & Sync** 一下，落盘 + 重新生成 \`.cursorrules\`
- **Components** —— 浏览 60+ 个 base 组件，点任一个进去看 preview 和 controls

## 在你自己的应用里用组件

加一个 TypeScript path alias \`@design\` → \`.anchor/src\`，import 路径短一些：

\`\`\`ts
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
\`\`\`

然后业务代码里直接：

\`\`\`tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
\`\`\`
`,
    },
  },

  /* ============================ Token System ========================== */
  {
    id: "token-system",
    title: { en: "Token System", zh: "Token 体系" },
    description: {
      en: "Seeds → derived → CSS variables → components.",
      zh: "Seed → 派生 → CSS 变量 → 组件。",
    },
    markdown: {
      en: `
## The four layers

1. **Seeds** (\`.anchor/src/design-tokens/tokens.json\`) — ~14 user-editable knobs
2. **Derived map** — 200+ CSS variables computed by \`seed-to-map.mjs\` (Antd algorithm + custom mappings)
3. **\`@theme inline\`** block — wires the derived vars into Tailwind v4 utilities (\`bg-primary\` → \`var(--primary)\`)
4. **Component className** — uses the Tailwind utilities

Editing any seed re-runs the chain and re-skins the entire UI instantly.

## The seed set

| Category | Seeds | What it drives |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info / Link | All semantic color slots + every component using \`bg-primary\` etc. |
| Surface | colorBgBase / colorTextBase | Light/dark anchors → 30+ derived neutrals (ink ladder, fills, borders) |
| Typography | fontSize | Drives \`text-xs\` through \`text-3xl\` font-size scale |
| Shape | borderRadius | Drives \`rounded-sm/md/lg/xl\` ladder |
| Spacing | sizeUnit (4px default) | Drives the full Tailwind \`p-N\` / \`gap-N\` / etc. scale |
| Charts | chart1 – chart5 (in \`customSeeds\`) | Chart palette for Recharts |

## Dark mode

The customizer toggle in the top nav flips between editing \`seed\` (light) and \`seedDark\` (dark overrides). Only the values you change get written to \`seedDark\` — everything else inherits from light.

## Per-slot overrides

Any individual derived token (e.g. \`muted\`, \`accent\`, \`border\`) can be overridden without changing the parent seed. In the customizer's **Surfaces > Derived** subgroup, click a row to open the editor and enter a custom value. The override lands in \`mapOverrides.light\` or \`mapOverrides.dark\` in \`tokens.json\`.

## Save & Sync

The "Save & Sync" button in the customizer:

1. POSTs the edited \`tokens.json\` to the dev server's \`/api/save-design-tokens\` endpoint
2. The plugin writes to disk and runs \`npm run sync:tokens\`
3. \`design-tokens.generated.css\` is rewritten
4. Vite HMR picks up the change → entire UI re-skins in ~200ms
`,
      zh: `
## 四层结构

1. **Seeds**（\`.anchor/src/design-tokens/tokens.json\`）—— ~14 个用户可调旋钮
2. **派生 map** —— \`seed-to-map.mjs\` 算出来的 200+ 个 CSS 变量（Antd 算法 + 自定义映射）
3. **\`@theme inline\`** 块 —— 把派生 var 接到 Tailwind v4 utilities 上（\`bg-primary\` → \`var(--primary)\`）
4. **组件 className** —— 用 Tailwind utilities

改任何一个 seed，整条链路重跑，整个 UI 实时换肤。

## Seed 清单

| 类别 | Seeds | 驱动什么 |
|---|---|---|
| 品牌色 | colorPrimary / Success / Warning / Error / Info / Link | 所有语义色 slot + 任何用 \`bg-primary\` 的组件 |
| Surface | colorBgBase / colorTextBase | 明暗两个锚点 → 30+ 派生中性色（墨色梯度、填充、边框） |
| Typography | fontSize | 驱动 \`text-xs\` 到 \`text-3xl\` 整个字号梯度 |
| Shape | borderRadius | 驱动 \`rounded-sm/md/lg/xl\` 圆角梯度 |
| Spacing | sizeUnit（默认 4px） | 驱动整个 Tailwind \`p-N\` / \`gap-N\` 等 spacing scale |
| Charts | chart1 – chart5（在 \`customSeeds\` 里） | Recharts 图表配色 |

## 暗色模式

顶部导航的暗色切换会切 customizer 在编辑的分支：亮色编辑 \`seed\`，暗色编辑 \`seedDark\`。只有你改过的值写到 \`seedDark\`，其余从 light 继承。

## 单 slot 覆盖

任何一个派生 token（比如 \`muted\` / \`accent\` / \`border\`）都可以单独覆盖，不需要动 parent seed。Customizer 里 **Surfaces > Derived** 子组下，点任一行打开编辑器、填新值即可。覆盖会落到 \`tokens.json\` 的 \`mapOverrides.light\` 或 \`mapOverrides.dark\`。

## Save & Sync

Customizer 里 "Save & Sync" 按钮做的事：

1. 把编辑后的 \`tokens.json\` POST 到 dev server 的 \`/api/save-design-tokens\` 端点
2. plugin 落盘并跑 \`npm run sync:tokens\`
3. \`design-tokens.generated.css\` 重写
4. Vite HMR 捕获变更 → 整个 UI 大约 200ms 完成换肤
`,
    },
  },

  /* ============================ CLI ================================== */
  {
    id: "cli",
    title: { en: "CLI Reference", zh: "CLI 命令" },
    description: {
      en: "Every `anchor` command.",
      zh: "每个 `anchor` 命令的用法。",
    },
    markdown: {
      en: `
## Commands

\`\`\`bash
npx design-anchor <command> [args]
\`\`\`

| Command | Behaviour |
|---|---|
| \`start [dir]\` | One-click. Init + npm install + open Portal. The most common entry. |
| \`init [dir]\` | Scaffold \`.anchor/\` only (no install, no dev). Use when integrating into CI. |
| \`dev [dir]\` | Start the Portal against an existing \`.anchor/\`. |
| \`sync [dir]\` | Re-run schema + tokens sync. Regenerates \`.cursorrules\` / Tailwind / rules. Useful after manually editing \`tokens.json\` or a \`spec.json\`. |
| \`audit [dir]\` | AST-scan business code for forbidden tags + arbitrary-value Tailwind on token-sensitive prefixes. |
| \`upgrade [dir]\` | Pull the latest \`.anchor/\` template (preserves your tokens / custom components). |
| \`mcp [dir]\` | Start the MCP server on stdio. See [MCP Server](#mcp-server). |
| \`add <Component>\` | Import a new component into \`.anchor/src/components/base/\` and scaffold its spec + demo. |

## Common flows

### Customize tokens via terminal

\`\`\`bash
$EDITOR .anchor/src/design-tokens/tokens.json
npx design-anchor sync
\`\`\`

### Audit before commit

\`\`\`bash
npx design-anchor audit
\`\`\`

Add to a pre-commit hook via husky / lefthook so AI-generated drift fails CI.

### Re-init after pulling template updates

\`\`\`bash
npx design-anchor upgrade
\`\`\`

## Environment

The CLI looks for \`.anchor/\` in the current working directory by default. Pass a path as the last argument to point elsewhere:

\`\`\`bash
npx design-anchor dev ./apps/web
\`\`\`

The Portal starts on port 6006 by default. If the port is taken, it tries 6007, 6008, etc.
`,
      zh: `
## 命令

\`\`\`bash
npx design-anchor <command> [args]
\`\`\`

| 命令 | 行为 |
|---|---|
| \`start [dir]\` | 一键。init + npm install + 启动 Portal。最常用的入口。 |
| \`init [dir]\` | 仅 scaffold \`.anchor/\`（不 install 也不 dev）。CI 集成场景用。 |
| \`dev [dir]\` | 在已有 \`.anchor/\` 上启动 Portal。 |
| \`sync [dir]\` | 重跑 schema + tokens 同步。重新生成 \`.cursorrules\` / Tailwind / rules。手动改过 \`tokens.json\` 或 \`spec.json\` 后用。 |
| \`audit [dir]\` | AST 层扫业务代码，检查 forbidden tags + 在 token 敏感前缀上的 arbitrary-value Tailwind。 |
| \`upgrade [dir]\` | 拉最新的 \`.anchor/\` 模板（保留你的 tokens 和自定义组件）。 |
| \`mcp [dir]\` | 在 stdio 上启动 MCP server。详见 [MCP Server](#mcp-server)。 |
| \`add <Component>\` | 把新组件导入 \`.anchor/src/components/base/\`，附带 scaffold spec 和 demo。 |

## 常用流程

### 终端改 token

\`\`\`bash
$EDITOR .anchor/src/design-tokens/tokens.json
npx design-anchor sync
\`\`\`

### 提交前 audit

\`\`\`bash
npx design-anchor audit
\`\`\`

通过 husky / lefthook 挂到 pre-commit hook 里，让 AI 漂移在 CI 阶段就 fail。

### 模板更新后重新 init

\`\`\`bash
npx design-anchor upgrade
\`\`\`

## 环境

CLI 默认在当前目录找 \`.anchor/\`。要指向别处，把路径作为最后一个参数：

\`\`\`bash
npx design-anchor dev ./apps/web
\`\`\`

Portal 默认 6006 端口。占用了就自动顺延 6007、6008 等。
`,
    },
  },

  /* ============================ MCP Server ============================ */
  {
    id: "mcp-server",
    title: { en: "MCP Server", zh: "MCP Server" },
    description: {
      en: "Expose schema + audit + tokens to MCP-aware agents.",
      zh: "把 schema + audit + tokens 暴露给支持 MCP 的 agent。",
    },
    markdown: {
      en: `
## What it does

MCP (Model Context Protocol) lets AI agents call structured tools. The Design-anchor MCP server exposes your schema, tokens, and audit pipeline as 13 tools, so agents can:

- List / read / create components programmatically
- Read and update individual tokens
- Read and update \`spec.json\` files
- Run audit and sync from inside a chat

## Tools exposed

| Tool | Purpose |
|---|---|
| \`list_components\` | Enumerate every component in the library |
| \`read_component <name>\` | Get the TSX source of one component |
| \`create_component <name> <code>\` | Add a new component + scaffold a demo |
| \`list_tokens\` | List all design tokens (id, light, dark, category) |
| \`update_token <id> <field> <value>\` | Change a single token value |
| \`list_schemas\` | List every \`spec.json\` filename |
| \`read_schema <name>\` | Read one spec |
| \`update_schema <name> <json>\` | Overwrite a spec (validated) |
| \`run_audit\` | Run \`anchor audit\` and return diagnostics |
| \`run_sync_rules\` | Run \`sync:anchor\` and return success/error |
| \`get_cursorrules\` | Return the generated \`.cursorrules\` text |
| \`read_file <relPath>\` | Read any file inside \`.anchor/\` |
| \`write_file <relPath> <content>\` | Write a file inside \`.anchor/\` |

## Wire it into Cursor

Add to \`.cursor/mcp.json\` at your project root:

\`\`\`json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
\`\`\`

Restart Cursor. The tools show up in the chat tool palette.

## Wire it into Claude Code

In your project, add to \`.mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
\`\`\`

Or globally: \`claude mcp add design-anchor npx design-anchor mcp .\`

## Wire it into other MCP clients

The server speaks the standard MCP stdio JSON-RPC. Any client (Continue, Cline, Zed, Qoder) that supports MCP config can point at \`npx design-anchor mcp .\` the same way.

## Verify it's running

\`\`\`bash
# In one terminal — start the server in stdio mode
npx design-anchor mcp .
\`\`\`

It blocks on stdin waiting for JSON-RPC messages. From an agent, the first thing you'll see is a \`tools/list\` response with the 13 tools above.
`,
      zh: `
## 它干啥

MCP（Model Context Protocol）让 AI agent 能调用结构化工具。Design-anchor 的 MCP server 把 schema、tokens、audit 管线打包成 13 个工具暴露出去，agent 就能：

- 用程序方式列出 / 读 / 创建组件
- 读和改单个 token
- 读和改 \`spec.json\` 文件
- 在对话里直接跑 audit 和 sync

## 暴露的工具

| 工具 | 用途 |
|---|---|
| \`list_components\` | 列出库里所有组件 |
| \`read_component <name>\` | 获取某个组件的 TSX 源码 |
| \`create_component <name> <code>\` | 添加新组件 + scaffold 一个 demo |
| \`list_tokens\` | 列出所有 design token（id、light、dark、category） |
| \`update_token <id> <field> <value>\` | 改单个 token 值 |
| \`list_schemas\` | 列出所有 \`spec.json\` 文件名 |
| \`read_schema <name>\` | 读一个 spec |
| \`update_schema <name> <json>\` | 覆写一个 spec（带校验） |
| \`run_audit\` | 跑 \`anchor audit\` 并返回诊断 |
| \`run_sync_rules\` | 跑 \`sync:anchor\` 并返回结果 |
| \`get_cursorrules\` | 返回生成好的 \`.cursorrules\` 文本 |
| \`read_file <relPath>\` | 读 \`.anchor/\` 里任意文件 |
| \`write_file <relPath> <content>\` | 写 \`.anchor/\` 里任意文件 |

## 接入 Cursor

项目根目录的 \`.cursor/mcp.json\` 里加：

\`\`\`json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
\`\`\`

重启 Cursor，工具会出现在 chat 的 tool palette 里。

## 接入 Claude Code

项目里加 \`.mcp.json\`：

\`\`\`json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
\`\`\`

或者全局加：\`claude mcp add design-anchor npx design-anchor mcp .\`

## 接入其它 MCP 客户端

Server 走标准 MCP stdio JSON-RPC。任何支持 MCP 配置的客户端（Continue、Cline、Zed、Qoder）按同样套路指向 \`npx design-anchor mcp .\` 就行。

## 验证 server 在跑

\`\`\`bash
# 一个 terminal 里以 stdio 模式启动
npx design-anchor mcp .
\`\`\`

它会阻塞在 stdin 等 JSON-RPC 消息。Agent 接进来第一件事就是收到 \`tools/list\` 响应，里面就是上面那 13 个工具。
`,
    },
  },

  /* ============================ Auditing ============================== */
  {
    id: "auditing",
    title: { en: "Auditing & Governance", zh: "Audit 与治理" },
    description: {
      en: "What `anchor audit` checks and what it ignores.",
      zh: "`anchor audit` 检查什么、放过什么。",
    },
    markdown: {
      en: `
## What gets flagged

\`anchor audit\` AST-walks every \`.tsx\` file in your business code (skipping \`.anchor/\`, demos, fixtures) and flags two classes of issues:

### 1. Forbidden native tags

If a component \`spec.json\` declares e.g. \`<button>\` as forbidden, every use of raw \`<button>\` outside the library is an error.

\`\`\`json
"forbidden": [
  {
    "htmlTag": "button",
    "reason": "Raw <button> bypasses variant + size contract",
    "useInstead": "@design Button"
  }
]
\`\`\`

### 2. Arbitrary-value Tailwind on token-sensitive prefixes

The audit differentiates **critical** prefixes from **layout** prefixes:

**Flag (must be token or var(--…))**:
- Colors: \`bg / text / border / ring / fill / stroke / from / to / via / outline / accent / caret / decoration / divide / placeholder / shadow\`
- Spacing: \`p / px / py / pt / pb / pl / pr / m / mx / my / mt / mb / ml / mr / gap / gap-x / gap-y / space-x / space-y\`
- Radius: \`rounded / rounded-{side}\`

**Allow (one-off layout/positioning is fine)**:
- \`w / h / min-w / max-w / min-h / max-h\` (component sizing)
- \`top / right / bottom / left / inset\` (positioning)
- \`translate-x / translate-y\` (transforms)
- \`grid-cols / grid-rows / col-span / row-span\` (grid)
- \`aspect / z\`
- Any \`[var(--…)]\` (already a token via CSS variable)

So \`w-[280px]\` and \`max-w-[480px]\` are allowed (one-off layout pixels), but \`bg-[#0204a3]\` and \`p-[13px]\` are flagged (must be tokens).

## Suppressing rules

Edit \`src/anchor/linter/audit-config.json\`:

\`\`\`json
{
  "scanRoots": ["src"],
  "excludePathSubstrings": [
    "/node_modules/",
    "/components/base/",
    "/__fixtures__/"
  ],
  "reportForbiddenHtmlFromSpecs": true,
  "flagArbitraryTailwind": true
}
\`\`\`

## CI integration

\`\`\`yaml
# .github/workflows/ci.yml
- run: npx design-anchor audit
\`\`\`

Fails the build on any violation. Add as a pre-commit hook for tighter feedback:

\`\`\`bash
# .husky/pre-commit
npx design-anchor audit
\`\`\`
`,
      zh: `
## 会被抓的违规

\`anchor audit\` AST 遍历业务代码里每个 \`.tsx\`（跳过 \`.anchor/\`、demos、fixtures），标记两类问题：

### 1. 禁止的原生标签

如果某个组件的 \`spec.json\` 把 \`<button>\` 列入 forbidden，那么库外的任何 raw \`<button>\` 都会报错：

\`\`\`json
"forbidden": [
  {
    "htmlTag": "button",
    "reason": "Raw <button> bypasses variant + size contract",
    "useInstead": "@design Button"
  }
]
\`\`\`

### 2. token 敏感前缀上的 arbitrary value

Audit 把前缀分两类：

**必须用 token 或 var(--…)（会报错）**：
- 颜色：\`bg / text / border / ring / fill / stroke / from / to / via / outline / accent / caret / decoration / divide / placeholder / shadow\`
- 间距：\`p / px / py / pt / pb / pl / pr / m / mx / my / mt / mb / ml / mr / gap / gap-x / gap-y / space-x / space-y\`
- 圆角：\`rounded / rounded-{side}\`

**一次性 layout / 定位字面像素允许**：
- \`w / h / min-w / max-w / min-h / max-h\`（组件 sizing）
- \`top / right / bottom / left / inset\`（定位）
- \`translate-x / translate-y\`（transforms）
- \`grid-cols / grid-rows / col-span / row-span\`（grid）
- \`aspect / z\`
- 任何 \`[var(--…)]\`（本身就在用 token）

所以 \`w-[280px]\` 和 \`max-w-[480px]\` 允许（一次性 layout 像素），但 \`bg-[#0204a3]\` 和 \`p-[13px]\` 会被抓（必须用 token）。

## 关掉某些规则

改 \`src/anchor/linter/audit-config.json\`：

\`\`\`json
{
  "scanRoots": ["src"],
  "excludePathSubstrings": [
    "/node_modules/",
    "/components/base/",
    "/__fixtures__/"
  ],
  "reportForbiddenHtmlFromSpecs": true,
  "flagArbitraryTailwind": true
}
\`\`\`

## CI 接入

\`\`\`yaml
# .github/workflows/ci.yml
- run: npx design-anchor audit
\`\`\`

任何违规直接 fail build。挂 pre-commit hook 反馈更快：

\`\`\`bash
# .husky/pre-commit
npx design-anchor audit
\`\`\`
`,
    },
  },

  /* ============================ AI Integration ======================== */
  {
    id: "ai-integration",
    title: { en: "AI Tool Integration", zh: "AI 工具接入" },
    description: {
      en: "Cursor, Claude Code, Copilot, Qoder.",
      zh: "Cursor、Claude Code、Copilot、Qoder。",
    },
    markdown: {
      en: `
## Generated artifacts

\`anchor sync\` regenerates four AI-readable files. Each consumes them differently:

| File | Consumed by |
|---|---|
| \`.cursorrules\` | Cursor (always-applied project rules) |
| \`.cursor/rules/anchor.mdc\` | Cursor (rule registry; alwaysApply: true) |
| \`.cursor/rules/anchor-selfcheck.mdc\` | Cursor (post-edit self-check checklist) |
| \`CLAUDE.md\` | Claude Code (project instructions) |
| \`.windsurfrules\` | Windsurf |
| \`.github/copilot-instructions.md\` | GitHub Copilot Chat |
| \`src/anchor/rules/ANCHOR_RULES.md\` | Shared canonical version (markdown source) |

## Cursor

After \`anchor start\`, restart Cursor and open the project. The \`anchor.mdc\` rule is auto-applied to every chat. Try:

> "Add a confirm dialog when the user clicks Delete."

Expected behaviour: Cursor reaches for \`@design AlertDialog\` (not raw \`<dialog>\`) and uses \`destructive\` variant for the action button.

## Claude Code

CLI users: \`CLAUDE.md\` is read automatically when Claude Code starts in that directory. Try:

\`\`\`bash
cd your-project
claude
\`\`\`

Then prompt:

> "Show me where to put a new dashboard card."

Expected: Claude references the \`Card\` component from \`@design\` and respects the spec's baseline tokens.

## GitHub Copilot

Copilot Chat reads \`.github/copilot-instructions.md\`. The rules tell Copilot to:

- Import from \`@design\` (not from \`@radix-ui\` directly)
- Use semantic props (\`variant\`, \`size\`) instead of stacking Tailwind overrides
- Use design tokens for colors and spacing

## Qoder (and other MCP-aware tools)

Wire up the MCP server (see [MCP Server](#mcp-server)). Once connected, the agent can:

- Call \`list_components\` to discover what's available
- Call \`read_schema\` to read the spec before generating code
- Call \`run_audit\` after each edit to self-verify

## Self-check loop

\`.cursor/rules/anchor-selfcheck.mdc\` is a checklist the agent runs after each round of edits:

1. Are all imports from \`@design\`?
2. Are forbidden native tags absent?
3. Is any arbitrary-value Tailwind on color/spacing/radius prefixes?
4. Are component semantic props (\`variant\`, \`size\`) used instead of className overrides?

The agent self-corrects before returning the diff.
`,
      zh: `
## 生成的文件

\`anchor sync\` 会重新生成几个 AI 可读的文件，每个工具读取方式不同：

| 文件 | 给谁用 |
|---|---|
| \`.cursorrules\` | Cursor（项目级 always-applied rules） |
| \`.cursor/rules/anchor.mdc\` | Cursor（rule registry，alwaysApply: true） |
| \`.cursor/rules/anchor-selfcheck.mdc\` | Cursor（编辑后 self-check 清单） |
| \`CLAUDE.md\` | Claude Code（项目指令） |
| \`.windsurfrules\` | Windsurf |
| \`.github/copilot-instructions.md\` | GitHub Copilot Chat |
| \`src/anchor/rules/ANCHOR_RULES.md\` | 共享的 canonical 版本（markdown 源） |

## Cursor

跑过 \`anchor start\` 之后，重启 Cursor 打开项目。\`anchor.mdc\` 会自动注入每个 chat。试一下：

> "用户点 Delete 时弹一个 confirm dialog。"

预期行为：Cursor 会去引 \`@design AlertDialog\`（不是 raw \`<dialog>\`），action button 用 \`destructive\` variant。

## Claude Code

CLI 用户：在项目目录起 Claude Code，\`CLAUDE.md\` 自动读入：

\`\`\`bash
cd your-project
claude
\`\`\`

然后随便问：

> "在哪儿放一个新的 dashboard card？"

预期：Claude 会引 \`@design\` 的 \`Card\` 组件，遵守 spec 里的 baseline token。

## GitHub Copilot

Copilot Chat 读 \`.github/copilot-instructions.md\`。规则告诉 Copilot：

- 从 \`@design\` 引（别直接引 \`@radix-ui\`）
- 用 semantic props（\`variant\`、\`size\`），别堆 Tailwind 覆盖
- 颜色和间距用 design token

## Qoder（以及其它支持 MCP 的工具）

把 MCP server 接上（参考 [MCP Server](#mcp-server)）。连上之后 agent 就能：

- 调 \`list_components\` 发现可用组件
- 调 \`read_schema\` 在生成代码前读 spec
- 调 \`run_audit\` 每次编辑后自检

## Self-check 闭环

\`.cursor/rules/anchor-selfcheck.mdc\` 是一份 checklist，agent 每轮编辑后过一遍：

1. 所有 import 是不是都从 \`@design\`？
2. forbidden 的原生 tag 还在吗？
3. color / spacing / radius 前缀上有没有 arbitrary value Tailwind？
4. 用 semantic props（\`variant\`、\`size\`）了，还是堆了 className 覆盖？

Agent 在返回 diff 前自己纠正。
`,
    },
  },

  /* ============================ Spec JSON ============================= */
  {
    id: "spec-json",
    title: { en: "Component Specs", zh: "组件 Spec" },
    description: {
      en: "The `spec.json` contract per component.",
      zh: "每个组件的 `spec.json` 契约。",
    },
    markdown: {
      en: `
## Why specs

Every component has a sibling \`*.spec.json\` in \`.anchor/src/anchor/schema/components/\`. The spec is the **single source of truth** for:

- What native HTML tags this component replaces (forbidden tags → audit)
- What props the component accepts (for typed AI generation)
- What className tokens are baseline (must be present)
- What className patterns are blacklisted (must not be added)
- Reusable code examples (for AI to crib from)
- AI prompt fragment merged into \`.cursorrules\`

## Schema shape

\`\`\`json
{
  "id": "button",
  "componentName": "Button",
  "version": "1.0.0",
  "intent": "Unified clickable action entry. Raw <button> with manual styling is forbidden.",
  "wraps": {
    "module": "@/components/base/button",
    "primitives": ["Button"]
  },
  "requiredProps": [...],
  "optionalProps": [...],
  "styleLock": {
    "baselineTokens": ["inline-flex", "rounded-md", "font-medium", "transition-colors"],
    "blacklist": [
      { "description": "...", "pattern": "^(h-|px-|py-)" }
    ]
  },
  "aiPrompt": "Always use Button from @design — never raw <button>. Pick variant by intent...",
  "forbidden": [
    { "htmlTag": "button", "reason": "...", "useInstead": "@design Button" }
  ],
  "corrections": [
    { "id": "no-raw-button", "violation": "...", "fixPrompt": "Replace with Button..." }
  ],
  "examples": [
    { "title": "Primary CTA", "snippet": "<Button>Save</Button>" }
  ],
  "meta": { "tags": ["button"], "category": "action", "status": "stable" }
}
\`\`\`

## How fields are used

| Field | Used by |
|---|---|
| \`intent\`, \`aiPrompt\`, \`examples\` | \`.cursorrules\` generator → AI tools |
| \`forbidden\` | \`anchor audit\` flags violations |
| \`corrections\` | AI sees these to know how to fix violations |
| \`styleLock.baselineTokens\` | Runtime \`stripLockedClasses\` enforces |
| \`styleLock.blacklist\` | Runtime + audit both check |
| \`requiredProps\` / \`optionalProps\` | Auto-generated Controls panel in the Portal |
| \`meta.category\` | Sidebar grouping |

## Editing specs

Open the Components tab → pick any component → switch to **Spec.json** tab in the bottom panel → edit → Save. The MCP \`update_schema\` tool exposes the same operation to agents.

After editing, run \`npx design-anchor sync\` to regenerate \`.cursorrules\` (or let the portal's auto-sync handle it).
`,
      zh: `
## 为什么要 spec

每个组件在 \`.anchor/src/anchor/schema/components/\` 都有一份 \`*.spec.json\`。这是该组件的 **single source of truth**：

- 这个组件替代了哪些原生 HTML tag（forbidden → audit）
- 这个组件接受哪些 props（让 AI 类型化生成）
- 哪些 className token 是 baseline（必须在）
- 哪些 className 模式 blacklist（必须不在）
- 可复用的 code examples（AI 抄作业的素材）
- AI prompt 片段（合并进 \`.cursorrules\`）

## Schema 形态

\`\`\`json
{
  "id": "button",
  "componentName": "Button",
  "version": "1.0.0",
  "intent": "Unified clickable action entry. Raw <button> with manual styling is forbidden.",
  "wraps": {
    "module": "@/components/base/button",
    "primitives": ["Button"]
  },
  "requiredProps": [...],
  "optionalProps": [...],
  "styleLock": {
    "baselineTokens": ["inline-flex", "rounded-md", "font-medium", "transition-colors"],
    "blacklist": [
      { "description": "...", "pattern": "^(h-|px-|py-)" }
    ]
  },
  "aiPrompt": "Always use Button from @design — never raw <button>. Pick variant by intent...",
  "forbidden": [
    { "htmlTag": "button", "reason": "...", "useInstead": "@design Button" }
  ],
  "corrections": [
    { "id": "no-raw-button", "violation": "...", "fixPrompt": "Replace with Button..." }
  ],
  "examples": [
    { "title": "Primary CTA", "snippet": "<Button>Save</Button>" }
  ],
  "meta": { "tags": ["button"], "category": "action", "status": "stable" }
}
\`\`\`

## 各字段被谁用

| 字段 | 给谁 |
|---|---|
| \`intent\` / \`aiPrompt\` / \`examples\` | \`.cursorrules\` 生成器 → AI 工具 |
| \`forbidden\` | \`anchor audit\` 抓违规 |
| \`corrections\` | AI 看到后知道怎么改 |
| \`styleLock.baselineTokens\` | 运行时 \`stripLockedClasses\` 强制保留 |
| \`styleLock.blacklist\` | 运行时 + audit 双重检查 |
| \`requiredProps\` / \`optionalProps\` | Portal 里 Controls 面板自动生成的依据 |
| \`meta.category\` | 侧边栏分组 |

## 编辑 spec

Components tab → 选任意组件 → 下方面板切到 **Spec.json** → 改 → 保存。MCP \`update_schema\` 工具对 agent 暴露同样的操作。

改完跑 \`npx design-anchor sync\` 重新生成 \`.cursorrules\`（或者让 portal 的 auto-sync 处理）。
`,
    },
  },

  /* ============================ FAQ =================================== */
  {
    id: "faq",
    title: { en: "FAQ", zh: "常见问题" },
    description: {
      en: "Common questions.",
      zh: "常见问题。",
    },
    markdown: {
      en: `
## Why isn't my token change reflected?

Two cases:

1. **In the Portal preview**: edits go to a draft; click **Save & Sync** to commit. The preview already reflects the draft live, but disk + downstream tools need the explicit save.
2. **In your business app**: after Save & Sync, the Tailwind generated CSS (\`.anchor/src/styles/design-tokens.generated.css\`) gets rewritten. Your app's Vite HMR / Webpack should pick it up. If not, restart the dev server.

## Why does the Controls panel show controls that don't do anything?

The auto-controls scan the component source for Tailwind classes and offer overrides. But classes inside scoped selectors (\`[&>input]:pb-3\`, \`has-[]:...\`, \`data-[state=active]:...\`) can't be overridden by a root-level className. Components with heavy use of these (InputGroup, Sidebar) hide those controls via \`hidePrefixes\` in their demo files.

## Can I add my own components?

Yes. Two ways:

1. **Portal UI**: Components tab → "Add Component" → paste local path. The component is copied into \`.anchor/src/components/base/\` and a starter demo is scaffolded.
2. **CLI**: \`npx design-anchor add MyComponent\`

Then write a \`spec.json\` in \`.anchor/src/anchor/schema/components/\` to declare its contract.

## Can I remove components I'm not using?

The library is small enough that tree-shaking handles unused components automatically. If you want to physically remove them, just delete the \`.tsx\` + \`spec.json\` and run \`anchor sync\`.

## How do I customize per-slot semantic colors (e.g. make \`muted\` warmer)?

In the customizer, open **Surfaces > Derived > Semantic** subgroup and click any row (e.g. \`muted\`). The editor opens and writes to \`mapOverrides.light\` (or \`.dark\`). The override survives token regeneration.

## Where does my data live?

Everything is local. Tokens are in \`.anchor/src/design-tokens/tokens.json\`. Components are in \`.anchor/src/components/base/\`. Specs are in \`.anchor/src/anchor/schema/components/\`. Generated artifacts (\`.cursorrules\` etc.) are at the project root. Nothing leaves your machine.

## How do I update Design-anchor?

\`\`\`bash
npx design-anchor upgrade
\`\`\`

Updates the \`.anchor/\` template files in place. Your seeds, custom components, and spec edits are preserved.
`,
      zh: `
## 改了 token 没生效？

两种情况：

1. **在 Portal 预览里**：改的是 draft，点 **Save & Sync** 才真正落盘。预览本身是实时刷新 draft 的，但落盘 + 下游工具要显式保存。
2. **在你的业务应用里**：Save & Sync 之后，Tailwind 生成的 CSS（\`.anchor/src/styles/design-tokens.generated.css\`）会重写。你应用的 Vite HMR / Webpack 应该捕到。没捕到就重启 dev server。

## Controls 面板里有些控件改了没反应？

auto-controls 扫组件源码里的 Tailwind class 生成 override 入口。但是 scoped selector 里的 class（\`[&>input]:pb-3\`、\`has-[]:...\`、\`data-[state=active]:...\`）没法用 root className 覆盖。重度用这些 selector 的组件（InputGroup、Sidebar）在 demo 文件里通过 \`hidePrefixes\` 隐藏这些控件。

## 能加自己的组件吗？

可以，两种方式：

1. **Portal UI**：Components tab → "Add Component" → 贴本地路径。组件复制到 \`.anchor/src/components/base/\`，自动 scaffold 一个 starter demo。
2. **CLI**：\`npx design-anchor add MyComponent\`

然后在 \`.anchor/src/anchor/schema/components/\` 写一份 \`spec.json\` 声明它的契约。

## 用不到的组件能删吗？

库已经够小，tree-shaking 自动处理没引用的组件。想物理删的话，把 \`.tsx\` + \`spec.json\` 删了再跑 \`anchor sync\`。

## 怎么单独调某个语义色（比如让 \`muted\` 更暖）？

Customizer 里打开 **Surfaces > Derived > Semantic** 子组，点任一行（比如 \`muted\`），编辑器出来，填新值就行。覆盖写到 \`mapOverrides.light\`（或 \`.dark\`）里，重新生成 token 也不会丢。

## 数据存哪？

全本地。Tokens 在 \`.anchor/src/design-tokens/tokens.json\`，组件在 \`.anchor/src/components/base/\`，specs 在 \`.anchor/src/anchor/schema/components/\`，生成的产物（\`.cursorrules\` 等）在项目根。什么都不会出你的机器。

## 怎么升级 Design-anchor？

\`\`\`bash
npx design-anchor upgrade
\`\`\`

原地更新 \`.anchor/\` 模板文件，你的 seeds、自定义组件、spec 改动都保留。
`,
    },
  },
];
