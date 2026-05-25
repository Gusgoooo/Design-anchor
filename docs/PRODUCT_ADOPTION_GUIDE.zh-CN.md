# 产品采用指南

Design-anchor 面向这样的团队：想用 AI 提升前端交付速度，但不想把设计漂移当作速度的代价。

它不只是一个组件库，而是一条本地治理管线：把产品设计意图变成 AI 工具能读取、CI 能执行检查的工程资产。

## 1. 产品定位

### 一句话

Design-anchor 用 tokens、组件契约、AI 可读规则、MCP 工具和 audit 检查给产品 UI 下锚，让长期 React + Tailwind 产品在使用 AI 提速的同时保持一致。

### 简短 pitch

AI 编码工具很擅长生成页面。真正难的是：几个月之后，多个贡献者、多个 AI session、多个工具持续修改同一个产品时，每个页面是否仍然属于同一套产品系统。

Design-anchor 的解决方式是把设计规则变成可执行管线：

- Tokens 定义视觉语言。
- Component specs 定义组件用法。
- Portal 让系统可视化、可编辑。
- 生成的规则文件告诉 AI agent 该怎么写。
- MCP 让 agent 结构化读取真源。
- `anchor audit` 在本地和 CI 拦截漂移。

### 它属于什么产品类别

Design-anchor 介于四类常见工具之间：

| 既有类别 | 通常解决什么 | Design-anchor 增加什么 |
|---|---|---|
| UI kit | 提供可复用组件 | 治理人和 AI 如何使用组件。 |
| Design tokens | 共享视觉值 | seed-to-derived 管线、Portal 可视化编辑、Tailwind v4 映射和 audit 执行。 |
| 设计系统文档 | 给人读的指南 | 机器可读的 `spec.json`、AI 规则文件、MCP 工具和 CI 检查。 |
| AI 编码规则 | prompt 层面的提醒 | 项目本地真源 + 可执行验证。 |

核心判断：AI 时代的设计系统需要同时 **给人读、给 agent 调用、给 CI 执行**。

## 2. 为什么长期 B 端产品需要它

B 端和企业产品通常不是靠一张 hero 页面取胜，而是靠每天工作的体验取胜：

- 用户能不能快速扫描密集数据？
- 表单、表格、筛选、弹窗、设置页是否行为一致？
- 团队能不能持续加功能，而不是每个 sprint 都多一种视觉方言？
- 品牌升级、密度调整、暗色模式能不能低成本落地？
- 在企业级或合规场景里，AI 生成的代码能不能被信任？

这些产品会不断积累界面面积，也会不断积累团队、外包、实验、迁移和 AI 工具。没有治理，UI 会慢慢碎掉。

Design-anchor 的价值在于把一致性变成基础设施：

| B 端压力 | Design-anchor 的回应 |
|---|---|
| 重复模式很多 | 60+ base 组件 + specs 让原语保持一致。 |
| 路线图频繁变化 | AI agent 可以更快生成，同时读取组件规则。 |
| 生命周期长 | Tokens 和 specs 跟随仓库版本化。 |
| 品牌和主题更新 | 改 seed 派生 token，组件统一换肤。 |
| 合规和评审要求 | `anchor audit` 输出具体 file/line 诊断。 |
| 多个 AI 工具并存 | Cursor、Claude Code、Copilot、Qoder 和 MCP 工具读取同一套规则。 |

## 3. 谁应该采用

### 产品和工程负责人

当 AI 让前端速度变快，但 UI 一致性和 review 质量开始变难控制时，就应该引入 Design-anchor。

业务价值很直接：

- 更少设计回归。
- 新成员上手更快。
- Code review 不再反复纠正同类 UI 问题。
- AI 采用更安全，因为规则可执行。
- 设计升级和长期维护成本更低。

### 设计系统团队

当你已经有 tokens 或组件，但 AI 工具无法稳定遵守它们时，可以用 Design-anchor 把系统“运营起来”：

- Specs 作为规则和 audit 的真源。
- Tokens 在 Portal 中可编辑，并映射到 Tailwind。
- AI 通过 MCP 查询系统，而不是靠上下文记忆。

### 前端团队

如果工程师经常对 agent 重复说“用我们的 Button”“不要硬编码这个颜色”“对齐现有页面”，Design-anchor 可以把这些提醒迁移到生成文件和可执行检查里。

### 已有产品

Design-anchor 不要求一次性重写。团队可以这样开始：

1. 用 `anchor govern` 先注入 AI 规则和 audit。
2. 用 `anchor start` 添加 Portal 和组件工作台。
3. 先对齐品牌色、圆角、间距、字体等 token。
4. 逐步迁移到 `@design` import。
5. 第一个范围稳定后，再把 audit 接入 CI。

## 4. 产品能力

### 4.1 Token Customizer

Portal 暴露一组很小的 seed 编辑面：主色、语义色、基础背景/文字、字号、圆角、间距单位、图表色。

Design-anchor 从这些 seeds 派生出 200+ CSS 变量。这样团队既拥有足够完整的 token map，又不会让编辑入口变得难以理解。

为什么重要：

- 设计师可以调整产品主题，而不是逐个组件改。
- 工程师可以在 Git 里 review token diff。
- AI agent 可以更新已知 token id，而不是凭空发明色值。

### 4.2 Component Specs

每个组件都可以有一份 `spec.json` 契约，描述：

- 组件意图。
- 允许的 props 和 variants。
- 禁止使用的原生标签。
- Baseline token classes。
- Style-lock 规则和 blacklist 模式。
- 给 AI 解释正确用法的 prompt 片段。

这是连接设计语言和机器行为的桥。同一份 spec 可以在 Portal 里编辑，可以同步进 AI 规则文件，也可以被 audit 消费。

### 4.3 AI 规则生成

Design-anchor 会为多个工具生成项目本地指令：

- Cursor rules。
- Claude Code instructions。
- GitHub Copilot instructions。
- 通用 `AGENTS.md`。
- MCP 配置。
- 可选 hooks。

价值在于跨工具一致。团队在 Cursor 和 Claude Code 之间切换时，不需要重新写一遍系统 prompt。

### 4.4 MCP Server

MCP server 给 agent 暴露结构化工具：

- 列出和读取组件。
- 列出和更新 tokens。
- 读取和更新 schemas。
- 运行 audit。
- 运行 sync。
- 读取生成规则。

这让 AI 从“猜 README 的意思”变成“查询本地设计系统”。

### 4.5 Audit 与治理

`anchor audit` 会检查：

- 已有受管组件时仍然使用 raw native tag。
- 在颜色、间距、圆角等 token 敏感前缀上使用 arbitrary Tailwind。
- 来自 spec 的项目特定违规。

这是产品的执行层。它把设计治理从建议变成可重复检查。

## 5. 采用路径

### 路径 A：新项目

适合新 React + Tailwind 产品或新业务模块。

1. 执行 `npx design-anchor start`。
2. 选择默认组件库。
3. 在 Portal 中调 tokens。
4. 在业务代码中使用 `@design` imports。
5. 把 `anchor audit` 加入 pre-commit 或 CI。

结果：项目从第一天就拥有 tokens、组件、AI 规则和治理闭环。

### 路径 B：已有产品

适合已经有大量页面、不能暂停业务迭代的团队。

1. 用 `anchor govern` 先添加 AI 规则。
2. 用 `anchor audit` 以报告方式理解当前漂移。
3. 把已有组件导入或映射到 Portal。
4. 选择一个产品区域开始迁移。
5. 逐步用 `@design` 组件替换散落 UI。
6. 违规可控之后，再按 scope 打开 CI enforcement。

结果：治理渐进落地，不要求一次性重写。

### 路径 C：设计系统团队

适合需要为多个产品团队提供共享 UI 资产的团队。

1. 定义 token seed surface。
2. 注册 base components 和 specs。
3. 把规则文件和 MCP 配置发布到消费仓库。
4. 用 app / kit / portal / all 等 audit profile 管理范围。
5. 把 spec 变更纳入 PR review。

结果：设计系统进入代码和 AI 工作流，不再只是文档。

### 路径 D：AI-heavy 原型团队

适合速度优先，但原型经常演进成正式产品的团队。

1. 从默认 kit 开始。
2. 让 AI 用 `@design` 生成页面。
3. 每轮迭代后运行 audit。
4. 把稳定组件沉淀成 specs。
5. 使用截图参考时，明确 token 更新路径，避免偷偷硬编码。

结果：原型更接近生产质量，后期清理成本更低。

## 6. B 端团队四周落地计划

### 第 1 周：建立基线

- 在产品仓库安装 Design-anchor。
- 跑 audit，记录当前漂移。
- 找出最高频的 UI surface：Button、Input、Select、Dialog、Table、Card、Tabs、Badge、Alert、Form。
- 对齐 `@design` alias 和 AI 规则。

成功信号：AI 工具能发现组件清单，audit 能在本地运行。

### 第 2 周：Token 对齐

- 调整品牌色、surface、文字、圆角、间距、字号 seeds。
- 验证亮色和暗色模式。
- Review 生成的 CSS 变量。
- 明确业务开发允许使用哪些 tokens。

成功信号：品牌或密度调整可以通过 token 完成，而不是手工替换。

### 第 3 周：组件契约

- 收紧高频组件 specs。
- 添加 forbidden tags 和 style-lock 指引。
- 通过生成规则教会 agent。
- 在一个稳定区域把 audit 接入 pre-commit。

成功信号：新的 AI 生成 UI 默认使用受管组件。

### 第 4 周：CI 与扩展

- 把 `anchor audit` 接入 CI。
- 按产品区域扩大迁移范围。
- 用 Portal Govern 视图跟踪违规。
- 把 spec 变更纳入设计系统 PR review。

成功信号：UI 漂移变得可见、可 review、可阻断。

## 7. 建议追踪的指标

先从简单指标开始：

| 指标 | 为什么重要 |
|---|---|
| 每个 PR 的 audit violations | 看漂移是否下降。 |
| Raw native tag 使用量 | 看是否从散落 UI 迁移到受管组件。 |
| Arbitrary Tailwind values | 看 token 纪律是否建立。 |
| `@design` import 覆盖率 | 看组件采用程度。 |
| 纯 token 完成的主题变化 | 看设计升级是否变便宜。 |
| 关于 UI 一致性的 review comments | 看系统是否减少人工 review 负担。 |

## 8. 面向不同角色的话术

### 对管理层

Design-anchor 把设计一致性变成可执行的工程系统，降低 AI 生成前端的长期维护成本。

### 对产品经理

团队可以更快交付页面，同时不积累会拖慢后续迭代的 UI 债务。

### 对设计师

Tokens 和组件意图会变成活的、可编辑的资产，而且 AI agent 和工程师真的会读取它们。

### 对工程师

系统提供明确 import、规则和 audit 诊断，减少 PR 里反复纠正 UI 细节的成本。

### 对 AI 使用者

Agent 能拿到项目本地上下文，并通过 MCP 工具查询系统，而不是猜设计系统想要什么。

## 9. FAQ

### 只适合大公司吗？

不是。小团队往往更依赖 AI、迭代更快，更需要防止早期速度变成未来清理成本。

### 只适合 B 端吗？

不是。任何长期产品都会受益。只是 B 端有密集工作流和重复模式，所以价值最明显。

### 会替代我的设计系统吗？

不一定。它可以作为新项目的设计系统，也可以作为已有设计系统周围的治理层。

### 会替代 Figma 吗？

不会。Figma 仍然是设计画布。Design-anchor 负责让落地后的系统在代码里可执行，并让 AI 工具看得见。

### AI 还会犯错吗？

会。Design-anchor 的前提就是：AI 如果没有本地上下文和可执行反馈，就一定会漂。所以产品同时提供 rules、MCP、specs 和 audit。
