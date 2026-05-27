# Design-anchor 文档

Design-anchor 是一套面向长期 React + Tailwind 产品的 AI 原生设计系统治理管线。

它把推荐默认组件库、tokens、component specs、AI 规则文件、MCP 工具、Portal 可视化维护和可执行 audit 检查串成闭环，让团队在使用 AI 提速的同时，不丢掉产品的一致性。

## 推荐阅读顺序

| 文档 | 适合什么时候看 |
|---|---|
| [产品采用指南](./PRODUCT_ADOPTION_GUIDE.zh-CN.md) | 需要讲清产品价值、目标用户、B 端场景、落地路径和采用 ROI。 |
| [Product Architecture](./PRODUCT_ARCHITECTURE.md) | 需要理解技术架构：Portal、tokens、schema、MCP、sync、audit。 |
| [Token Contract](./TOKEN_CONTRACT.md) | 需要固化 seed 到组件的可执行协议，为后续治理增强打基础。 |
| [Directory Boundaries](./BOUNDARIES.md) | 接入到业务项目时，需要确认 app 代码、UI 代码和 AI 配置分别放哪里。 |
| [Design-anchor vs. Centralized DSM-ForAI](./ANCHOR_VS_DONE_DSM_ONEPAGER.md) | 需要对比本地 repo 级治理与中心化设计系统/MCP 平台。 |
| [项目审查与汇报材料](./PROJECT_REVIEW_REPORT_2026-05-25.md) | 需要查看当前项目卖点、风险、架构审查和优化状态。 |
| [Progress](./PROGRESS.md) | 需要查看实现历史和后续工程计划。 |

English docs: [docs/README.md](./README.md).

## 核心表达

传统 UI kit 回答的是：“我该用哪个组件？”

Design-anchor 回答的是更长期的问题：“当很多人和很多 AI agent 持续修改产品时，我们怎么让默认组件体系和整个产品仍然像一个系统？”

答案是一条治理闭环：

```
设计意图
  -> token seeds
  -> 派生 CSS 变量
  -> 组件 spec
  -> AI 可读规则
  -> MCP 工具
  -> anchor audit
  -> CI 反馈
```

## 最适合的产品类型

Design-anchor 特别适合：

- B 端 SaaS：有大量 dashboard、表单、表格、筛选、设置、报表等高频界面。
- 企业内部平台：产品生命周期长，参与维护的人多。
- 企业级前端：一致性、可审计、可控变更比一次性视觉发挥更重要。
- AI 辅助开发团队：希望使用 Cursor、Claude Code、Copilot、Qoder 等工具，但不接受 UI 漂移。
- 旧 React + Tailwind 项目：希望渐进式接入治理，而不是一次性重写。

## 产品演示时应该强调什么

1. 先讲问题：AI 能很快写出 UI，但会忘记项目上下文。
2. 展示 token 编辑：改一个 seed，整个产品实时换肤。
3. 展示组件 spec：每个组件都有机器可读的契约。
4. 展示 AI 规则和 MCP：agent 读取同一份真源，不靠猜。
5. 展示 `anchor audit`：漂移由可执行检查拦截，而不是靠文档提醒。
6. 收束到 B 端故事：长期产品需要的是可持续一致，而不是一次性好看。
