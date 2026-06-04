<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>A background design-system guardrail for AI-generated product UI.</strong></p>

<p align="center">
  Prompt &rarr; tokens. Specs &rarr; components. Rules &rarr; consistent AI coding.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## The problem

Every AI coding tool can ship UI that *runs*. The harder problem is keeping that UI consistent after the 20th prompt, the 50th edit, and the third agent in the same repo.

```tsx
// Monday — agent A
<button className="bg-blue-500 px-4 py-2 rounded-lg">Save</button>

// Friday — agent A again
<button className="bg-[#3b82f6] px-[15px] py-2.5 rounded-[10px]">Save</button>

// Next sprint — agent B
<button className="bg-indigo-500 px-3.5 py-1.5 rounded-md">Save</button>
```

Same intent, three implementations, three blues, three radii. Multiply across every page and a B2B product starts to feel like several teams shipped separate surfaces. Figma libraries and `design.md` docs help humans, but AI agents need executable contracts they can read, apply, and audit.

## The fix

Design-anchor is installed as a project dependency and then fades into the background. It gives your AI tools local truth about components, tokens, rules, and audits, without forcing users through a design-system product flow first.

| Product surface | Source of truth | What AI should do |
|---|---|---|
| **Components** | `src/components/anchor-ui/` | Import from `@design` or `@/components/anchor-ui`, never from `.anchor/` internals. |
| **Tokens** | `src/design-tokens/tokens.json` | Use semantic token classes like `bg-primary`, then sync generated CSS. |
| **Control plane** | `.anchor/` | Keep Portal, schema, rules, scripts, and audits separate from application UI. |

Under the hood, three layers keep output from drifting:

| Layer | What it does | When it acts |
|---|---|---|
| **Rules** | AI-readable contracts (`.cursorrules` / `CLAUDE.md` / `copilot-instructions.md`) generated from per-component `spec.json`. AI sees "use `<Button>`, not `<button>`" before writing the wrong thing. | Before generation |
| **Hooks** | `anchor audit` AST scan runs on save, pre-commit, and CI. Rejects `bg-[#0204a3]` and raw `<button>`; exact-value px overrides are mapped back to tokens before staying arbitrary. | After generation |
| **MCP** | 13-tool server lets agents read schemas, update tokens, run audit, sync rules — no copy-paste loop. | On demand |

During AI coding, Design-anchor should be visible in the same conversation: the agent starts UI work with `Design Anchor 预检`, calls out `Design Anchor 自动治理` when it fixes unsafe code, and ends with a self-check such as `Design Anchor 自检：复用了 8 个 @design 组件，未发现硬编码颜色，规则已同步。`.

<a id="quick-start"></a>
## Quick start

```bash
npm install -D design-anchor
npx design-anchor start
```

This installs the working contract:

1. **Adds visible component source** in `src/components/anchor-ui/`, so generated code can keep working even if Design-anchor is later removed.
2. **Creates the `.anchor/` control plane** for Portal, schema, sync scripts, MCP, rules, and audits.
3. **Patches project wiring**: dependencies, token CSS import, `@design` alias guidance, Cursor / Claude / Copilot rules.
4. **Opens Portal directly to Theme / tokens**. There is no required onboarding or preset selection.

Browse tokens or components when you need to inspect them, or close the Portal and start coding. The guardrails are already active in the background.

To turn a user's style prompt into tokens:

```bash
npx design-anchor theme design-prompt.md
```

This writes token values into `src/design-tokens/tokens.json`, saves the original prompt, and generates restrained AI style guidance. The prompt can influence rhythm, hierarchy, density, and atmosphere; component specs and semantic tokens still win.

## Use components

Use the visible source that Design-anchor copied into your project:

```ts
// tsconfig.json
{ "compilerOptions": { "paths": { "@design": ["src/components/anchor-ui"], "@design/*": ["src/components/anchor-ui/*"] } } }
```

```tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
```

This is intentionally similar to shadcn: components live in the user's source tree, while Design-anchor supplies the background governance, sync, and audit layer.

<a id="how-it-works"></a>
## How it works

### Token pipeline

```
14 seeds (tokens.json) → seed-to-map.mjs → 200+ CSS variables → @theme → className
```

Change `colorPrimary` from `#000` to `#635BFF`: every `bg-primary` across every component flips. Change `borderRadius` from `8` to `12`: every `rounded-md` updates. Run `anchor sync`. No find-and-replace.

| Category | Seeds | Drives |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info | All semantic color slots |
| Surface | colorBgBase / colorTextBase | 30+ derived neutrals, fills, borders |
| Typography | fontSize | `text-xs` through `text-3xl` |
| Shape | borderRadius | `rounded-sm/md/lg/xl` ladder |
| Spacing | sizeUnit | Full Tailwind `p-N` / `gap-N` scale |
| Charts | chart1 – chart5 | Chart palette (Recharts wired) |

Components follow a proportional radius rule: inner radius = outer radius - padding, enforced via `calc(var(--radius-md) - var(--spacing-1))` with a 2px floor. This keeps nested elements (dropdown items, toggle highlights, tab indicators) visually proportional at any radius setting.

### AI rule files

Generated from `spec.json` — one source of truth, multiple outputs:

```
your-project/
├── CLAUDE.md                           Claude Code / Claude Desktop
├── .cursor/rules/anchor.mdc            Cursor (alwaysApply)
├── .cursor/rules/anchor-selfcheck.mdc  Post-edit checklist
├── .github/copilot-instructions.md     Copilot Chat
├── AGENTS.md                           Generic AI contract
├── .mcp.json                           Claude Code / Cline / Zed MCP
├── .cursor/mcp.json                    Cursor MCP
└── .cursor/hooks.json                  Audit on save
```

### `anchor audit`

AST scan that enforces two classes of rules:

- **Forbidden native tags** — raw `<button>` when `<Button>` exists in the kit
- **Arbitrary values on token-sensitive prefixes** — hard-coded colors like `bg-[#hex]` are rejected. Numeric overrides such as `p-[24px]`, `rounded-[16px]`, and `text-[14px]` are first mapped to an equal token (`p-6`, `rounded-lg`, `text-sm`); unmatched one-off values stay explicit. `w-[280px]`, `max-w-[480px]` pass (layout one-offs are fine).

### MCP server

```jsonc
// Auto-configured during init
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["design-anchor", "mcp", "."]
    }
  }
}
```

13 tools: `list_components` · `read_component` · `create_component` · `list_tokens` · `update_token` · `list_schemas` · `read_schema` · `update_schema` · `run_audit` · `run_sync_rules` · `get_cursorrules` · `read_file` · `write_file`

This is the preferred path for AI agents: Design-anchor can be called by skills, MCP, or CLI while staying out of the user's first screen.

## CLI

```
anchor start [dir]        Init + install + open Portal
anchor init  [dir]        Scaffold .anchor/ only
anchor govern             Inject AI rules without scaffolding
anchor dev   [dir]        Start Portal on existing .anchor/
anchor portal [tab] [dir] Open Portal tab: tokens/theme/theme-editor/components/specs/docs
anchor sync  [dir]        Regenerate rules + tokens
anchor audit [dir]        AST scan for violations
anchor upgrade [dir]      Pull latest template (preserves edits)
anchor mcp [dir]          Start MCP server on stdio
anchor screenshot [img]   Image-based token extraction prompt
anchor theme <prompt.md>  Extract tokens from design prompt
```

React is a peer dependency (`>=18 <20`). Keep `react` and `react-dom` deduped to the host project when importing the visible `src/components/anchor-ui` source through `@design`.

For existing projects that only want governance first, start with `anchor govern`, then add components or tokens incrementally.

## What lands in your project

```
your-project/
├── src/design-tokens/                  Project token source of truth
│   └── tokens.json
├── src/styles/
│   └── design-tokens.generated.css     Generated runtime CSS imported by the app
├── src/components/anchor-ui/           60+ React + Tailwind components
├── .anchor/                            Anchor Portal + schema + sync control plane
│   ├── src/anchor/schema/              Per-component spec.json contracts
│   ├── src/anchor/component-demos/     Portal-only component demos
│   ├── src/design-tokens/              Seed-to-map algorithm + default template
│   └── package.json                    Portal toolchain only; runtime deps resolve from project root
├── CLAUDE.md                           AI rules (Claude)
├── .cursor/rules/anchor.mdc            AI rules (Cursor)
├── .github/copilot-instructions.md     AI rules (Copilot)
├── AGENTS.md                           AI contract (generic)
├── .mcp.json + .cursor/mcp.json        MCP config
└── .cursor/hooks.json                  Audit on save
```

All component runtime dependencies (React, Radix, etc.) are installed in your project root — no duplicate React instances, no context mismatch.

## Who it's for

| Team type | Why |
|---|---|
| **B2B SaaS** | Dashboards, forms, tables repeat everywhere. Small inconsistencies compound when users live in the UI daily. |
| **Enterprise platforms** | Many contributors over years. Same contracts for every engineer and AI agent. |
| **AI-assisted teams** | Let AI move fast without reinventing buttons five different ways. |
| **Legacy products** | Start with governance, migrate screens incrementally. No big-bang rewrite. |

## Tech stack

- **React 19** + **Tailwind v4** + **Radix UI** + **shadcn/ui** patterns
- **Antd 5** color algorithm for token derivation
- **Vite 6** for the Portal
- **MCP** stdio JSON-RPC for AI integration

## License

MIT.
