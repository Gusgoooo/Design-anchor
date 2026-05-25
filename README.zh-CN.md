<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>面向长期产品的 AI 原生设计系统治理管线。</strong></p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="#简介">简体中文</a>
</p>

---

<a id="简介"></a>

> Design-anchor 帮团队在更快使用 AI 编码的同时，仍然保持产品 UI 长期一致。它尤其适合 B 端 SaaS、后台管理系统、内部平台、企业仪表盘，以及任何需要持续演进多年、不能越做越散的产品。

更完整的产品叙事、落地路径和 B 端/企业团队采用方式见：[产品采用指南](./docs/PRODUCT_ADOPTION_GUIDE.zh-CN.md)。English version: [README.md](./README.md) and [Product Adoption Guide](./docs/PRODUCT_ADOPTION_GUIDE.md).

## 它为什么存在

Cursor / Claude Code / Copilot / Lovable / v0 / Bolt——每个 AI 编码工具都很乐意把"能跑的"UI 吐给你。但跨 session 一拉长，输出就漂成 **AI 泥浆代码**：能编译、但不属于任何系统。

实际项目里，几周下来的泥浆长这样：

```tsx
// 页面 A —— agent 周二写的
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg">保存</button>

// 页面 B —— 同一个 agent，周五
<button className="bg-[#3b82f6] px-[15px] py-2.5 rounded-[10px]">保存</button>

// 页面 C —— 另一个 agent，下个 sprint
<button className="bg-indigo-500 px-3.5 py-1.5 rounded-md">保存</button>
```

同一个意图、三套按钮实现、三种蓝、三种圆角。把这种漂移乘以每一个 UI 原语 × 每一个页面——你的产品看起来就像十个团队拼出来的。Figma library、`design.md` 文档、品牌指南都治不了这个；soft constraint 在第 50 次编辑就被忘了。

**Design-anchor 是结构性修复**。它把"软文档"换成三层硬约束，让漂移在机制上不可能：

1. **Token 化的 seed → 200+ 派生 CSS 变量**。改一个 seed，所有组件换肤。值不存在，自然没法忘。
2. **每个组件的 `spec.json` 契约**。通过 `.cursorrules` / `CLAUDE.md` / `.github/copilot-instructions.md` / MCP 暴露给 AI agent——单一来源生成所有规则文件。
3. **`anchor audit` AST 扫描**。`bg-[#0204a3]`、有 `<Button>` 还写 `<button>`、`p-[13px]` 等业务代码硬伤，全部拒。CI 挂掉，PR 拦下，泥浆 die。

任何 React + Tailwind 项目，一行命令：

```bash
npx design-anchor start
```

## 谁适合用

Design-anchor 不是只为第一眼漂亮的 demo 设计的，它更适合需要长期维护、多人协作、持续迭代的真实产品。

| 团队 / 产品类型 | 为什么需要 |
|---|---|
| **B 端 SaaS** | Dashboard、表单、表格、筛选、权限、账单、报表、设置页会反复出现。客户每天在这些界面里工作，小的不一致会长期放大。 |
| **企业内部平台** | 一个产品会被很多工程师、设计师、外包、AI agent 轮流维护。Design-anchor 让所有参与者遵守同一套组件契约和 audit 规则。 |
| **设计系统团队** | Token、组件 spec、AI 规则、MCP 工具、audit 检查来自同一个真源，不再靠几份文档人工同步。 |
| **AI 辅助开发团队** | 可以让 AI 更大胆地写前端，同时不允许它重复发明按钮、颜色、间距、表格模式。 |
| **已有老项目** | 可以先接治理，再逐步把页面迁移到 `@design` 组件，不需要一次性重构全部界面。 |

## 为什么长期 B 端产品尤其需要

消费类活动页可以接受一次性的视觉发挥，但长期 B 端产品通常不行。B 端界面更像工作台：用户每天回来，扫描密集信息、对比状态、完成流程，并通过一致性建立信任。

这会带来四个刚性要求：

1. **一致性必须跨越个人经验。** 设计师、工程师、AI agent、外包团队、未来接手的人，都需要同一份 UI 契约。
2. **设计变化必须便宜。** 品牌升级、暗色模式、密度调整、可访问性修正，应该通过 token 完成，而不是几百处手工替换。
3. **AI 产物必须可治理。** Prompt 不够，生成代码需要可执行检查，也需要读取项目本地上下文。
4. **接入必须渐进。** 真实公司不能停掉业务路线图重写所有页面，治理系统必须能和现有 React + Tailwind 项目并行。

Design-anchor 把这些要求变成一条本地管线：token seeds、component specs、AI 规则文件、MCP 工具、Portal 可视化维护，以及 CI 里的 `anchor audit`。

## 你拿到什么

- **60+ 对齐 shadcn 的 base 组件**（`@/components/base/*`）
- 实时可视化的 **token customizer**——调 ~14 个 seed，200+ 派生 CSS 变量立刻刷新
- **Govern tab**——项目全局合规一眼看清（违规 / 组件使用 / AI 规则新鲜度 / MCP 工具数）
- 每个组件配 **spec.json 契约**（forbidden tags、baseline classes、blacklist 模式、AI prompt 片段）
- 一组开箱即用的 AI 规则文件，Cursor / Claude Code / Copilot / Windsurf 直接读
- 一个 **MCP server**，把 schema + audit + token 暴露给任何支持 MCP 的 agent
- **首次启动引导**——三选一：默认组件库 / 导入自有组件 / 空白起步

## 产品承诺

Design-anchor 不只是另一个 UI kit。UI kit 解决“有没有组件”，Design-anchor 解决“组件、token、AI、CI 是否形成治理闭环”：

```
设计意图 → Token seeds → 组件契约 → AI 可读规则 → MCP 工具 → Audit → CI
```

结果很直接：团队可以让更多人、更多 AI 工具参与前端开发，同时不丢掉产品自己的视觉语言。

## 五分钟从零开始

```bash
npx design-anchor start
```

这一条命令做三件事：

1. **`init`**——在项目根 scaffold 一个 `.anchor/`（自包含的组件库子项目）
2. **`install`**——在 `.anchor/` 里跑 `npm install`
3. **`dev`**——在 <http://localhost:6006> 打开 Portal

第一次打开会出现 **三卡引导**：

| 模式 | 会发生什么 |
|---|---|
| **默认组件库** | 直接用 bundle 进来的 60+ 组件（推荐） |
| **导入自有组件** | 指向本地 `.tsx` 文件夹，会先做兼容度预扫（safe / warn / risky）再决定怎么拷 |
| **空白起步** | 清空组件，留 token + 规则，从零开始造 |

选完后 Portal 打开，**四个 tab**：

| Tab | 干啥 |
|---|---|
| **Docs** | 完整中英双语文档（介绍 / 快速上手 / Token 体系 / CLI / MCP / Audit / AI 接入 / spec 格式 / FAQ） |
| **Design Token** | 可视化 customizer——sizeUnit 用约束滑动条、长度 seed 支持 ↑↓ ±0.25 步进、⋯ 菜单里有「恢复默认」，右侧组件实时预览 |
| **Components** | 浏览 60+ base 组件 + 实时 controls + spec.json 编辑器 |
| **Govern** | 治理 KPI 一眼可见——0 违规 / N 个组件被使用 / AI 规则文件全部最新 |

Portal 右上角：🌐 EN/中文 切换 + 🌙/☀️ 暗色切换。

## 三层防泥浆护栏，详细看

### 1. Token 流水线——漂移在机制上不存在

```
~14 个 seed（tokens.json）  →  seed-to-map.mjs  →  200+ CSS 变量  →  @theme  →  className
```

把 `colorPrimary` 从 `#000000` 改成 `#635BFF`，所有组件里的 `bg-primary` 立刻变。把 `borderRadius` 从 `8` 改成 `12`，所有 `rounded-md` 跟着走。跑一次 `anchor sync`——不需要任何全局替换。

Seed 总共 ~14 个：

| 类别 | Seeds | 驱动什么 |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info | 所有语义色 slot（link 自动跟随 info） |
| Surface | colorBgBase / colorTextBase | 30+ 派生中性色（墨色梯度、填充、边框、shadcn 语义） |
| Typography | fontSize | `text-xs` 到 `text-3xl` |
| Shape | borderRadius | `rounded-sm/md/lg/xl` 梯度 |
| Spacing | sizeUnit | 整个 Tailwind `p-N` / `gap-N` 尺度 |
| Charts | chart1 – chart5 | 图表配色（已接 Recharts） |

暗色：任何 seed 都可以在 `seedDark` 里覆盖。单个语义 token（如 `muted` / `accent`）可以在 customizer 单独覆盖，落到 `mapOverrides.light` / `.dark`。

### 2. AI 规则文件——泥浆从一开始就没法被写出来

从 spec.json + 场景路由表生成：

```
your-project/
├── CLAUDE.md                           Claude Code / Claude Desktop
├── .cursor/rules/anchor.mdc            Cursor（alwaysApply）
├── .cursor/rules/anchor-selfcheck.mdc  编辑后 checklist
├── .github/copilot-instructions.md     Copilot Chat
├── AGENTS.md                           通用 AI 编码契约
├── .mcp.json                           Claude Code / Cline / Zed MCP
├── .cursor/mcp.json                    Cursor MCP
└── .cursor/hooks.json                  保存后跑 audit 的 hook
```

每个 AI 工具读自己的文件。正文是**同一份**——同样的场景路由、同样的组件清单、同样的硬规则——只是按各自工具协议封装。AI 在写错之前就被告知：「有 `<Button>` 别用 `<button>`」。

### 3. `anchor audit`——漏过的泥浆在 PR 阶段被拒

AST 扫描，跑在保存（Cursor hook）、pre-commit、CI 三处：

- **spec.json 里声明的 forbidden 原生 tag**（声明了 Button 后还出现 raw `<button>`）
- **token 敏感前缀上的 arbitrary value Tailwind**：
  - **拒**：`bg / text / border / ring / fill / stroke / from / to / via / shadow / p / m / gap / rounded`——必须是 token 或 `var(--…)`
  - **放过**：`w / h / top / left / grid-cols / aspect / z`——一次性 layout 像素允许

所以 `bg-[#0204a3]`、`p-[13px]` 拒；`w-[280px]`、`max-w-[480px]` 过。

Portal 的 **Govern tab** 实时显示 audit 结果：零违规时绿色 banner，否则文件:行号违规列表。

## 图片 / 截图参考工作流

当你（或 AI agent）把一张截图甩给系统、让它做页面时，Design-anchor 强制走**二选一**：

| 路径 | 会发生什么 | 什么时候用 |
|---|---|---|
| **A. 提取并覆盖 token** | 跑 `npx design-anchor screenshot` 打印结构化 prompt；把图 + prompt 一起发给你的 AI 工具；AI 通过 MCP 调 `update_token` 改 seed，再调 `run_sync_rules`。所有组件全部换肤 | 品牌改版，或希望产品**看起来像**参考图 |
| **B. 遵循现有 token** | Tokens 一个不动，agent 用现有的 `@design` 组件组合出新布局。颜色/圆角/间距全部跟其他页面一致 | 参考图只是「这里放什么」的布局提示 |

**默认走 Path B**。改 token 影响**所有页面**，必须是用户的明确选择，绝对不能悄悄发生。

绝对不允许的：从截图凭空编色值/圆角。业务代码里硬写 `bg-[#0204a3]` 不管怎么来的，`anchor audit` 都会拒。

## 在你自己的应用里用组件

加 TypeScript path alias `@design` → `.anchor/src/components/base`：

```ts
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
```

然后业务代码：

```tsx
import { Button } from "@design";

export function CTA() {
  return <Button>保存修改</Button>;
}
```

## CLI

```
anchor start [dir]        一键：init + npm install + 启动 Portal
anchor init  [dir]        仅 scaffold .anchor/
anchor govern             治理模式：仅注入 AI 规则文件，不拷贝组件/CSS（适合已有项目）
anchor dev   [dir]        在已有 .anchor/ 上启动 Portal
anchor sync  [dir]        重新生成 .cursorrules / Tailwind token / 规则镜像
anchor audit [dir]        AST 扫描，抓 forbidden tag + token 违规
anchor upgrade [dir]      更新 .anchor/ 模板（保留你的修改）
anchor mcp [dir]          在 stdio 上启动 MCP server
anchor screenshot [图片]  打印 AI prompt + 操作引导，截图驱动 token 提取
anchor theme <prompt.md>  从 markdown 设计 prompt 文本提取 token
```

## MCP server

```jsonc
// .cursor/mcp.json（Cursor 用；Claude Code / Cline / Zed / Qoder 在 .mcp.json 用同一格式）
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["design-anchor", "mcp", "."]
    }
  }
}
```

暴露 **13 个工具**：`list_components` / `read_component` / `create_component` / `list_tokens` / `update_token` / `list_schemas` / `read_schema` / `update_schema` / `run_audit` / `run_sync_rules` / `get_cursorrules` / `read_file` / `write_file`。

AI agent 直接调，不需要 copy-paste 来回粘。想从截图改 token？agent 读图 → 逐个 seed 调 `update_token` → 调 `run_sync_rules`。整个对用户透明。

## 在你项目里创建了什么

```
your-project/
├── .anchor/                            ← Design-anchor 子目录（可 gitignore 可 vendor）
│   ├── src/components/base/            60+ 开箱即用 React + Tailwind 组件
│   ├── src/anchor/schema/              每个组件的 spec.json 契约
│   ├── src/design-tokens/              tokens.json + seed-to-map 算法
│   └── package.json                    独立 deps（Vite + React + Radix + Tailwind v4）
├── CLAUDE.md                           Claude Code / Claude Desktop 规则
├── .cursor/rules/anchor.mdc            Cursor 专属规则（alwaysApply）
├── .cursor/rules/anchor-selfcheck.mdc  编辑后 checklist + 图片参考规则
├── .github/copilot-instructions.md     Copilot Chat 规则
├── AGENTS.md                           通用 AI 编码契约
├── .mcp.json                           Claude Code / Cline / Zed MCP
├── .cursor/mcp.json                    Cursor MCP
├── .cursor/hooks.json                  Cursor hook：保存后跑 audit
├── ANCHOR_BOUNDARIES.md                目录边界说明
└── ANCHOR_INTEGRATION.md               @design 别名 + Vite 示例
```

## 技术栈

- **React 19** + **Vite 6**（Portal）
- **Tailwind v4** + `@theme`（var-ref 链让运行时覆盖能 live preview）
- **Radix UI** primitives 提供无障碍组件底层
- **shadcn/ui** 模式做组件组合
- **Antd 5** 色彩算法做 token 派生
- **MCP** stdio JSON-RPC 对接 AI agent

## Roadmap

- **Vibe preset 库**——精选风格包（Linear / Vercel Geist / Stripe / Notion / Brutalist / Glass），打包 token 快照 + AI 风格规则。一键「让我的 app 长得像 Linear」
- **Token 迁移 codemod**——扫描导入的组件，识别硬编码值（`bg-[#0204a3]`、`p-[13px]`、内联 style），用 ΔE / Δpx 评分给出 token 建议，通过 ts-morph 落地
- **侧栏 origin 圆点**——蓝点表示用户导入组件，灰点表示默认 kit 组件
- **两个 token 快照之间的可视化 diff**
- **VS Code 插件**——IDE 原生 audit + sidebar（与 MCP 并存）
- **跨项目 preset registry**——社区贡献主题，一键加载

## 参与贡献

欢迎 issue 和 PR。任何变更都要保持 `seed → 派生 → CSS 变量 → 组件 className` 这条管线完整。泥浆会被打回。

## License

MIT.
