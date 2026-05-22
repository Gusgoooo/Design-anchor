<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>给你的设计系统下锚。给 AI 生成的 UI 上治理。</strong></p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="#简介">简体中文</a>
</p>

---

<a id="简介"></a>

## 这是什么

一套 **以 token 驱动的设计系统 + AI 治理管线**，让 AI 编码工具（Cursor / Claude Code / Copilot / Qoder）在结构上没法偏离你的设计语言。

任何 React + Tailwind 项目，一条命令接入。你会拿到：

- **60+ 对齐 shadcn 的 base 组件**（`@/components/base/*`）
- 实时可视化的 **token customizer** —— 调 ~14 个 seed，200+ 派生 CSS 变量立刻刷新
- 每个组件配 **spec.json 契约**（forbidden tags、baseline classes、blacklist 模式、AI prompt 片段）
- 一组开箱即用的 AI 规则文件，Cursor / Claude Code / Copilot / Windsurf 直接读
- 一个 **MCP server**，把 schema + audit + token 暴露给任何支持 MCP 的 agent

## 它解决的问题

AI 编码工具单次生成 UI 时表现很好，但跨对话就丢上下文：

- 同一个按钮在 3 个页面里出现 3 种圆角
- 同一个灰色，这里是 `gray-100`、那里是 `#e5e7eb`、再换个地方又是 `gray-200`
- 间距从 `p-4` 漂到 `p-[15px]` 再漂到 `py-3.5`

几周后一个企业级产品看起来像 10 个团队拼出来的。Figma library 和 `design.md` 这种 soft constraints 解决不了 —— AI 在第 50 次编辑时早就忘了。

Design-anchor 的管线是 **强制**，不是「文档」：

```
~14 个 seed  →  200+ 派生 CSS 变量  →  组件 className
                          ↓                          ↓
              @theme inline 接到 Tailwind         AST audit 拦截漂移
```

改任何一个 seed，所有组件实时换肤。业务代码里手写 `bg-[#0204a3]`？audit 直接拒。

## 快速上手

```bash
npx anchor start
```

这是 all-in-one 命令，会自动：

1. **`init`** —— 在项目根 scaffold 一个 `.anchor/`（完整的组件库子项目）
2. **`install`** —— 在 `.anchor/` 里跑 `npm install`，让 Portal 跑起来
3. **`dev`** —— 在 <http://localhost:6006> 打开 Portal

打开命令行里打印的 URL 即可。三个 tab：

| Tab | 干啥 |
|---|---|
| **Docs** | 完整中英双语文档（介绍 / 快速上手 / Token 体系 / CLI / MCP / Audit / AI 接入 / spec 格式 / FAQ） |
| **Design Token** | 可视化 customizer —— 左侧 seed 编辑器，右侧实时组件预览 |
| **Components** | 浏览 60+ base 组件 + 实时 controls + spec.json 编辑器 |

Portal 右上角：🌐 EN/中文 切换 + 🌙/☀️ 暗色切换。

## 图片参考的工作流

当你（或 AI agent）把一张截图 / mockup / 参考图给系统、让它做页面时，Design-anchor 强制走**二选一**：

| 路径 | 会发生什么 | 什么时候用 |
|---|---|---|
| **A. 提取并覆盖 token** | Agent 读图，给出对 `tokens.json` 的 diff（primary color / 圆角 / 字号 / 间距），你确认后跑 `anchor sync`。所有组件全部换肤匹配参考。 | 这是品牌改版，或者你希望产品**看上去像**参考图。 |
| **B. 遵循现有 token** | Tokens 一个不动，agent 用现有的 `@design` 组件组合出新布局。颜色 / 圆角 / 间距全部跟产品其它页面一致，只是新的排版。 | 参考图只是「这里放什么」的布局提示，不是品牌变更。 |

**默认走 Path B**。用户没明说就别走 A —— 改 token 会影响**所有页面**，必须是用户的明确选择，不能悄悄发生。

绝对不允许的：从截图里凭空编色值 / 圆角 / 间距。业务代码里硬写 `bg-[#0204a3]` 不管怎么来的，`anchor audit` 都会拒。

规则在 `.cursor/rules/anchor-selfcheck.mdc`，镜像版本在 `src/anchor/rules/AGENTS_IMAGE_REFERENCE.md`。

## 在你项目里创建了什么

```
your-project/
├── .anchor/                            ← Design-anchor 子目录（可 gitignore 可 vendor）
│   ├── src/components/base/           60+ 开箱即用 React + Tailwind 组件
│   ├── src/anchor/schema/             每个组件的 spec.json 契约
│   ├── src/design-tokens/             tokens.json + seed-to-map 算法
│   └── package.json                   独立 deps（Vite + React + Radix + Tailwind v4）
├── CLAUDE.md                           Claude Code CLI / Claude Desktop 规则
├── .cursor/rules/anchor.mdc            Cursor 专属规则（alwaysApply）
├── .cursor/rules/anchor-selfcheck.mdc  编辑后 checklist + 图片参考规则
├── .github/copilot-instructions.md     GitHub Copilot Chat 规则
├── AGENTS.md                           通用 AI 编码契约（三条硬规则）
├── .mcp.json                           Claude Code / Cline / Zed MCP 配置
├── .cursor/mcp.json                    Cursor MCP 配置
├── .cursor/hooks.json                  Cursor hook：保存后跑 audit
├── .cursorrules                        老格式兜底（部分 IDE 还在读）
├── ANCHOR_BOUNDARIES.md                目录边界说明
└── ANCHOR_INTEGRATION.md               @design 别名 + Vite 示例
```

每个 AI 工具读自己的文件：Cursor 读 `.cursor/rules/*.mdc`，Claude Code 读 `CLAUDE.md`，Copilot 读 `.github/copilot-instructions.md`。三个文件的正文是一样的 —— 同样的场景路由表、同样的组件清单、同样的硬规则 —— 只是按不同工具的协议封装。

## 在你自己的应用里用组件

加一个 TypeScript path alias `@design` → `.anchor/src/components/base`：

```ts
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
```

然后业务代码里：

```tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
```

## CLI

```
anchor start [dir]      一键：init + npm install + 启动 Portal
anchor init  [dir]      仅 scaffold .anchor/（不 install 也不 dev）
anchor dev   [dir]      在已有 .anchor/ 上启动 Portal
anchor sync  [dir]      重新生成 .cursorrules / Tailwind token / rules
anchor audit [dir]      AST 扫描，抓 forbidden tag + token 违规
anchor upgrade [dir]    更新 .anchor/ 模板（保留你的修改）
anchor mcp [dir]        在 stdio 上启动 MCP server
anchor add <Component>  导入新组件 + scaffold spec + demo
```

## Token 体系（一分钟）

```
seed (tokens.json)         ← 你编辑这一层（~14 个键）
  ↓
seed-to-map.mjs            ← Antd 算法 + 自定义映射
  ↓
200+ 个 CSS 变量            ← --color-primary, --spacing-N, --radius-md, …
  ↓
@theme inline 块            ← Tailwind v4 utilities 在这里解析
  ↓
组件 className              ← bg-primary, rounded-md, p-4 …
```

Seed 总共 14 个（用户可调）：

| 类别 | Seeds | 驱动什么 |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info / Link | 所有语义色 slot |
| Surface | colorBgBase / colorTextBase | 30+ 派生中性色（墨色梯度、填充、边框） |
| Typography | fontSize | `text-xs` 到 `text-3xl` |
| Shape | borderRadius | `rounded-sm/md/lg/xl` 梯度 |
| Spacing | sizeUnit | 整个 Tailwind `p-N` / `gap-N` 尺度 |
| Charts | chart1 – chart5（在 `customSeeds`） | 图表配色 |

暗色：任何 seed 都可以在 `seedDark` 里覆盖。单个语义 token（如 `muted` / `accent` / `border`）可以在 customizer 里 **Surfaces > Derived > Semantic** 子组单独覆盖；落到 `mapOverrides.light` / `.dark`。

## MCP server

接入 Cursor：

```jsonc
// .cursor/mcp.json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
```

Claude Code（`.mcp.json`）、Continue、Cline、Zed、Qoder 都是同样套路。暴露 13 个工具：`list_components` / `read_component` / `create_component` / `list_tokens` / `update_token` / `list_schemas` / `read_schema` / `update_schema` / `run_audit` / `run_sync_rules` / `get_cursorrules` / `read_file` / `write_file`。

## `anchor audit` 会抓什么

- **spec.json 里声明的 forbidden 原生 tag**（比如声明了 Button 后还出现 raw `<button>`）
- **token 敏感前缀上的 arbitrary value Tailwind**：
  - 抓：`bg / text / border / ring / fill / stroke / from / to / via / shadow / p / m / gap / rounded` —— 必须是 token 或 `var(--…)`
  - 放过：`w / h / top / left / grid-cols / aspect / z` 等 —— 一次性 layout 像素允许

所以 `bg-[#0204a3]` 和 `p-[13px]` 拒；`w-[280px]` 和 `max-w-[480px]` 过。

## 项目结构

```
.
├── bin/                        CLI 入口（anchor / anchor-mcp / postinstall）
├── scripts/                    构建辅助（sync-tokens / sync-from-schema / audit）
├── src/
│   ├── anchor/                 治理：schema specs、linter config、rule 生成器
│   ├── anchor-portal/          Portal 应用（Vite + React）
│   │   ├── canvas/             Story 预览框
│   │   ├── controls/           自动生成的参数面板
│   │   ├── create/             Token customizer（Design Token tab）
│   │   ├── docs/               Docs tab（双语 section）
│   │   ├── i18n/               LocaleProvider + Bilingual hook
│   │   ├── sidebar/            Components tab 侧边栏
│   │   ├── spec-editor/        Spec.json 编辑器
│   │   └── theme/              暗色 provider
│   ├── components/base/        60+ 对齐 shadcn 的组件（组件库）
│   ├── design-tokens/          tokens.json + seed-to-map.mjs + DesignTokenShowcase
│   ├── lib/                    cn() 工具
│   └── styles/                 globals.css + 生成的 design-tokens.generated.css
├── docs/                       架构笔记 / 进度
└── vendor/design-system-template/   上游 shadcn snapshot 供参考
```

## 技术栈

- **React 19** + **Vite 7**（Portal）
- **Tailwind v4** + `@theme inline` 接 token
- **Radix UI** primitives 提供无障碍组件底层
- **shadcn/ui** 模式做组件组合
- **Antd 5** 色彩算法做 token 派生
- **react-markdown + remark-gfm** 渲染文档
- **MCP** stdio JSON-RPC 对接 AI agent

## Roadmap

- 上传截图，AI 自动提取 token（即上文 Path A 的自动化实现）
- 跨项目 preset 库（一键加载 shadcn Indigo / AntD Default 等）
- 比目前 8 卡更丰富的组件预览组合
- 两个 token snapshot 之间的可视化 diff
- VS Code 插件（在 MCP 之外）

## 参与贡献

欢迎 issue 和 PR。产品有意保持小而 opinionated —— 任何设计变更都应该保持 `seed → 派生 → CSS 变量 → 组件 className` 这条管线完整。

## License

MIT.
