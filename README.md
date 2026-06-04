<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>Local design-system governance for AI-generated product UI.</strong></p>

<p align="center">
  Style prompts become tokens. Tokens drive components. Rules keep AI coding consistent.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#core-capabilities">Core Capabilities</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## What is Design-anchor?

Design-anchor is a local control plane for teams building product UI with AI coding tools. It gives agents a concrete design-system contract: which components to use, which tokens to style with, how to sync generated rules, and how to audit code after each edit.

It is designed for B2B and enterprise products where dashboards, forms, settings screens, tables, and operational workflows need to stay quiet, consistent, and easy to scan.

Design-anchor separates the user-owned UI from the product control plane:

| Area | Lives in | Purpose |
|---|---|---|
| **Components** | `src/components/anchor-ui/` | Real React + Tailwind component source used by the application. |
| **Design tokens** | `src/design-tokens/tokens.json` | Project token source of truth for colors, radius, typography, spacing, and charts. |
| **Anchor control plane** | `.anchor/` | Portal, schemas, rules, scripts, MCP, sync, and audit tooling. |

Application code imports components from `@design` or `@/components/anchor-ui`. The hidden `.anchor/` folder governs the system, but it is not the runtime component source.

<a id="core-capabilities"></a>
## Core capabilities

### 1. Component-first AI coding

Design-anchor installs governed UI components into the user's source tree. AI agents are instructed to reuse these components before creating raw HTML replacements.

```tsx
import { Button } from "@design";

export function SaveAction() {
  return <Button>Save changes</Button>;
}
```

The generated AI rules tell agents to use `Button`, `Input`, `DataTable`, and other governed components instead of raw `<button>`, `<input>`, or `<table>` when a project component exists.

### 2. Style prompt to design tokens

Give Design-anchor a product style prompt and it extracts concrete token values:

```bash
npx design-anchor theme design-prompt.md
```

The command writes values into `src/design-tokens/tokens.json`, regenerates token CSS, saves the source prompt, and creates a restrained AI style guide. The prompt can guide rhythm, hierarchy, density, and atmosphere; component specs and semantic tokens remain the stronger contract.

### 3. Token-driven theme system

Tokens compile into CSS variables and Tailwind theme values:

```
tokens.json -> seed-to-map.mjs -> CSS variables -> Tailwind semantic classes
```

Use semantic classes such as `bg-primary`, `text-muted-foreground`, `border-border`, and `rounded-md`. Avoid hard-coded hex values and arbitrary token-sensitive spacing.

### 4. AI rules for popular coding tools

Design-anchor generates project rules for common AI coding environments:

```
CLAUDE.md
.cursor/rules/anchor.mdc
.cursor/rules/anchor-selfcheck.mdc
.github/copilot-instructions.md
AGENTS.md
.mcp.json
.cursor/mcp.json
```

The rules make the AI workflow explicit:

- Start UI tasks with `Design Anchor 预检`.
- Prefer `@design` components and semantic tokens.
- Auto-fix raw HTML substitutes, hard-coded colors, and unsafe arbitrary values.
- End UI tasks with a `Design Anchor 自检` summary.

### 5. Audit, sync, and MCP

`anchor audit` scans code for common design-system violations. MCP tools let agents read components, inspect tokens, update schemas, run audits, and sync rules without copy-pasting file contents.

Current MCP tools:

`list_components` · `read_component` · `create_component` · `list_tokens` · `update_token` · `list_schemas` · `read_schema` · `update_schema` · `run_audit` · `run_sync_rules` · `get_cursorrules` · `read_file` · `write_file`

<a id="quick-start"></a>
## Quick start

```bash
npm install -D design-anchor
npx design-anchor start
```

This sets up:

1. `src/components/anchor-ui/` with visible component source.
2. `src/design-tokens/tokens.json` as the project token source.
3. `.anchor/` as the local control plane.
4. AI rules for Cursor, Claude, Copilot, and generic agents.
5. MCP configuration for agent access.
6. Portal access for inspecting tokens, components, docs, and governance status.

For an existing product where you only want governance first:

```bash
npx design-anchor govern
```

Then add components, tokens, and audits incrementally.

## Typical workflows

### Build a new screen with AI

1. Ask your AI coding tool to implement the screen.
2. The rules tell it to inspect `@design`, component specs, and tokens first.
3. The AI uses governed components and semantic token classes.
4. Run `npx design-anchor audit` or let configured hooks run it.
5. Finish with a `Design Anchor 自检` summary.

### Generate a theme from a product style prompt

```bash
npx design-anchor theme design-prompt.md
npx design-anchor sync
```

The prompt becomes token values and lightweight style guidance. The resulting UI still uses governed components and semantic token classes.

### Inspect or adjust the design system

```bash
npx design-anchor portal theme
npx design-anchor portal components
npx design-anchor portal docs
```

Portal is for inspection and governance. Application runtime code continues to use the visible component source in `src/components/anchor-ui/`.

<a id="how-it-works"></a>
## How it works

### Token pipeline

```
14 seeds (tokens.json) -> seed-to-map.mjs -> 200+ CSS variables -> Tailwind classes
```

| Category | Seeds | Drives |
|---|---|---|
| Brand | `colorPrimary`, `colorSuccess`, `colorWarning`, `colorError`, `colorInfo` | Semantic color slots |
| Surface | `colorBgBase`, `colorTextBase` | Neutrals, fills, borders |
| Typography | `fontSize` | Type scale |
| Shape | `borderRadius` | Radius ladder |
| Spacing | `sizeUnit` | Tailwind spacing scale |
| Charts | `chart1` to `chart5` | Chart palette |

Changing `colorPrimary` updates every `bg-primary`. Changing `borderRadius` updates the radius scale. Components use proportional radius rules so nested surfaces stay visually balanced.

### Component contract

Component specs describe:

- import paths
- allowed props and variants
- forbidden native substitutes
- token and style constraints
- examples the AI can mimic

These specs generate AI rules and audit expectations, so the same contract is used before and after code generation.

### Audit behavior

`anchor audit` checks for:

- raw native tags when governed components exist
- hard-coded color values
- token-sensitive arbitrary Tailwind values
- imports that bypass the visible component source

Exact numeric values can be mapped back to equal tokens where possible. Layout-only one-off values such as fixed widths can remain explicit.

## CLI

```
anchor start [dir]        Init + install + open Portal
anchor init  [dir]        Scaffold .anchor/ only
anchor govern             Inject AI rules without scaffolding
anchor theme  <file>      Extract tokens from a design prompt
anchor screenshot [img]   Print screenshot-to-token workflow guidance
anchor upgrade [dir]      Pull latest template while preserving edits
anchor dev   [dir]        Start Anchor Portal
anchor portal [tab] [dir] Open Portal tab: tokens/theme/components/specs/docs
anchor sync  [dir]        Regenerate rules + tokens
anchor audit [dir]        Scan for design-system violations
anchor mcp   [dir]        Start MCP server on stdio
```

## What lands in your project

```
your-project/
├── src/design-tokens/
│   └── tokens.json                    Project token source of truth
├── src/styles/
│   └── design-tokens.generated.css    Generated runtime CSS
├── src/components/anchor-ui/          User-owned component source
├── .anchor/                           Portal, schema, sync, audit, MCP
│   ├── src/anchor/schema/
│   ├── src/anchor/component-demos/
│   ├── src/design-tokens/
│   └── package.json
├── CLAUDE.md
├── .cursor/rules/anchor.mdc
├── .github/copilot-instructions.md
├── AGENTS.md
├── .mcp.json
├── .cursor/mcp.json
└── .cursor/hooks.json
```

Runtime dependencies resolve from the project root to avoid duplicate React instances and context mismatches.

## Who it is for

| Team | Why it helps |
|---|---|
| **B2B SaaS teams** | Keeps dashboards, forms, tables, and settings screens consistent across many AI edits. |
| **Enterprise platforms** | Gives many contributors and agents one local contract for UI work. |
| **AI-assisted product teams** | Lets AI move quickly without reinventing components or drifting from tokens. |
| **Existing products** | Start with governance, then migrate screens and tokens incrementally. |

## Tech stack

- React 19
- Tailwind CSS v4
- Radix UI and shadcn/ui patterns
- Ant Design color algorithm for token derivation
- Vite Portal
- MCP stdio JSON-RPC

## License

MIT.
