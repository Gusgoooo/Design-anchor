<p align="center">
  <img src="https://img.shields.io/npm/v/design-anchor?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-anchor?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Claude%20%7C%20Copilot-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">Design-anchor</h1>

<p align="center"><strong>Anchor your design system. Govern AI-generated UI.</strong></p>

<p align="center">
  <a href="#english">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

---

<a id="english"></a>

## What is Design-anchor?

A **token-driven design system + AI governance pipeline** that makes it structurally hard for AI coding tools (Cursor / Claude Code / Copilot / Qoder) to drift away from your design language.

Drop it into any React + Tailwind project with one command. You get:

- **60+ shadcn-aligned base components** (`@/components/base/*`)
- A live visual **token customizer** — edit ~14 design seeds, see 200+ derived CSS variables update instantly
- A **spec.json contract** per component (forbidden tags, baseline classes, blacklist patterns, AI prompt fragment)
- Generated AI rules read by Cursor / Claude Code / Copilot / Windsurf out of the box
- An **MCP server** that exposes the schema + audit + token surface to any MCP-aware agent

## The problem it solves

AI coding tools generate beautiful UI in isolation, but lose context across conversations:

- The same button rendered with 3 different border radii across 3 pages
- The same gray is `gray-100` here, `#e5e7eb` there, `gray-200` in a third place
- Spacing drifts from `p-4` to `p-[15px]` to `py-3.5`

After a few weeks of AI-assisted work, an enterprise product starts to look like it was built by 10 different teams. Figma libraries and `design.md` prompts don't fix it — soft constraints get forgotten on the 50th edit.

Design-anchor's pipeline is **enforced**, not "documented":

```
~14 seeds  →  200+ derived CSS variables  →  component className
                              ↓                          ↓
                  @theme inline maps to Tailwind   AST audit blocks drift
```

Change any seed, every component re-skins. Try to hand-write `bg-[#0204a3]` in business code, audit rejects it.

## Quick start

```bash
npx anchor start
```

This is the all-in-one. It will:

1. **`init`** — scaffold `.anchor/` (a complete component library sub-project) at your repo root
2. **`install`** — `npm install` inside `.anchor/` so the portal can run
3. **`dev`** — open the Portal at <http://localhost:6006>

Open the printed URL. Three tabs:

| Tab | What it does |
|---|---|
| **Docs** | Full bilingual usage docs (introduction / quickstart / token system / CLI / MCP / auditing / AI integration / spec format / FAQ) |
| **Design Token** | Visual customizer — left panel = seed editor, right panel = live component preview |
| **Components** | Browse the 60+ base components with live controls + spec.json editor |

Top-right of the portal: 🌐 EN/中文 toggle and a 🌙/☀️ dark-mode toggle.

## Image-reference workflow

When you (or an AI agent) hand a screenshot / mockup / reference image to the system and ask it to build a page, Design-anchor enforces a **two-path choice**:

| Path | What happens | Use it when |
|---|---|---|
| **A. Extract & override** | Agent reads the image, proposes a diff against `tokens.json` (primary color / radius / fonts / spacing), runs `anchor sync` after you confirm. Every component re-skins to match the reference. | The reference is a brand redesign or you want the product to *look like* the image. |
| **B. Follow existing tokens** | Tokens stay untouched. Agent composes the new layout from existing `@design` components. Colors / radii / spacing stay consistent with the rest of the product; only arrangement is new. | The reference is just a layout hint, not a brand change. |

**Default is Path B** when the user is silent or ambiguous — Path A changes shared tokens that affect *every page*, so it should be an explicit choice.

What's never allowed: silently inventing colors / radii / spacing from a screenshot. A hardcoded `bg-[#0204a3]` in business code is rejected by `anchor audit` regardless of how it got there.

The rule lives in `.cursor/rules/anchor-selfcheck.mdc` and is mirrored in `src/anchor/rules/AGENTS_IMAGE_REFERENCE.md`.

## What lands in your project

```
your-project/
├── .anchor/                       ← Design-anchor subtree (gitignored or vendored)
│   ├── src/components/base/      60+ ready-to-use React + Tailwind components
│   ├── src/anchor/schema/        per-component spec.json contracts
│   ├── src/design-tokens/        tokens.json + seed-to-map algorithm
│   └── package.json              own deps (Vite + React + Radix + Tailwind v4)
├── .cursorrules                   AI-readable design contract (auto-regenerated)
├── .cursor/rules/anchor.mdc       Cursor-specific rule file
├── .cursor/rules/anchor-selfcheck.mdc  post-edit checklist + image-reference rule
├── CLAUDE.md                      Claude Code project instructions
├── .github/copilot-instructions.md  Copilot Chat rules
└── ANCHOR_INTEGRATION.md          one-page consumer guide
```

## Use components in your app

Add a TypeScript path alias `@design` → `.anchor/src/components/base`:

```ts
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
```

Then in your business code:

```tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
```

## CLI

```
anchor start [dir]      One-click: init + npm install + open Portal
anchor init  [dir]      Scaffold .anchor/ only (no install, no dev)
anchor dev   [dir]      Start the Portal against an existing .anchor/
anchor sync  [dir]      Regenerate .cursorrules / Tailwind tokens / rules
anchor audit [dir]      AST-scan for forbidden tags + token violations
anchor upgrade [dir]    Pull the latest .anchor/ template (preserves your edits)
anchor mcp [dir]        Start the MCP server on stdio
anchor add <Component>  Import a component + scaffold its spec + demo
```

## Token system in 60 seconds

```
seed (tokens.json)         ← you edit these (~14 keys)
  ↓
seed-to-map.mjs            ← Antd algorithm + custom mappings
  ↓
200+ CSS variables         ← --color-primary, --spacing-N, --radius-md, …
  ↓
@theme inline block        ← Tailwind v4 utilities resolve here
  ↓
component className        ← bg-primary, rounded-md, p-4 …
```

The seed surface (14 user-tunable keys):

| Category | Seeds | Drives |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info / Link | All semantic color slots |
| Surface | colorBgBase / colorTextBase | 30+ derived neutrals (ink ladder, fills, borders) |
| Typography | fontSize | `text-xs` through `text-3xl` |
| Shape | borderRadius | `rounded-sm/md/lg/xl` ladder |
| Spacing | sizeUnit | Full Tailwind `p-N` / `gap-N` scale |
| Charts | chart1 – chart5 (`customSeeds`) | Chart palette |

Dark mode: any seed can have a `seedDark` override. Per-slot semantic tokens (e.g. `muted`, `accent`, `border`) can be individually overridden via the customizer's **Surfaces > Derived > Semantic** subgroup; overrides land in `mapOverrides.light` / `.dark`.

## MCP server

Wire it into Cursor:

```jsonc
// .cursor/mcp.json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
```

Same shape works for Claude Code (`.mcp.json`), Continue, Cline, Zed, Qoder, etc. 13 tools exposed: `list_components` / `read_component` / `create_component` / `list_tokens` / `update_token` / `list_schemas` / `read_schema` / `update_schema` / `run_audit` / `run_sync_rules` / `get_cursorrules` / `read_file` / `write_file`.

## What `anchor audit` flags

- **Forbidden native tags** declared in `spec.json` (e.g. raw `<button>` when Button is declared)
- **Arbitrary-value Tailwind on token-sensitive prefixes**:
  - Flag: `bg / text / border / ring / fill / stroke / from / to / via / shadow / p / m / gap / rounded` — these must be tokens or `var(--…)`
  - Allow: `w / h / top / left / grid-cols / aspect / z` and friends — one-off layout pixels are fine

So `bg-[#0204a3]` and `p-[13px]` are rejected; `w-[280px]` and `max-w-[480px]` pass.

## Project layout

```
.
├── bin/                        CLI entrypoints (anchor, anchor-mcp, postinstall)
├── scripts/                    Build helpers (sync-tokens, sync-from-schema, audit)
├── src/
│   ├── anchor/                 Governance: schema specs, linter config, rule generators
│   ├── anchor-portal/          The portal app (Vite + React)
│   │   ├── canvas/             Story preview frame
│   │   ├── controls/           Auto-generated args panel
│   │   ├── create/             Token customizer (Design Token tab)
│   │   ├── docs/               Docs tab (bilingual sections)
│   │   ├── i18n/               LocaleProvider + Bilingual hook
│   │   ├── sidebar/            Components tab sidebar
│   │   ├── spec-editor/        Spec.json editor
│   │   └── theme/              Dark-mode provider
│   ├── components/base/        60+ shadcn-aligned components (the library)
│   ├── design-tokens/          tokens.json + seed-to-map.mjs + DesignTokenShowcase
│   ├── lib/                    cn() utility
│   └── styles/                 globals.css + generated design-tokens.generated.css
├── docs/                       Architecture notes / progress
└── vendor/design-system-template/   Upstream shadcn snapshot for reference
```

## Tech stack

- **React 19** + **Vite 7** (portal)
- **Tailwind v4** with `@theme inline` for token wiring
- **Radix UI** primitives for accessible component bases
- **shadcn/ui** patterns for component composition
- **Antd 5** color algorithm for token derivation
- **react-markdown + remark-gfm** for docs rendering
- **MCP** stdio JSON-RPC for AI agent integration

## Roadmap

- AI-assisted token extraction from uploaded screenshots (Path A above, automated)
- Cross-project preset library (load shadcn Indigo / AntD Default with one click)
- Component preview composition library beyond the 8 cards currently in the customizer
- Visual diff between two token snapshots
- VS Code extension (in addition to MCP)

## Contributing

Issues and PRs welcome. The product is intentionally small and opinionated — design changes should keep the `seed → derived → CSS variable → component className` pipeline intact.

## License

MIT.
