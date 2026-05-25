<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>AI-native design-system governance for long-lived products.</strong></p>

<p align="center">
  <a href="#english">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

---

<a id="english"></a>

> Design-anchor helps teams keep product UI consistent while humans and AI agents ship faster. It is especially valuable for B2B SaaS, admin consoles, internal platforms, enterprise dashboards, and any product that must evolve for years without turning into a pile of one-off screens.

For the deeper product narrative, adoption playbook, and enterprise/B2B rollout framing, read [Product Adoption Guide](./docs/PRODUCT_ADOPTION_GUIDE.md). 中文版见 [README.zh-CN.md](./README.zh-CN.md) 与 [产品采用指南](./docs/PRODUCT_ADOPTION_GUIDE.zh-CN.md)。

## Why this exists

Cursor, Claude Code, Copilot, Lovable, v0, Bolt — every AI coding tool happily ships UI that *runs*. But across sessions, the output drifts into **AI slop**: code that compiles but doesn't belong to a system.

What slop looks like in a real project after a few weeks:

```tsx
// Page A — agent generated this on Tuesday
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg">Save</button>

// Page B — same agent, Friday
<button className="bg-[#3b82f6] px-[15px] py-2.5 rounded-[10px]">Save</button>

// Page C — different agent, next sprint
<button className="bg-indigo-500 px-3.5 py-1.5 rounded-md">Save</button>
```

Same intent, three button implementations, three blues, three radii. Multiply across every UI primitive on every page — your product looks like ten teams shipped it. Figma libraries, `design.md` docs, brand guidelines don't fix this; soft constraints get forgotten on edit #50.

**Design-anchor is the structural fix.** Drift becomes mechanically impossible because soft documentation gets replaced by three hard layers:

1. **Token-driven seed → 200+ derived CSS variables.** Change one seed, every component re-skins. No values to forget.
2. **Per-component `spec.json` contract.** Surfaced to AI agents through `.cursorrules` / `CLAUDE.md` / `.github/copilot-instructions.md` / MCP — generated from one source of truth.
3. **`anchor audit` AST scan.** Rejects `bg-[#0204a3]`, raw `<button>` when `<Button>` exists, `p-[13px]` in business code. CI fails. PR blocked. Slop dies.

One command into any React + Tailwind project:

```bash
npx design-anchor start
```

## Who it is for

Design-anchor is built for teams that need repeatable product quality, not just a beautiful first demo.

| Team / product type | Why it matters |
|---|---|
| **B2B SaaS** | Dashboards, forms, tables, filters, permissions, billing, reports, and settings repeat across the whole product. Tiny inconsistencies become expensive when customers live in the UI every day. |
| **Enterprise internal platforms** | Many contributors touch the same product over years. Design-anchor gives every engineer and AI agent the same component contracts and audit rules. |
| **Design-system teams** | Tokens, component specs, AI rules, MCP tools, and audit checks come from one source of truth instead of separate docs nobody keeps aligned. |
| **AI-assisted product teams** | AI can move fast without rewriting the same button, color, spacing, or table pattern in five incompatible ways. |
| **Legacy products** | You can start with governance first, then gradually migrate screens into `@design` components without a big-bang rewrite. |

## Why long-lived B2B products need this

Consumer landing pages can survive visual one-offs. Long-lived B2B products usually cannot. A B2B interface is a workbench: users return every day, scan dense information, compare states, complete workflows, and trust the product through consistency.

That creates four hard requirements:

1. **Consistency must outlive individual contributors.** Designers, engineers, AI agents, contractors, and future teams all need the same UI contract.
2. **Design changes must be cheap.** Rebranding, dark mode, density changes, and accessibility tuning should happen through tokens, not hundreds of manual edits.
3. **AI output must be governable.** Prompts are not enough; generated code needs executable checks and project-local context.
4. **Adoption must be incremental.** Real companies cannot pause roadmap work to rebuild every screen. Governance has to work beside existing React + Tailwind code.

Design-anchor turns these requirements into a local pipeline: token seeds, component specs, generated AI rules, MCP tools, Portal editing, and `anchor audit` in CI.

## What you get

- **60+ shadcn-aligned base components** (`@/components/base/*`)
- A live visual **token customizer** — edit ~14 design seeds, see 200+ derived CSS variables update instantly
- A **Govern tab** showing project-wide compliance (violations / component usage / AI rule freshness / MCP tools exposed)
- **Per-component `spec.json` contracts** (forbidden tags, baseline classes, blacklist patterns, AI prompt fragment)
- AI rule files read by Cursor / Claude Code / Copilot / Windsurf out of the box
- An **MCP server** exposing schema + audit + token surface to any MCP-aware agent
- **First-run onboarding wizard** — default kit / import your own components / start empty

## Product promise

Design-anchor is not just another UI kit. A UI kit gives you components; Design-anchor gives you a **governed loop**:

```
Design intent → Token seeds → Component contracts → AI-readable rules → MCP tools → Audit → CI
```

The result is simple: teams can let more people and more AI tools contribute to the frontend without losing the product's visual language.

## Five minutes from zero

```bash
npx design-anchor start
```

This one command:

1. **`init`** — scaffolds `.anchor/` (a self-contained component library sub-project) at your repo root
2. **`install`** — runs `npm install` inside `.anchor/`
3. **`dev`** — opens the Portal at <http://localhost:6006>

First launch shows a **3-card onboarding wizard**:

| Mode | What happens |
|---|---|
| **Default kit** | Use the 60+ bundled components (recommended) |
| **Import yours** | Point at a folder of `.tsx` files; pre-scan reports per-file compatibility (safe / warn / risky) before copying in |
| **Empty library** | Wipe components, keep tokens & rules. Grow from zero |

After picking, the Portal opens with **four tabs**:

| Tab | What it does |
|---|---|
| **Docs** | Bilingual usage docs (intro / quickstart / token system / CLI / MCP / audit / AI integration / spec format / FAQ) |
| **Design Token** | Visual customizer — edit seeds (constrained slider for sizeUnit, ↑↓ ±0.25 step on lengths, ⋯ menu for **Reset to defaults**), live preview on the right |
| **Components** | Browse 60+ base components with live controls + spec.json editor |
| **Govern** | Compliance KPIs at a glance — 0 violations / N components in use / AI rule files up-to-date |

Top right: 🌐 EN/中文 toggle and 🌙/☀️ dark-mode toggle.

## Three defenses against AI slop, in detail

### 1. Token pipeline — drift becomes physically impossible

```
~14 seeds (tokens.json)  →  seed-to-map.mjs  →  200+ CSS vars  →  @theme  →  className
```

Edit `colorPrimary` from `#000000` to `#635BFF`, every `bg-primary` in every component flips. Edit `borderRadius` from `8` to `12`, every `rounded-md` updates. Run `anchor sync` — no mass find-and-replace needed.

The seed surface (~14 user-tunable keys):

| Category | Seeds | Drives |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info | All semantic color slots (link auto-mirrors info) |
| Surface | colorBgBase / colorTextBase | 30+ derived neutrals (ink ladder, fills, borders, shadcn semantics) |
| Typography | fontSize | `text-xs` through `text-3xl` |
| Shape | borderRadius | `rounded-sm/md/lg/xl` ladder |
| Spacing | sizeUnit | Full Tailwind `p-N` / `gap-N` scale |
| Charts | chart1 – chart5 | Chart palette (Recharts wired) |

Dark mode: any seed can have a `seedDark` override. Per-slot semantic overrides (e.g. `muted`, `accent`) land in `mapOverrides.light` / `.dark`.

### 2. AI rule files — slop never gets written in the first place

Generated from spec.json + scene routing:

```
your-project/
├── CLAUDE.md                           Claude Code CLI / Claude Desktop
├── .cursor/rules/anchor.mdc            Cursor (alwaysApply)
├── .cursor/rules/anchor-selfcheck.mdc  post-edit checklist
├── .github/copilot-instructions.md     Copilot Chat
├── AGENTS.md                           generic AI coding contract
├── .mcp.json                           Claude Code / Cline / Zed MCP
├── .cursor/mcp.json                    Cursor MCP
└── .cursor/hooks.json                  hook: audit on save
```

Each AI tool reads its own file. Same body — same scene routing, same component list, same hard rules — packaged for whichever tool happens to be open. Tools see "use `<Button>`, not `<button>`" *before* writing the wrong thing.

### 3. `anchor audit` — slop that slipped through gets rejected

AST scan. Runs on save (Cursor hook), pre-commit, and CI:

- **Forbidden native tags** declared in spec.json (raw `<button>` when Button is declared)
- **Arbitrary-value Tailwind on token-sensitive prefixes**:
  - **Reject**: `bg / text / border / ring / fill / stroke / from / to / via / shadow / p / m / gap / rounded` — must be tokens or `var(--…)`
  - **Allow**: `w / h / top / left / grid-cols / aspect / z` — one-off layout pixels are fine

So `bg-[#0204a3]` and `p-[13px]` are rejected; `w-[280px]` and `max-w-[480px]` pass.

The Portal's **Govern tab** surfaces audit results live: green banner when zero violations, otherwise the violating file:line list.

## Image / screenshot reference workflow

When you (or an AI agent) hand a screenshot to the system, Design-anchor enforces a **two-path choice**:

| Path | What happens | Use when |
|---|---|---|
| **A. Extract & override** | Run `npx design-anchor screenshot` to print a structured prompt; paste into your AI tool with the image; AI uses MCP `update_token` to write seeds, then `run_sync_rules`. Every component re-skins. | Brand redesign or you want the product to *look like* the image |
| **B. Follow existing tokens** | Tokens stay untouched. Agent composes the new layout from existing `@design` components. Only arrangement is new | The reference is just a layout hint |

**Default is Path B.** Path A changes shared tokens that affect every page — must be explicit, never silent.

What's never allowed: silently inventing colors / radii from a screenshot. `bg-[#0204a3]` in business code is rejected by `anchor audit` regardless of how it got there.

## Use components in your app

Add a TypeScript path alias `@design` → `.anchor/src/components/base`:

```ts
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
```

Then:

```tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
```

## CLI

```
anchor start [dir]        One-click: init + npm install + open Portal
anchor init  [dir]        Scaffold .anchor/ only
anchor govern             Inject AI rules without scaffolding (existing-project mode)
anchor dev   [dir]        Start the Portal against an existing .anchor/
anchor sync  [dir]        Regenerate .cursorrules / Tailwind tokens / rule mirrors
anchor audit [dir]        AST-scan for forbidden tags + token violations
anchor upgrade [dir]      Pull the latest .anchor/ template (preserves your edits)
anchor mcp [dir]          Start the MCP server on stdio
anchor screenshot [img]   Print AI prompt + workflow for image-based token extraction
anchor theme <prompt.md>  Extract tokens from a markdown design prompt
```

## MCP server

```jsonc
// .cursor/mcp.json (works for Cursor; same shape for .mcp.json in Claude Code / Cline / Zed / Qoder)
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["design-anchor", "mcp", "."]
    }
  }
}
```

**13 tools exposed**: `list_components` / `read_component` / `create_component` / `list_tokens` / `update_token` / `list_schemas` / `read_schema` / `update_schema` / `run_audit` / `run_sync_rules` / `get_cursorrules` / `read_file` / `write_file`.

AI agents call these directly — no copy-paste loop. Want to update tokens from a screenshot? Agent reads image → calls `update_token` per seed → calls `run_sync_rules`. Done, fully transparent to the user.

## What lands in your project

```
your-project/
├── .anchor/                            ← Design-anchor subtree (gitignore or vendor)
│   ├── src/components/base/            60+ ready-to-use React + Tailwind components
│   ├── src/anchor/schema/              per-component spec.json contracts
│   ├── src/design-tokens/              tokens.json + seed-to-map algorithm
│   └── package.json                    own deps (Vite + React + Radix + Tailwind v4)
├── CLAUDE.md                           Claude Code / Claude Desktop rules
├── .cursor/rules/anchor.mdc            Cursor (alwaysApply)
├── .cursor/rules/anchor-selfcheck.mdc  post-edit checklist + image-reference rule
├── .github/copilot-instructions.md     Copilot Chat
├── AGENTS.md                           generic AI coding contract
├── .mcp.json                           MCP for Claude Code / Cline / Zed
├── .cursor/mcp.json                    MCP for Cursor
├── .cursor/hooks.json                  hook: audit on save
├── ANCHOR_BOUNDARIES.md                directory boundary guide
└── ANCHOR_INTEGRATION.md               @design alias + Vite example
```

## Tech stack

- **React 19** + **Vite 6** (Portal)
- **Tailwind v4** with `@theme` (var-ref chain so live preview survives runtime overrides)
- **Radix UI** primitives for accessible bases
- **shadcn/ui** patterns for component composition
- **Antd 5** color algorithm for token derivation
- **MCP** stdio JSON-RPC for AI agent integration

## Roadmap

- **Vibe preset library** — curated style packs (Linear / Vercel Geist / Stripe / Notion / Brutalist / Glass) bundling token snapshot + AI style rules. One-click "make this app look like Linear"
- **Token migration codemod** — scan imported components, find hardcoded values (`bg-[#0204a3]`, `p-[13px]`, inline styles), suggest tokens with ΔE / Δpx scoring, apply via ts-morph
- **Sidebar origin dots** — blue dot for user-imported components, gray for kit defaults
- **Two-snapshot diff viewer** — see what changed between token revisions
- **VS Code extension** — IDE-native audit + sidebar (alongside MCP)
- **Cross-project preset registry** — community-contributed themes, one-click load

## Contributing

Issues and PRs welcome. Keep the `seed → derived → CSS variable → component className` pipeline intact. Slop gets sent back.

## License

MIT.
