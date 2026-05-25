# Design-anchor Product Architecture

Design-anchor is a local, repo-native governance system for AI-assisted frontend development. It gives a React + Tailwind product a governed design-system loop: tokens, components, specs, generated AI rules, MCP tools, Portal editing, and executable audit.

For product positioning and rollout language, see [Product Adoption Guide](./PRODUCT_ADOPTION_GUIDE.md). Chinese architecture notes are available in [PRODUCT_ARCHITECTURE.zh-CN.md](./PRODUCT_ARCHITECTURE.zh-CN.md).

## 1. Architecture One-Liner

Design-anchor turns a product's UI language into versioned local assets and then exposes those assets to both humans and AI agents.

```
Token seeds
  -> derived CSS variables
  -> component implementations
  -> component spec contracts
  -> generated AI rules
  -> MCP tools
  -> anchor audit
  -> CI feedback
```

The system is intentionally repo-local. The design system sits beside the business application, so changes are reviewable in Git, available to local AI tools, and enforceable in the same CI pipeline as product code.

## 2. Why This Architecture Exists

AI coding tools can generate UI quickly, but long-lived products need more than fast generation:

- Design intent must survive across many sessions and contributors.
- Tokens must be easy to change without editing every screen.
- Components must carry machine-readable usage contracts.
- AI tools must read the same truth as engineers.
- Violations must be caught by code, not only by review comments.

This is especially important for B2B and enterprise products where repeated forms, tables, dashboards, dialogs, and settings pages make inconsistency highly visible.

## 3. Personas And Entry Points

| Persona | Primary need | Design-anchor entry point |
|---|---|---|
| Product designer | Adjust theme, review components, preserve product language | Portal Design Token and Components views |
| Frontend engineer | Import governed components and keep PRs clean | `@design`, `anchor sync`, `anchor audit` |
| Design-system owner | Maintain tokens, specs, and adoption rules | `src/design-tokens`, `src/anchor/schema`, Portal |
| AI agent | Discover components, read rules, update tokens, self-check | Generated rule files and MCP tools |
| Engineering lead | Make governance visible and CI-enforced | Govern view, audit profiles, CI integration |

## 4. Runtime And Repository Layout

In a consuming project, Design-anchor creates a local `.anchor/` subtree and root-level governance files.

```
your-project/
├── app or src/                         business application code
├── .anchor/                            local design-system workspace
│   ├── src/components/base/             React + Tailwind component source
│   ├── src/design-tokens/               tokens.json + seed-to-map pipeline
│   ├── src/anchor/schema/components/    per-component *.spec.json
│   ├── src/anchor-portal/               Vite Portal UI
│   └── scripts/                         sync, token, audit helpers
├── .cursor/rules/anchor.mdc             Cursor project rule
├── .cursor/rules/anchor-selfcheck.mdc   Cursor post-edit checklist
├── .github/copilot-instructions.md      Copilot Chat instructions
├── CLAUDE.md                            Claude Code instructions
├── AGENTS.md                            generic AI coding contract
├── .mcp.json                            MCP config for compatible clients
└── ANCHOR_INTEGRATION.md                import and setup guide
```

In the product repo itself, the same source lives under `src/` and is packaged into the npm template consumed by `npx design-anchor start`.

## 5. Core Modules

| Module | Path | Responsibility |
|---|---|---|
| CLI | `bin/anchor.mjs` | `start`, `init`, `dev`, `sync`, `audit`, `upgrade`, `mcp`, onboarding orchestration |
| MCP server | `bin/anchor-mcp.mjs` | Exposes schema, tokens, files, audit, and sync over stdio JSON-RPC |
| Portal shell | `src/anchor-portal/` | Vite React app for Docs, Design Token, Components, Onboarding, Govern |
| Component source | `src/components/base/` | Governed React + Tailwind components exported through the base barrel |
| Component specs | `src/anchor/schema/components/*.spec.json` | Machine-readable contracts for usage, forbidden tags, primitives, and AI hints |
| Token source | `src/design-tokens/tokens.json` | Seed, dark overrides, custom seeds, and derived-token overrides |
| Token compiler | `src/design-tokens/seed-to-map.mjs` | Converts compact seeds into 200+ semantic CSS variables |
| Sync pipeline | `scripts/sync-from-schema.mjs`, `scripts/emit-design-tokens-css.mjs` | Regenerates rules, CSS variables, and Tailwind extensions |
| Audit | `scripts/anchor-audit.mjs` | AST checks for forbidden tags and arbitrary token-sensitive Tailwind values |
| Consistency check | `scripts/check-anchor-consistency.mjs` | Verifies schema, MCP, and generated contract consistency |
| Dev API | `vite-plugin-schema-api.mjs` | Portal HTTP endpoints for schemas, tokens, import/delete, audit status |

## 6. Data Flow

### 6.1 Token Flow

```
tokens.json
  -> seed-to-map.mjs
  -> design-tokens.generated.css
  -> Tailwind v4 @theme variables
  -> component className utilities
  -> live Portal preview and app UI
```

The important design choice is the compact seed surface. Teams edit a small set of understandable values, while the system derives a much larger semantic map for components, charts, surfaces, text, borders, and states.

### 6.2 Component Spec Flow

```
*.spec.json
  -> Portal spec editor
  -> sync-from-schema.mjs
  -> ANCHOR_RULES.md / Cursor / Claude / Copilot / AGENTS.md
  -> anchor audit
  -> AI self-check and CI feedback
```

Specs are the machine-readable contract. They let one source feed human docs, AI instructions, and executable checks.

### 6.3 AI Tool Flow

```
AI agent
  -> reads generated rules
  -> calls MCP tools when available
  -> edits app or design-system files
  -> runs run_audit / run_sync_rules
  -> receives diagnostics
  -> self-corrects before returning
```

The system assumes prompts alone are not reliable enough. AI gets both static instructions and callable tools.

### 6.4 Governance Flow

```
developer or AI edits code
  -> anchor audit
  -> file/line diagnostics
  -> Govern view and terminal output
  -> pre-commit or CI enforcement
```

This makes UI drift visible early and blockable before merge.

## 7. Portal Architecture

The Portal is a Vite React application, not a Storybook runtime. It is optimized for product governance:

- **Docs**: bilingual usage and integration docs.
- **Design Token**: visual token editor with live preview and Save & Sync.
- **Components**: component browser, controls, and spec editing.
- **Onboarding**: default kit, import existing components, or start empty.
- **Govern**: audit status, scope tags, issue list, and rule health.

Routes are lazy-loaded so heavier workbench screens do not inflate the initial bundle.

## 8. CLI Architecture

The CLI is the user's operational entry point.

| Command | Role |
|---|---|
| `anchor start` | One-click init, install, and Portal launch |
| `anchor init` | Scaffold `.anchor/` and governance files |
| `anchor govern` | Add rules and governance to an existing project without full component setup |
| `anchor dev` | Start Portal for an existing workspace |
| `anchor sync` | Regenerate tokens, AI rules, and generated contract files |
| `anchor audit` | Run AST governance checks |
| `anchor upgrade` | Pull the latest template while preserving local product assets |
| `anchor mcp` | Start MCP server for AI clients |
| `anchor screenshot` | Print the screenshot-to-token workflow prompt |
| `anchor theme` | Extract tokens from a markdown design prompt |

## 9. MCP Architecture

The MCP server gives agents structured access to local project truth. Current tool categories:

- Component discovery and reading.
- Component creation.
- Token listing and updating.
- Schema listing, reading, and updating.
- Audit and sync execution.
- Generated rule retrieval.
- Safe file read/write inside the design-system boundary.

This lets AI agents query and modify the system in a controlled way instead of relying on stale chat context.

## 10. Audit Architecture

`anchor audit` is an AST-based governance checker. It supports app, kit, portal, and all scopes.

It checks two high-impact classes first:

1. **Forbidden native tags** derived from specs, such as raw `<button>` when `Button` is the governed primitive.
2. **Arbitrary Tailwind values** on token-sensitive prefixes, such as color, spacing, radius, ring, shadow, and border classes.

The audit intentionally allows many layout-specific arbitrary values such as widths, heights, and positioning. The product goal is not to ban every pixel value. The goal is to prevent visual language drift where tokens should be used.

## 11. Design Principles

1. **Local first**: governance should work in the repo where code is written.
2. **Single source of truth**: specs and tokens should generate rules, docs, and checks.
3. **AI-readable by default**: every contract should be available to agents in the formats they use.
4. **Executable over advisory**: documentation matters, but CI checks close the loop.
5. **Incremental adoption**: existing B2B products need migration paths, not all-or-nothing rewrites.
6. **Design-system boundaries**: app code, component code, token code, and generated governance files must stay clearly separated.

## 12. Known Boundaries

- AI tools can still make mistakes. Design-anchor reduces drift through context and checks; it does not make model behavior mathematically perfect.
- Audit coverage is intentionally focused on high-value violations first. Deeper checks for complex `cn()` expressions, inline styles, and dependency-aware imports can extend it further.
- The local `.anchor/` workspace is a real component and Portal workspace. It is intentionally versionable and visible to the project, not a hidden remote service.
- Centralized enterprise design-system platforms can coexist with Design-anchor. A central platform can own cross-repo cataloging while Design-anchor enforces repo-local implementation.
