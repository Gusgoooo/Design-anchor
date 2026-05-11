<p align="center">
  <img src="https://img.shields.io/npm/v/harness-design?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/harness-design?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/tailwindcss-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/storybook-8-FF4785?style=flat-square&logo=storybook&logoColor=white" alt="Storybook 8" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20GPT%20%7C%20Claude-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">HarnessUI &nbsp;<a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/lang-简体中文-red?style=flat-square" alt="中文文档" /></a></h1>

<p align="center">
  <strong>A design-system kit where your tokens, components, and AI guardrails stay in one pipeline — so what you approve in the portal is what ships in code.</strong>
</p>

<p align="center">
  For designers: <em>review the real library in Storybook, tune seeds without hunting hex in PRs.</em>
  &nbsp;·&nbsp;
  For teams: <em>tokens &rarr; Tailwind v4 <code>@theme</code> &rarr; accessible components &rarr; spec-driven audits.</em>
</p>

---

## For designers

HarnessUI is the **control room for your product UI**: the same decisions you would capture in variables, brand decks, or a Figma library become the source that engineers, Storybook, and coding agents all read from.

**What you get without chasing pixels in production**

- **One palette, two modes** — Seed colors drive the full primary / semantic / surface story; light and dark are derived together so contrast relationships stay intentional.
- **Rhythm you can defend** — Spacing, type, radius, elevation, and motion share structured scales, so layouts feel coherent without one-off `p-[13px]` requests.
- **A live review room** — The Storybook portal shows each component with real tokens and states, closer to acceptance testing than static redlines.
- **Intent that survives handoff** — Every component carries a `.spec.json` contract: purpose, allowed props, style locks, and forbidden patterns. Designers set the guardrails; `harness sync` turns them into Cursor rules and `harness audit` checks drift.

**How to collaborate with engineering**

1. Agree on the seed layer in `tokens.json` (or iterate in the Design Token UI) as the signed-off brand baseline.
2. After `npm run sync:tokens`, skim the generated CSS or the portal preview to confirm the palette and density still match your intent.
3. For risky releases, ask for a `harness audit` summary — violations point to files and patterns, not abstract “please fix spacing.”

You do not need to run the CLI yourself. Treat HarnessUI as the **curated component shelf** the product builds on; the sections below document how that shelf is built and kept honest for engineers and AI workflows.

---

## Why HarnessUI?

Modern AI coding tools (Cursor, Copilot, GPT) generate UI code fast — but they **don't know your design system**. They hallucinate colors, invent spacing values, and ignore component APIs. HarnessUI solves this by embedding your design truth directly into the AI's context:

| Problem | HarnessUI Solution |
|---|---|
| AI uses hardcoded `#1677ff` instead of tokens | **Seed &rarr; Map token pipeline** auto-generates ~175 CSS variables + Tailwind mappings |
| AI invents `p-[13px]` arbitrary spacing | **Component specs** (`.spec.json`) define allowed props, style locks, and forbidden patterns |
| Token changes don't propagate | **Single source of truth**: `tokens.json` &rarr; `@theme` + `:root` + `.dark` in one generated file |
| No way to audit AI-generated code | **`harness audit`** CLI checks every component against its spec |
| Design system rules get stale | **`harness sync`** regenerates `.cursorrules` from specs — always up to date |

## Key Features

- **Seed &rarr; Map Token Engine** — Define 10 seed values, get 175+ derived tokens (colors, spacing, radius, shadows, typography, motion, opacity) via Ant Design's algorithm
- **Tailwind CSS v4 Native** — All tokens mapped to `@theme inline` for first-class utility support (`bg-primary`, `p-sm`, `rounded-lg`, `font-medium`, `duration-fast`)
- **23 Accessible Components** — Built on Radix UI primitives with full token integration, dark mode, and keyboard navigation
- **Storybook 8 Portal** — Interactive design token editor with OKLCH color picker, live component previews, and real-time controls
- **Component Spec System** — JSON schemas that define props, intents, style locks, AI prompts, and forbidden patterns per component
- **Harness CLI** — `init`, `start`, `dev`, `sync`, `audit`, `upgrade`, `mcp` — full lifecycle management
- **MCP Server** — Model Context Protocol integration for Cursor Agent, providing specs and token data directly to AI
- **Dark Mode** — Automatic light/dark derivation from seed tokens with CSS custom variant `&:is(.dark *)`
- **Upgrade-safe** — npm updates add new components without overwriting your customizations (hash-based diffing)

## Architecture

```
tokens.json (Seed)
    │
    ▼
emit-design-tokens-css.mjs ──► design-tokens.generated.css
    │                              ├── @theme inline { ... }    ← Tailwind utilities
    │                              ├── :root { ... }            ← CSS variables
    │                              └── .dark { ... }            ← Dark overrides
    ▼
*.spec.json (23 component schemas)
    │
    ├──► sync-from-schema ──► .cursorrules (AI coding rules)
    ├──► harness-audit ──► compliance report
    └──► Storybook Portal ──► visual editing + controls
```

### Token Flow: One Hop, No Drift

```
tokens.json ──(sync:tokens)──► design-tokens.generated.css ──► Tailwind v4 + Components
     │                                                              │
     └── Single file, three sections:                               │
         @theme (Tailwind-mapped)                                   │
         :root  (non-Tailwind vars)                                 │
         .dark  (dark overrides)                                    │
                                                                    ▼
                                                          AI reads .cursorrules
                                                          (auto-generated from specs)
```

## Quick Start

### Install

```bash
npm install harness-design
```

### Initialize in Your Project

```bash
npx harness start
```

This will:
1. Create a `.harness/` directory with all components, tokens, and specs
2. Set up `.cursor/` rules for AI coding governance
3. Install dependencies
4. Launch the Storybook portal at `http://localhost:6006`

### Development

```bash
npx harness dev          # Start Storybook portal
npx harness sync         # Regenerate rules from specs
npx harness audit        # Check component compliance
npx harness upgrade      # Pull latest kit (preserves your changes)
npx harness mcp          # Start MCP server for Cursor Agent
```

### Use Components

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@design/components/starter";

export function MyFeature() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" size="default">
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Components

HarnessUI ships 23 production-ready components, each with a `.spec.json` schema, Storybook story, and full token integration:

| Component | Key Features | Spec |
|-----------|-------------|------|
| **Alert** | 4 variants (default/destructive/success/warning), icon support | `alert.spec.json` |
| **Avatar** | Image + fallback, configurable size | `avatar.spec.json` |
| **Badge** | 5 variants, semantic colors | `badge.spec.json` |
| **Button** | 6 variants, 4 sizes, `asChild` composition | `button.spec.json` |
| **Card** | Header/Content/Footer composition | `card.spec.json` |
| **Checkbox** | Radix primitive, accessible | `checkbox.spec.json` |
| **Data Table** | Sorting, filtering, pagination, density modes | `data-table.spec.json` |
| **Dialog** | Modal with overlay, keyboard dismiss | `dialog.spec.json` |
| **Dropdown Menu** | Nested menus, keyboard navigation | `dropdown-menu.spec.json` |
| **Input** | Multiple types, disabled/error states | `input.spec.json` |
| **Label** | Peer-disabled styling, semantic pairing | `label.spec.json` |
| **Popover** | Floating content with arrow | `popover.spec.json` |
| **Progress** | Animated value bar, token-driven duration | `progress.spec.json` |
| **Radio Group** | Radix group with accessible items | `radio-group.spec.json` |
| **Scroll Area** | Custom scrollbar theming | `scroll-area.spec.json` |
| **Select** | Native select with token styling | `select.spec.json` |
| **Separator** | Horizontal/vertical with semantic spacing | `separator.spec.json` |
| **Skeleton** | Loading placeholder with animation | `skeleton.spec.json` |
| **Slider** | Range input with track/thumb theming | `slider.spec.json` |
| **Switch** | Toggle with peer-disabled opacity token | `switch.spec.json` |
| **Table** | Full table composition with sticky header | – |
| **Tabs** | List/Trigger/Content with active states | `tabs.spec.json` |
| **Textarea** | Auto-min-height token, disabled opacity | `textarea.spec.json` |
| **Tooltip** | Delay animation with motion token | `tooltip.spec.json` |

## Design Token System

### Seed → Map Pipeline

HarnessUI uses a **two-layer token architecture** inspired by Ant Design's token system:

```jsonc
// tokens.json — you edit only the seed layer
{
  "version": 2,
  "seed": {
    "colorPrimary": "#1677ff",    // → derives 10 primary shades + semantic aliases
    "colorSuccess": "#52c41a",    // → success-bg, success-border, success-text, ...
    "fontSize": 14,               // → 7 font-size scale tokens
    "borderRadius": 6,            // → xs/sm/md/lg/xl radius scale
    "sizeUnit": 4,                // → spacing-* scale
    "sizeStep": 4,                // → paired with sizeUnit for spacing derivation
    "motionUnit": 0.1             // → fast/mid/slow duration tokens
  },
  "seedDark": {
    "colorBgBase": "#000000",     // → automatic dark palette derivation
    "colorTextBase": "#ffffff"
  },
  "fixedAliases": {
    "opacityDisabled": 0.5,       // → disabled:opacity-disabled
    "fontWeightMedium": 500,      // → font-medium
    "fontWeightSemibold": 600     // → font-semibold
  }
}
```

Running `npm run sync:tokens` generates a single CSS file with three sections:

### Tailwind v4 `@theme` Mapping

Tokens are mapped to Tailwind's `@theme inline` directive, enabling native utility classes:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-destructive: var(--error);
  --radius-sm: var(--border-radius-sm);
  --spacing-sm: 8px;
  --spacing-base: 12px;
  --font-size-sm: 14px;
  --font-weight-medium: 500;
  --animate-duration-fast: var(--motion-duration-fast);
  /* ... ~60 Tailwind-mapped tokens */
}
```

### Token Usage in Components

| Category | Tailwind Class | Example |
|----------|---------------|---------|
| Colors | `bg-primary`, `text-destructive` | `<Button className="bg-primary">` |
| Spacing | `p-sm`, `gap-base`, `mt-xs` | `<Card className="p-lg">` |
| Radius | `rounded-md`, `rounded-lg` | `<Badge className="rounded-full">` |
| Typography | `text-sm`, `font-medium` | `<Label className="text-sm font-medium">` |
| Shadows | `shadow-sm`, `shadow-md` | `<Card className="shadow-sm">` |
| Motion | `duration-fast`, `duration-slow` | `<Progress className="duration-slow">` |
| Opacity | `opacity-disabled`, `opacity-muted` | `<Input className="disabled:opacity-disabled">` |
| Layout / control height | `h-9`, `h-7`, `h-11`, `size-9` | `<Button className="h-9">` (Tailwind default scale; `--control-height*` tokens are not emitted) |

## Component Spec System

Each component has a `.spec.json` file that serves as the **single source of truth** for AI coding rules:

```jsonc
// src/harness/schema/components/button.spec.json
{
  "name": "Button",
  "description": "Primary action trigger with multiple variants and sizes",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["default", "destructive", "outline", "secondary", "ghost", "link"],
      "default": "default"
    },
    "size": {
      "type": "enum",
      "values": ["default", "sm", "lg", "icon"],
      "default": "default"
    }
  },
  "styleLock": ["font-family", "line-height"],
  "forbiddenPatterns": ["inline color hex", "arbitrary spacing"],
  "aiPrompt": "Use semantic variant names. Never hardcode colors or spacing."
}
```

These specs are automatically synced to `.cursorrules` via `harness sync`, ensuring AI tools always have current component APIs.

## CLI Reference

```
harness start [dir]     Initialize + install + launch Storybook portal
harness init [dir]      Create .harness/ and .cursor/ scaffolding
harness dev [dir]       Start Storybook development server (port 6006)
harness sync [dir]      Regenerate .cursorrules + Tailwind config from specs
harness audit [dir]     Run compliance checks against component specs
harness upgrade [dir]   Pull latest npm kit (preserves local modifications)
harness mcp [dir]       Start MCP server for AI agent integration
harness help            Show help
```

## MCP Integration

HarnessUI includes a [Model Context Protocol](https://modelcontextprotocol.io/) server for deep AI integration:

```bash
npx harness mcp
```

The MCP server exposes:
- **Component specs** — Full schema data for each component
- **Token registry** — All derived token values and categories
- **Audit results** — Real-time compliance status

Configure in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "harness": {
      "command": "npx",
      "args": ["harness", "mcp"]
    }
  }
}
```

## Project Structure

```
harness-design/
├── bin/
│   ├── harness.mjs              # CLI entry point
│   └── harness-mcp.mjs          # MCP server
├── scripts/
│   ├── emit-design-tokens-css.mjs   # Token → CSS pipeline
│   ├── sync-from-schema.mjs         # Spec → .cursorrules
│   ├── harness-audit.mjs            # Compliance auditor
│   └── generate-cursorrules.mjs     # Rule file generator
├── src/
│   ├── components/
│   │   ├── starter/             # 23 base components (Radix + tokens)
│   │   └── business/            # Business-layer compositions
│   ├── design-tokens/
│   │   ├── tokens.json          # Seed → Map token definitions
│   │   ├── seed-to-map.mjs      # Derivation engine (~175 vars)
│   │   ├── token-registry.ts    # Runtime token lookup
│   │   └── story-controls.ts    # Storybook ↔ token bindings
│   ├── harness/
│   │   ├── schema/components/   # 23 component .spec.json files
│   │   ├── patterns/            # Carbon/Material pattern refs
│   │   └── rules/               # Generated governance rules
│   └── styles/
│       ├── globals.css           # Tailwind imports + base layer
│       └── design-tokens.generated.css  # Auto-generated token CSS
├── .storybook/                  # Storybook 8 config (React + Vite)
├── docs/                        # Architecture & boundary docs
├── AGENTS.md                    # AI coding contract
├── tailwind.config.ts           # Tailwind v4 + harness extensions
└── package.json
```

## Upgrade Strategy

HarnessUI is designed like [shadcn/ui](https://ui.shadcn.com/) — components live in **your codebase**, not hidden in `node_modules`:

```bash
# First install
npm install harness-design
npx harness init

# Later: upgrade adds new components, preserves your modifications
npm update harness-design
npx harness upgrade
```

The upgrade system uses **content hashing** to detect which components you've modified:
- **Unmodified components** → overwritten with latest version
- **Modified components** → preserved, flagged in Storybook sidebar
- **New components** → added automatically

## Monorepo Setup

For monorepo projects, the recommended structure separates concerns cleanly:

```
my-project/
├── packages/
│   └── business-ui/          # Your component library (single source of truth)
│       ├── src/components/   # Components copied from .harness/
│       ├── tokens.json       # Your customized tokens
│       └── package.json      # @acme/business-ui
├── apps/
│   └── web/                  # Business application
│       └── src/              # imports from @acme/business-ui
├── .harness/                 # Storybook portal + sync tools
└── .cursor/                  # AI rules + MCP config
```

Key constraint: **`.harness/` depends on `packages/business-ui`**, never the reverse.

## For AI Tools & LLMs

> **If you're an AI reading this**: HarnessUI provides structured component specifications at `src/harness/schema/components/*.spec.json`. Each spec defines the component's props, allowed variants, style constraints, and forbidden patterns. Always check the spec before generating code that uses a HarnessUI component. Use `@design` import aliases. Never hardcode colors — use semantic token classes like `bg-primary`, `text-destructive`. For spacing, use token-mapped Tailwind classes (`p-sm`, `gap-base`) instead of arbitrary values.

The `.cursorrules` file (auto-generated by `harness sync`) contains the full AI coding contract:
- Allowed Tailwind classes per token category
- Forbidden patterns (no magic numbers, no inline hex, no arbitrary spacing)
- Component prop APIs and default values
- Import conventions and path aliases

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Components | [Radix UI](https://www.radix-ui.com/) primitives + [CVA](https://cva.style/) variants |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) with `@theme inline` token mapping |
| Token Engine | Ant Design algorithm ([`@ant-design/colors`](https://github.com/ant-design/ant-design-colors)) |
| Build | [Vite 6](https://vite.dev/) + custom schema API plugin |
| Storybook | [Storybook 8](https://storybook.js.org/) with React + Vite |
| Color Science | [OKLCH](https://oklch.com/) perceptual color space via [Culori](https://culorijs.org/) |
| Type Safety | [TypeScript 5](https://www.typescriptlang.org/) with strict mode |
| AI Protocol | [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Run type checks (`npm run typecheck`)
4. Run token sync (`npm run sync:tokens`)
5. Run audit (`npm run harness:audit`)
6. Commit your changes
7. Push to the branch and open a Pull Request

## License

[MIT](LICENSE) &copy; 2026 [Gusgoooo](https://github.com/Gusgoooo)
