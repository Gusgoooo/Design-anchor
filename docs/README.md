# Design-anchor Docs

Design-anchor is an AI-native design-system governance pipeline for long-lived React + Tailwind products.

It combines tokens, component specs, generated AI rules, MCP tools, Portal editing, and executable audit checks so teams can let humans and AI agents ship UI faster without losing product consistency.

## Recommended Reading Order

| Document | Use it when |
|---|---|
| [Product Adoption Guide](./PRODUCT_ADOPTION_GUIDE.md) | You need to explain the product value, target users, B2B use cases, rollout plan, and adoption ROI. |
| [Product Architecture](./PRODUCT_ARCHITECTURE.md) | You need to understand the technical architecture: Portal, tokens, schema, MCP, sync, and audit. |
| [Directory Boundaries](./BOUNDARIES.md) | You are integrating Design-anchor into an app and need to know where app code, UI code, and AI config belong. |
| [Design-anchor vs. Centralized DSM-ForAI](./ANCHOR_VS_DONE_DSM_ONEPAGER.md) | You are comparing local repo-level governance with centralized design-system/MCP platforms. |
| [Project Review Report](./PROJECT_REVIEW_REPORT_2026-05-25.md) | You want the latest project review, product selling points, risks, and optimization status. |
| [Progress](./PROGRESS.md) | You need implementation history and remaining engineering plan. |

Chinese docs: [docs/README.zh-CN.md](./README.zh-CN.md).

## Core Message

Traditional UI kits answer: "Which component should I use?"

Design-anchor answers a larger question: "How do we keep the whole product coherent when many people and AI agents keep changing it over years?"

The answer is a governed loop:

```
Design intent
  -> token seeds
  -> derived CSS variables
  -> component specs
  -> generated AI rules
  -> MCP tools
  -> anchor audit
  -> CI feedback
```

## Best-Fit Products

Design-anchor is especially strong for:

- B2B SaaS products with dense workflows, forms, tables, settings, dashboards, and reports.
- Internal platforms maintained by many contributors over a long period.
- Enterprise frontends where consistency, auditability, and controlled change matter.
- AI-assisted engineering teams that want to use Cursor, Claude Code, Copilot, Qoder, or similar tools without accepting visual drift.
- Legacy React + Tailwind apps that need incremental governance instead of a full rewrite.

## What To Emphasize In Product Demos

1. Start with the problem: AI can ship UI quickly, but it forgets project context.
2. Show token editing: change one seed and watch the product re-skin.
3. Show component specs: every component has a machine-readable contract.
4. Show AI rules and MCP: agents can read the same truth instead of guessing.
5. Show `anchor audit`: drift is blocked by executable checks, not just documentation.
6. Finish with the B2B story: long-lived products need durable consistency more than one-off visual novelty.
