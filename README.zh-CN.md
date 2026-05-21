<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Copilot%20%7C%20Claude-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>协议即设计</strong></p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## 问题：AI 写出漂亮的 UI —— 但只有第一次

AI 编码工具生成 UI 很快。但随着时间推移，你的产品会逐渐陷入视觉混乱：

- **同一个按钮**在 3 个页面上出现了 3 种不同的圆角
- **同一个"灰色"**在一处是 `gray-100`，另一处是 `gray-200`，第三处是 `#e5e7eb`
- **同一个间距**这里是 `p-4`，那里是 `p-[15px]`，别处又是 `py-3.5`

这不是偶发错误——这是 **AI 编码的系统性失败模式**。每一次新对话、每一个新 prompt，AI 都会丢失之前做过什么的上下文。漂移不断累积。经过几周的 AI 辅助开发，你的企业级产品看起来像是 10 个不同的团队写的。

### 为什么现有方案不够

| 方案 | 为什么失效 |
|------|-----------|
| **原子组件库**（shadcn、Radix 等） | 没有语义指引。AI 不知道*什么时候*该用哪个组件、*怎么*保持样式一致。它依然会写任意值。 |
| **design.md / 系统 prompt** | 软约束。适合一次性生成——"做成 Airbnb 风格"。但到第 50 次修改时，AI 早已忘记。没有执行力，没有审计，没有管线。 |
| **人工代码审查** | 无法规模化。你雇 AI 是为了快——现在却要 review 间距值？ |

### Design-anchor 的不同之处

Design-anchor 是一条**治理管线**，让设计漂移在结构上变得不可能：

```
Design Prompt → 提取 Seed Token → 映射到 100+ 语义 Token
     → 修改基础组件库样式 → 通过 spec.json 锁定样式
     → 自动审计每次 AI 编辑 → 通过 IDE 规则强制执行
```

**一次配置之后**，后续每一次 AI 生成都被约束在你的设计系统内。同一个按钮永远是同一个圆角。同一个间距永远用同一套刻度。不是因为 AI "记住了"——而是因为它物理上无法偏离。

> **design.md 告诉 AI "请保持一致"。Design-anchor 告诉 AI "你只能用这些确切的值，改完我还会检查"。**

这就是 design.md 缺失的执行层——在 **B 端 / 企业级产品**中最为有效，因为视觉一致性直接影响信任度和可用性。

---

## 核心特性

| | 特性 | 说明 |
|---|---|---|
| **1** | 协议驱动 | spec.json 是唯一数据源。组件行为、样式约束、AI 提示词全部从协议派生 |
| **2** | 一条命令流水线 | `npx anchor start` — 从零到组件库 + Storybook + AI 规则，一条命令搞定 |
| **3** | 内置 AI 治理 | 自动生成 Cursor、Claude Code、Windsurf、Copilot 等所有 AI 工具的规则 |
| **4** | Token 管线 | 10 个 seed 值 → 175+ CSS 变量 → Tailwind v4 `@theme` 映射 |
| **5** | 组件即合规 | 每个组件自带审计规则，`anchor audit` 一键检测违规 |
| **6** | 治理模式 | `anchor govern` — 零侵入治理，仅注入规则文件，适配已有项目 |

---

## 面向人群

**使用 AI 构建产品的团队** — 你需要在管线层面强制保证设计一致性，而不是在代码审查中逐个检查。

**AI 原生开发者** — 每天使用 Cursor / Copilot / Claude Code 编码。你需要 AI 输出遵守统一的设计语言，而不是每次会话都各写各的。

**没有专职设计师的创业团队** — 没有全职设计师，但你的企业级产品需要看起来像一个人设计的。用协议替代人工审查。

---

## 快速开始

```bash
# 1. 安装
npm install design-anchor

# 2. 初始化 + 启动
npx anchor start

# 3. 完成 — Storybook 门户打开，所有 AI 工具的规则已配置
```

执行 `anchor start` 后：
- `.anchor/` — 组件库 + Storybook + Token 系统
- `.cursor/rules/` — AI 编码治理规则（自动生效）
- `CLAUDE.md` — Claude Code 治理规则 + 工作流
- `.windsurfrules` — Windsurf 治理规则
- `.github/copilot-instructions.md` — GitHub Copilot 指令
- `AGENTS.md` — AI 编码边界契约

---

## CLI 命令

```
anchor start [dir]     一键启动（init + install + 打开 Portal）
anchor init  [dir]     初始化组件库
anchor govern          治理模式：仅注入 AI 规则，不拷贝组件（适合已有项目）
anchor theme <file>    从 Design Prompt 文件提取 Token
anchor dev   [dir]     启动 Storybook Portal
anchor sync  [dir]     从 spec.json 重新生成规则 + Tailwind 配置
anchor audit [dir]     运行合规审计
anchor upgrade [dir]   升级 kit（保留你的修改）
anchor mcp   [dir]     启动 MCP Server（Cursor Agent 集成）
```

---

## 流水线原理

```
spec.json（设计协议）
    │
    ├──► 组件（23 个生产就绪，Radix + CVA）
    ├──► Token CSS（175+ 变量，明暗模式）
    ├──► Tailwind v4 @theme（工具类）
    ├──► AI 规则（Cursor + Claude Code + Windsurf + Copilot）
    ├──► MCP Server（实时 AI 上下文）
    └──► anchor audit（合规检查）
```

一个数据源，多路输出，零漂移。

---

## 为什么不只用 design.md？

| | design.md | Design-anchor |
|---|---|---|
| **本质** | 写给 AI 看的自然语言文档，"试着遵守" | 机器可执行的 JSON 协议 + 自动化管道 |
| **执行力** | AI "建议"遵守——到第 50 次编辑时经常忽略 | `anchor audit` 强制检测违规 |
| **组件** | 描述"应该有 Button" | 直接提供 Button 源码 + 规范 + 导入路径 + 样式锁 |
| **维护** | 手动更新，容易过时 | `anchor sync` 从 spec.json 自动重新生成 |
| **场景路由** | "请用我们的组件"（AI 不知道有哪些） | 场景→组件查找表——AI 写代码前直接查表 |
| **验证** | 没有 | `anchor audit` 出合规报告 |
| **Token** | "主色是 #1677ff"（AI 依然会内联写 `#1677ff`） | Seed → 175+ CSS 变量 → Tailwind 映射。改 seed 全局联动。 |
| **多工具** | 手动复制到每个工具的配置里 | 一个 `anchor govern` 为所有 AI 工具生成规则 |

> **design.md 是愿景。Design-anchor 是执行。**
> 两者搭配使用——design.md 定义美学意图，Design-anchor 保证结构合规。

---

## 设计令牌系统

### Seed → Map 管线

Design-anchor 采用受 Ant Design 令牌体系启发的**双层令牌架构**：

```jsonc
// tokens.json — 你只需编辑种子层
{
  "version": 2,
  "seed": {
    "colorPrimary": "#1677ff",    // → 派生 10 级主色阶梯 + 语义别名
    "colorSuccess": "#52c41a",    // → success-bg, success-border, success-text, ...
    "fontSize": 14,               // → 7 级字号梯度令牌
    "borderRadius": 6,            // → xs/sm/md/lg/xl 圆角梯度
    "sizeUnit": 4,                // → spacing-* 间距刻度
    "sizeStep": 4,                // → 与 sizeUnit 配对推导 spacing
    "motionUnit": 0.1             // → fast/mid/slow 动效时长令牌
  },
  "seedDark": {
    "colorBgBase": "#000000",     // → 自动派生暗色模式调色板
    "colorTextBase": "#ffffff"
  },
  "fixedAliases": {
    "opacityDisabled": 0.5,       // → disabled:opacity-disabled
    "fontWeightMedium": 500,      // → font-medium
    "fontWeightSemibold": 600     // → font-semibold
  }
}
```

运行 `npm run sync:tokens` 后生成单一 CSS 文件，包含三个区段：

### Tailwind v4 `@theme` 映射

令牌通过 Tailwind 的 `@theme inline` 指令映射，启用原生工具类：

```css
@theme inline {
  --color-primary: var(--primary);
  --color-destructive: var(--error);
  --radius-sm: var(--border-radius-sm);
  --spacing-sm: 8px;
  --spacing-base: 12px;
  --font-size-sm: 14px;
  --font-weight-medium: 500;
  --animate-duration-fast: var(--motion-duration-fast);
  /* 约 60 个 Tailwind 映射令牌 */
}
```

### 令牌在组件中的使用方式

| 类别 | Tailwind 类名 | 示例 |
|------|-------------|------|
| 颜色 | `bg-primary`、`text-destructive` | `<Button className="bg-primary">` |
| 间距 | `p-sm`、`gap-base`、`mt-xs` | `<Card className="p-lg">` |
| 圆角 | `rounded-md`、`rounded-lg` | `<Badge className="rounded-full">` |
| 排版 | `text-sm`、`font-medium` | `<Label className="text-sm font-medium">` |
| 阴影 | `shadow-sm`、`shadow-md` | `<Card className="shadow-sm">` |
| 动效 | `duration-fast`、`duration-slow` | `<Progress className="duration-slow">` |
| 透明度 | `opacity-disabled`、`opacity-muted` | `<Input className="disabled:opacity-disabled">` |

---

## 组件规范系统

每个组件拥有一份 `.spec.json` 规范文件，作为 AI 编码规则的**唯一真源**：

```jsonc
// src/anchor/schema/components/button.spec.json
{
  "name": "Button",
  "description": "主要操作触发器，支持多种变体与尺寸",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["default", "destructive", "outline", "secondary", "ghost", "link"],
      "default": "default"
    },
    "size": {
      "type": "enum",
      "values": ["default", "sm", "lg", "icon"],
      "default": "default"
    }
  },
  "styleLock": ["font-family", "line-height"],
  "forbiddenPatterns": ["inline color hex", "arbitrary spacing"],
  "aiPrompt": "使用语义化变体名。禁止硬编码颜色或间距。"
}
```

这些规范通过 `anchor sync` 自动同步到 AI 规则文件，确保所有 AI 工具始终拥有最新的组件 API。

---

## 组件列表

Design-anchor 内置 23 个生产就绪的组件，每个组件均配有 `.spec.json` 规范、Storybook 故事和完整的令牌集成：

| 组件 | 核心特性 | 规范文件 |
|------|---------|---------|
| **Alert** | 4 种变体（默认/错误/成功/警告），图标支持 | `alert.spec.json` |
| **Avatar** | 图片 + 回退显示，可配置尺寸 | `avatar.spec.json` |
| **Badge** | 5 种变体，语义化颜色 | `badge.spec.json` |
| **Button** | 6 种变体，4 种尺寸，`asChild` 组合模式 | `button.spec.json` |
| **Card** | Header/Content/Footer 组合结构 | `card.spec.json` |
| **Checkbox** | Radix 原语，无障碍 | `checkbox.spec.json` |
| **Data Table** | 排序、筛选、分页、密度模式 | `data-table.spec.json` |
| **Dialog** | 模态层 + 遮罩，键盘关闭 | `dialog.spec.json` |
| **Dropdown Menu** | 嵌套菜单，键盘导航 | `dropdown-menu.spec.json` |
| **Input** | 多类型，禁用/错误状态 | `input.spec.json` |
| **Label** | 关联禁用样式，语义配对 | `label.spec.json` |
| **Popover** | 浮动内容 + 箭头 | `popover.spec.json` |
| **Progress** | 动画值条，令牌驱动的动效时长 | `progress.spec.json` |
| **Radio Group** | Radix 分组，无障碍 | `radio-group.spec.json` |
| **Scroll Area** | 自定义滚动条主题 | `scroll-area.spec.json` |
| **Select** | 原生选择器 + 令牌样式 | `select.spec.json` |
| **Separator** | 水平/垂直 + 语义间距 | `separator.spec.json` |
| **Skeleton** | 加载占位 + 动画 | `skeleton.spec.json` |
| **Slider** | 范围输入，轨道/滑块主题化 | `slider.spec.json` |
| **Switch** | 切换控件，关联禁用透明度令牌 | `switch.spec.json` |
| **Table** | 完整表格组合，粘性表头 | – |
| **Tabs** | List/Trigger/Content + 激活态 | `tabs.spec.json` |
| **Textarea** | 最小高度令牌，禁用态透明度 | `textarea.spec.json` |
| **Tooltip** | 延迟动画 + 动效令牌 | `tooltip.spec.json` |

---

## 多工具 AI 治理

Design-anchor 为**所有主流 AI 编码工具**生成治理文件——不仅是 Cursor：

| 工具 | 配置文件 | 自动化 |
|------|---------|--------|
| Cursor | `.cursor/rules/*.mdc` + `.cursor/hooks.json` | 保存文件后自动运行 `anchor audit` |
| Claude Code | `CLAUDE.md` | 内联工作流指令 |
| Windsurf | `.windsurfrules` | 内联治理规则 |
| GitHub Copilot | `.github/copilot-instructions.md` | 内联治理规则 |
| 通用（Cline、Continue、Aider） | `.cursorrules` + `AGENTS.md` | 读取项目根目录规则文件 |

一条命令（`anchor govern` 或 `anchor init`）同时配置所有工具。

---

## MCP 集成

Design-anchor 内置 [Model Context Protocol](https://modelcontextprotocol.io/) 服务，实现深度 AI 集成：

```bash
npx anchor mcp
```

MCP 服务暴露：
- **组件规范** — 每个组件的完整 Schema 数据
- **令牌注册表** — 所有派生令牌的值与分类
- **审计结果** — 实时合规状态

---

## 架构总览

```
tokens.json（种子层）
    │
    ▼
emit-design-tokens-css.mjs ──► design-tokens.generated.css
    │                              ├── @theme inline { ... }    ← Tailwind 工具类
    │                              ├── :root { ... }            ← CSS 变量
    │                              └── .dark { ... }            ← 暗色覆盖
    ▼
*.spec.json（23 个组件规范）
    │
    ├──► sync-from-schema ──► .cursorrules + CLAUDE.md + .windsurfrules（AI 规则）
    ├──► anchor-audit ──► 合规报告
    └──► Storybook Portal ──► 可视化编辑 + 控件
```

### 令牌流转：一跳到位，零漂移

```
tokens.json ──(sync:tokens)──► design-tokens.generated.css ──► Tailwind v4 + 组件
     │                                                              │
     └── 单文件，三段式：                                              │
         @theme（Tailwind 映射）                                     │
         :root （非 Tailwind 变量）                                  │
         .dark （暗色覆盖）                                          │
                                                                    ▼
                                                          AI 读取治理规则
                                                         （从规范自动生成）
```

---

## 技术栈

| 层级 | 技术方案 |
|------|---------|
| 组件 | [Radix UI](https://www.radix-ui.com/) 原语 + [CVA](https://cva.style/) 变体 |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com/) + `@theme inline` 令牌映射 |
| 令牌引擎 | Ant Design 算法（[`@ant-design/colors`](https://github.com/ant-design/ant-design-colors)） |
| 构建 | [Vite 6](https://vite.dev/) + 自定义 Schema API 插件 |
| Storybook | [Storybook 8](https://storybook.js.org/) + React + Vite |
| 色彩科学 | [OKLCH](https://oklch.com/) 感知色彩空间，使用 [Culori](https://culorijs.org/) |
| 类型安全 | [TypeScript 5](https://www.typescriptlang.org/) 严格模式 |
| AI 协议 | [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) |

---

## 升级策略

Design-anchor 的设计理念类似 [shadcn/ui](https://ui.shadcn.com/) —— 组件代码落在**你的代码库**中，而非隐藏在 `node_modules` 里：

```bash
# 首次安装
npm install design-anchor
npx anchor init

# 后续升级：自动添加新组件，保留你的修改
npm update design-anchor
npx anchor upgrade
```

升级系统使用**内容哈希**来检测修改：
- **未修改的组件** → 用最新版本覆盖
- **已修改的组件** → 保留不动，在 Storybook 侧边栏标记状态
- **新增组件** → 自动添加

---

## 参与贡献

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing`）
3. 运行类型检查（`npm run typecheck`）
4. 运行令牌同步（`npm run sync:tokens`）
5. 运行合规审计（`npm run anchor:audit`）
6. 提交你的改动
7. 推送分支并创建 Pull Request

---

## 许可证

[MIT](LICENSE) &copy; 2026 [Gusgoooo](https://github.com/Gusgoooo)

## 联系方式

欢迎共建 / 讨论：[q623814363@gmail.com](mailto:q623814363@gmail.com)

## 链接

- GitHub: [https://github.com/Gusgoooo/Design-anchor](https://github.com/Gusgoooo/Design-anchor)

---

<p align="center"><em>协议即设计 — 用协议定义设计，让流水线保障执行。</em></p>
