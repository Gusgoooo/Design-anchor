# One-Pager: Design-anchor vs. Centralized DSM-ForAI

> **Purpose**: Align differences and complementary aspects of two approaches for review, external communication, or internal tech selection. **Design-anchor** = this repo's `design-anchor` approach. **Centralized DSM-ForAI** = a "theme / base components / business components" three-layer model converging into a **central AI MCP service**.

---

## 1. One-Liner

| | **Centralized DSM-ForAI** | **Design-anchor** |
|---|-------------------------|-------------------|
| **Core** | Adds an **AI-ready layer** (descriptions, multi-format, external links) on top of existing DSM, **converging into a central MCP service** serving company-wide systems. | Makes **Token + component spec + sync & audit** into **versionable assets inside the business repo**, ensuring AI uses components **compliantly in the current project**. |
| **MCP** | The product's **integration endpoint** (central AI MCP service). | An **optional enhancement** (e.g., `anchor mcp`), primarily serving the local **AI Agent** — not a required central hub. |

---

## 2. Layer Mapping

| Layer | **Centralized (gray=existing, green=AI additions)** | **Design-anchor** |
|----|-------------------------------|-------------------|
| **Theme** | Theme packages + **AI-facing descriptions** (JSON / Markdown). | **Design Token** is the source of truth, generates CSS / rules; designers edit in Portal. No separate "theme package + AI description layer" dual track. |
| **Base Components** | Multi-source (Ant Design / ShadCN / Element). | **Single tech stack** (e.g., shadcn) wrapped into **Business components**; multi-library integration is not the current narrative. |
| **Business Components** | NPM packages + dev docs + **batch external links** (GitHub, code repos, docs) into MCP. | **`*.spec.json` + `storyDesignAnchor`** (per-story variant) on disk, same source for `.cursorrules`, audit, runtime styleLock; external links use **Carbon Patterns index** approach (link to official docs, don't mirror content). |

---

## 3. Granularity, Data & Engineering

| Dimension | **Centralized DSM-ForAI** | **Design-anchor** |
|------|--------------------|--------------------|
| **Data location** | Platform/service-side aggregation, consumed by MCP. | **In the Git repo** (`.anchor/`, root-level generated files), aligned with PRs and code review. |
| **Spec granularity** | Asset catalog + descriptions + links. | **Story-variant-level** anchor overrides; spec participates in **sync, Tailwind fragments, static audit**. |
| **Collaboration loop** | Developers maintain DSM on platform → MCP consumes. | Designers save via **Storybook panel** → Engineers run **`anchor sync` / `audit`** → AI reads **`.cursorrules`** + `CLAUDE.md` + `.windsurfrules`. |

---

## 4. Relationship (Suggested Framing)

- **Not a replacement**: Central DSM + MCP solves **cross-team, cross-repo unified context**; Design-anchor solves **in-repo "spec → rules → code" engineering closure**.
- **Composable**: Design-anchor can serve as the **repo-level implementation**; if business component docs/links later connect to a company MCP, it can **reference the same spec or doc URL**, running alongside Design-anchor's local approach.

---

## 5. Selection Guidance (One Line Each)

- **Closer to Centralized**: Need **enterprise-level catalog, multi-source batch integration, unified AI service entry point**.
- **Closer to Design-anchor**: Need **strong Git binding, variant-level specs, generated rules + CI audit + deep AI tool integration**.

---

*Document version: aligned with `PRODUCT_ARCHITECTURE.md` Design-anchor positioning. If the other product's naming or layers change, just replace the "Centralized DSM-ForAI" column text.*
