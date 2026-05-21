# Design-anchor Product Architecture

This document provides an end-to-end overview of **Design-anchor (design-anchor)**: the product flow, data and governance pipelines, and technical rationale.

---

## 1. Product Positioning

**One-liner**: A local pipeline that turns design tokens + component specs + business-level headless wrappers into versionable assets, and through **generated rules + audit + AI tool integration**, ensures AI-written code uses the component library in a compliant manner.

**Key Personas**

| Persona | Typical Need | Product Entry Point |
|---------|-------------|-------------------|
| Designer | Adjust themes, review components, browse Carbon Patterns index, maintain component intent/AI semantics/style locks | Storybook Portal (DesignToken, Patterns, component preview + Design-anchor panel) |
| Frontend / Engineering | Reference Business components in app repo, CI-auditable | `npm` dependency, `anchor sync` / `anchor audit`, `.cursorrules` |
| AI (Cursor / Claude Code / etc.) | Know what to use and what's forbidden | `.cursor/rules/*.mdc`, `CLAUDE.md`, `.windsurfrules`, MCP tools, runtime `styleLock` |

---

## 2. Core Flows (End-to-End)

### 2.1 Setting Up Design-anchor in a Project (Consumer Perspective)

1. Run `anchor start` (or `anchor init` + `npm install` + `anchor dev`) at the **project root**.
2. The tool creates:
   - **`.anchor/`** (hidden directory): Complete component library sub-project — Storybook, shadcn-based starter, Business wrappers, `src/anchor/schema`, `scripts`, generated Tailwind fragments.
   - **`.cursor/`**: `rules` (always-apply constraints), `mcp.json` (Design-anchor MCP), optional `hooks` (post-save audit).
   - **`CLAUDE.md`**, **`.windsurfrules`**, **`.github/copilot-instructions.md`**: Governance rules for other AI tools.
3. Designers open the Portal in browser (Storybook launched by `anchor dev`), edit DesignToken, use the **Design-anchor** panel to edit the `*.spec.json` associated with the current Story and save.
4. Save triggers **sync**: updates `.cursorrules`, Tailwind generated files, rules mirror; optionally triggers **audit** with results displayed.
5. Engineers write business code in the **project's own `src/`**; AI is constrained by rules and MCP; the recommended `@design` alias points to `.anchor`'s barrel (see `ANCHOR_INTEGRATION.md` and `ANCHOR_BOUNDARIES.md`).

**Directory Conventions (By Design)**

- **`.anchor/`**: Component library and design assets only — NOT the business application root.
- **`.cursor/`** + tool configs: Editor and Agent governance config (dotfile style, doesn't pollute app source tree naming).
- **Business code**: Stays in the project's original `src/` (or other established directories); `anchor init` generates **`ANCHOR_BOUNDARIES.md`** and **`ANCHOR_INTEGRATION.md`** at project root as one-page guides.

### 2.2 Spec-Driven Governance (Schema → Rules → Code)

1. **Single source of truth**: `ComponentSpec` stored as JSON in `.anchor/src/anchor/schema/components/*.spec.json`.
2. **Human-readable + machine-readable**: The same spec participates in:
   - Storybook Design-anchor panel form editing;
   - `scripts/sync-from-schema.mjs` aggregates to generate root `.cursorrules`, `tailwind.anchor.generated.ts`, `src/anchor/rules/ANCHOR_RULES.md`;
   - `scripts/anchor-audit.mjs` reads forbidden tags for AST-level scanning.
3. **Runtime fallback**: Business components use `tailwind-merge` + `stripLockedClasses` (`styleLock.blacklist`) to prevent AI/app code from overriding critical styles via `className`.

### 2.3 Pattern Reference (IBM Carbon Documentation Index)

To fill the gap between atomic components and composition/flow guidance, this repo provides an **IBM Carbon Design System — Universal Patterns** official deep-link index (no mirrored content, avoiding copyright and sync costs):

- Docs and update instructions: `docs/patterns/README.md`
- Readable table: `docs/patterns/carbon-design-system.md`
- Machine-readable list: `src/anchor/patterns/carbon-universal-patterns.json`
- Optional Cursor rule: `.cursor/rules/anchor-carbon-pattern-index.mdc` (`alwaysApply: false`, included in conversations on demand)

**Relationship to component specs**: `*.spec.json` remains the sole source of truth for Design-anchor **Business components**; Carbon Patterns serve as industry **composition and flow** references — implementations still use this repo's business components and generated rules.

---

## 3. Pipeline Diagram (Data & Control Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Designer / Engineer (local)                                             │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     HTTP API      ┌──────────────────────────┐
│ Storybook       │ ───────────────►  │ vite-plugin-schema-api   │
│ Manager UI      │   /api/schemas    │ (Vite middleware)         │
│ Design-anchor Panel   │   save-schema…    │ Reads/writes disk + sync │
└─────────────────┘                   └──────────────────────────┘
         │                                        │
         │ Preview / Controls                      │ npm run sync:anchor
         ▼                                        ▼
┌─────────────────┐                   ┌──────────────────────────┐
│ Storybook       │                   │ .anchor/.cursorrules     │
│ Preview (iframe)│                   │ tailwind.anchor.*        │
└─────────────────┘                   │ ANCHOR_RULES.md          │
         │                             └──────────────────────────┘
         │                                        │
         │                                        │ AI tool reads
         ▼                                        ▼
┌─────────────────┐                   ┌──────────────────────────┐
│ Component TSX   │ ◄── import ──────  │ AI Agent + MCP           │
│ starter/        │                   │ list/read/update schema │
│ business/       │                   │ audit / sync_rules / …    │
└─────────────────┘                   └──────────────────────────┘
         │
         │ PR / local commit
         ▼
┌─────────────────┐
│ anchor audit   │──► Forbidden raw tags, arbitrary Tailwind (configurable exclusions)
└─────────────────┘
```

**CLI & MCP Dual Channels**

- **CLI** (`bin/anchor.mjs`): `init`, `start`, `dev`, `sync`, `audit`, `mcp` — for scripts, CI, local one-click.
- **MCP** (`bin/anchor-mcp.mjs`): stdio JSON-RPC, exposes the same capabilities to AI Agents, path parameter points to **`.anchor` root** (default).

---

## 4. Technical Rationale

### 4.1 Why Storybook as the Portal Shell

- **Mature capabilities**: iframe preview, MDX/CSF, Controls, hot reload — reduces cost of building a custom component showcase.
- **Product tradeoff**: Manager UI is heavily customized (sidebar, theme, Design-anchor panel), but we do **not** ship a standalone `design-portal` into consumer `init` scaffolds, avoiding the perception of "stuffing another Schema product" into projects.

### 4.2 Why Specs Use JSON + TypeScript Dual Track

- **JSON**: Directly readable/writable by Portal/API/MCP, diff-friendly, designers can participate in field semantics (with UI assistance).
- **types.ts**: `ComponentSpec` types ensure script and runtime merge logic stays consistent, preventing doc-implementation drift.

### 4.3 Why the Business Layer Exists

- Starter (shadcn) provides **generic atoms**; business needs **semantic props** (e.g., `density`) + **forbidden arbitrary spacing/brand color overrides**.
- **Same schema** generates both `.cursorrules` text AND drives **runtime** `mergeWithBusinessSpec` / `createBusinessComponent`, forming a "documentation constraint + code fallback" dual layer.

### 4.4 Why the Hidden `.anchor` Directory

- The component library must be a **standalone npm subtree** (its own `package.json`, `node_modules`, Storybook) — cannot be implemented as pure dotfiles.
- Using **`.anchor/`** alongside **`.cursor/`** satisfies the product requirement of "affect the project via dotfiles as much as possible, no explicit `anchor-ui` folders", while maintaining engineering feasibility.

### 4.5 Audit vs. Rules Relationship

- **`.cursorrules`**: A "collaboration contract" relying on the model to comply; broad coverage (includes styleLock text descriptions).
- **`anchor-audit`**: Executable, CI-compatible; current implementation focuses on **forbidden raw tags** + **arbitrary-value Tailwind in className strings**; not 1:1 with styleLock regex — a known boundary, extensible later.

### 4.6 AI Tool Integration Layers

1. **`.cursor/rules/*.mdc`** + **`CLAUDE.md`** + **`.windsurfrules`** + **`.github/copilot-instructions.md`**: Always-apply constraints and self-check lists for all AI tools.
2. **`mcp.json`**: Agent-callable tools (read/update spec, tokens, run audit, etc.).
3. **Hooks (optional)**: `afterFileEdit` runs audit on related `.tsx` files, injecting failures into conversation for shorter feedback loops.

---

## 5. Key Module Index (In-Repo)

| Module | Path | Responsibility |
|--------|------|---------------|
| CLI | `bin/anchor.mjs` | init/start/dev/sync/audit/mcp orchestration |
| MCP | `bin/anchor-mcp.mjs` | AI tool integration |
| Storybook Manager | `.storybook/manager.tsx` | Theme, sidebar, DesignToken entry, Design-anchor panel |
| Storybook Preview | `.storybook/preview.tsx` | Global styles and parameters |
| Vite Plugin | `vite-plugin-schema-api.mjs` | Schema / Token HTTP API |
| Spec Types | `src/anchor/schema/types.ts` | `ComponentSpec` etc. |
| Spec JSON | `src/anchor/schema/components/*.spec.json` | Per-component source of truth |
| Sync Script | `scripts/sync-from-schema.mjs` | Generate `.cursorrules`, Tailwind fragments, rules MD |
| Audit | `scripts/anchor-audit.mjs` | AST scanning |
| Business Wrappers | `src/components/business/*`, `business-wrapper.tsx`, `business-style.ts` | styleLock merging |
| Design Tokens | `src/design-tokens/*` | tokens.json + editor page |

---

## 6. Extension & Evolution Suggestions

- **New components**: Add `*.spec.json` → registry → Business wrapper → stories; run `sync:anchor`.
- **Stronger compliance**: Align audit with `styleLock.blacklist`, structured audit JSON output, CI templates.
- **Optional standalone portal**: Keep `src/design-portal` only in the Design-anchor **product repo**, not in consumer `init`.

---

## 7. Known Boundaries (Honest Disclosure)

- AI will **not** mathematically "100% comply" with rules on every request; requires **rules + runtime stripping + audit + CI** combined.
- The component library physically requires a **`.anchor/`** directory; cannot achieve Storybook/npm ecosystem functionality with source-free dotfiles alone.
- MCP/rules paths must match the actual **`.anchor` location** to avoid reading wrong `.cursorrules`.

---

*Document version: aligned with current repo implementation. If commands or default paths change, defer to `anchor help` and `bin/anchor.mjs`.*
