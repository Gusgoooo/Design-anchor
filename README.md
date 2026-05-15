<p align="center">
  <img src="https://img.shields.io/npm/v/design-accord?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/design-accord?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Copilot%20%7C%20Claude-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">DesignAccord</h1>

<p align="center"><strong>Protocol is Design</strong></p>

<p align="center">
  <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## The Problem: AI Makes Beautiful UI — Once

AI coding tools generate UI fast. But over time, your product drifts into visual chaos:

- **The same button** appears with 3 different border radii across 3 pages
- **The same "gray"** is `gray-100` in one place, `gray-200` in another, `#e5e7eb` in a third
- **The same spacing** is `p-4` here, `p-[15px]` there, `py-3.5` somewhere else

This isn't a one-off mistake — it's a **systematic failure mode of AI coding**. Every new conversation, every new prompt, the AI loses context of what it did before. The drift compounds. After a few weeks of AI-assisted development, your enterprise product looks like it was built by 10 different teams.

### Why existing solutions fail

| Approach | Why it breaks |
|----------|--------------|
| **Atomic component libraries** (shadcn, Radix, etc.) | No semantic guidance. AI doesn't know *when* to use which component or *how* to style it consistently. It still writes arbitrary values. |
| **design.md / system prompts** | Soft constraints. Works for one-shot generation — "make it look like Airbnb". But on the 50th edit, AI forgets. No enforcement, no audit, no pipeline. |
| **Manual code review** | Doesn't scale. You hired AI to move fast — now you're reviewing spacing values? |

### What DesignAccord does differently

DesignAccord is a **governance pipeline** that makes design drift structurally impossible:

```
Design Prompt → Extract Seed Tokens → Map to 100+ Semantic Tokens
     → Modify Base Components → Lock Styles via spec.json
     → Auto-audit every AI edit → Enforce via IDE rules
```

**After one setup**, every subsequent AI generation is constrained to your design system. The same button always has the same radius. The same spacing always uses the same scale. Not because the AI "remembers" — because it physically cannot deviate.

> **design.md tells AI "please be consistent". DesignAccord tells AI "you can only use these exact values, and I will check after every edit."**

This is the missing enforcement layer for design.md — and it's most effective for **B2B / enterprise products** where visual consistency directly impacts trust and usability.

---

## Core Features

| | Feature | Description |
|---|---|---|
| **1** | Protocol-Driven | spec.json is the single source of truth. Component behavior, style constraints, and AI prompts all derive from protocol |
| **2** | One Command Pipeline | `npx accord start` — from zero to component library + Storybook + AI rules in one command |
| **3** | AI Governance Built-in | Auto-generates rules for Cursor, Claude Code, Windsurf, Copilot, and any AI tool |
| **4** | Token Pipeline | 10 seed values → 175+ CSS variables → Tailwind v4 `@theme` mapping |
| **5** | Component = Compliance | Every component carries audit rules; `accord audit` detects violations instantly |
| **6** | Govern Mode | `accord govern` — zero-intrusion governance for existing projects (rules only, no source changes) |

---

## Who is it for?

**Product teams building with AI** — You need design consistency enforced at the pipeline level, not policed in code review.

**AI-native developers** — Using Cursor / Copilot / Claude Code daily. You need AI output to follow a unified design language instead of drifting with every session.

**Startups without a dedicated design team** — No full-time designer, but your enterprise product needs to look like one person designed it. Let protocol replace manual review.

---

## Quick Start

```bash
# 1. Install
npm install design-accord

# 2. Initialize + Launch
npx accord start

# 3. Done — Storybook portal opens, AI rules are configured for all tools
```

After `accord start`:
- `.accord/` — Component library + Storybook + Token system
- `.cursor/rules/` — AI coding governance rules (auto-applied)
- `CLAUDE.md` — Claude Code governance + workflow
- `.windsurfrules` — Windsurf governance rules
- `.github/copilot-instructions.md` — GitHub Copilot instructions
- `AGENTS.md` — AI coding boundary contract

---

## CLI

```
accord start [dir]     One-click launch (init + install + open Portal)
accord init  [dir]     Initialize component library
accord govern          Govern mode: inject AI rules only, no components (for existing projects)
accord theme <file>    Extract tokens from a Design Prompt file
accord dev   [dir]     Start Storybook Portal
accord sync  [dir]     Regenerate rules + Tailwind config from spec.json
accord audit [dir]     Run compliance audit
accord upgrade [dir]   Upgrade kit (preserves your modifications)
accord mcp   [dir]     Start MCP Server (Cursor Agent integration)
```

---

## How the Pipeline Works

```
spec.json (Design Protocol)
    │
    ├──► Components (23 production-ready, Radix + CVA)
    ├──► Token CSS (175+ variables, light/dark)
    ├──► Tailwind v4 @theme (utility classes)
    ├──► AI rules (Cursor + Claude Code + Windsurf + Copilot)
    ├──► MCP Server (real-time AI context)
    └──► accord audit (compliance check)
```

One source. Multiple outputs. Zero drift.

---

## Why not just design.md?

| | design.md | DesignAccord |
|---|---|---|
| **Nature** | Natural language doc for AI to "try to follow" | Executable JSON protocol + automation pipeline |
| **Enforcement** | AI "suggests" compliance — often ignored on edit #50 | `accord audit` enforces and reports violations |
| **Components** | Describes "you should have a Button" | Provides Button source + spec + import path + style lock |
| **Maintenance** | Manual updates, easily outdated | `accord sync` auto-regenerates rules from spec.json |
| **Scene Routing** | "Please use our components" (AI doesn't know which) | Scene → Component lookup table — AI checks before writing |
| **Validation** | None | `accord audit` produces a compliance report |
| **Tokens** | "Primary color is #1677ff" (AI still writes `#1677ff` inline) | Seed → 175+ CSS vars → Tailwind mapping. Change seed, everything updates. |
| **Multi-tool** | Copy-paste to each tool's config | One `accord govern` generates rules for all AI tools |

> **design.md is the vision. DesignAccord is the enforcement.**
> Use both together — design.md for aesthetic intent, DesignAccord for structural compliance.

---

## Design Token System

### Seed → Map Pipeline

DesignAccord uses a **two-layer token architecture** inspired by Ant Design's token system:

```jsonc
// tokens.json — you only edit the seed layer
{
  "version": 2,
  "seed": {
    "colorPrimary": "#1677ff",    // → derives 10-level color scale + semantic aliases
    "colorSuccess": "#52c41a",    // → success-bg, success-border, success-text, ...
    "fontSize": 14,               // → 7-level type scale tokens
    "borderRadius": 6,            // → xs/sm/md/lg/xl radius scale
    "sizeUnit": 4,                // → spacing-* scale
    "sizeStep": 4,                // → paired with sizeUnit for spacing derivation
    "motionUnit": 0.1             // → fast/mid/slow motion duration tokens
  },
  "seedDark": {
    "colorBgBase": "#000000",     // → auto-derives dark mode palette
    "colorTextBase": "#ffffff"
  },
  "fixedAliases": {
    "opacityDisabled": 0.5,       // → disabled:opacity-disabled
    "fontWeightMedium": 500,      // → font-medium
    "fontWeightSemibold": 600     // → font-semibold
  }
}
```

Run `npm run sync:tokens` to generate a single CSS file with three sections:

### Tailwind v4 `@theme` Mapping

Tokens are mapped via Tailwind's `@theme inline` directive, enabling native utility classes:

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
  /* ~60 Tailwind-mapped tokens */
}
```

### Token Usage in Components

| Category | Tailwind Class | Example |
|----------|---------------|---------|
| Color | `bg-primary`, `text-destructive` | `<Button className="bg-primary">` |
| Spacing | `p-sm`, `gap-base`, `mt-xs` | `<Card className="p-lg">` |
| Radius | `rounded-md`, `rounded-lg` | `<Badge className="rounded-full">` |
| Typography | `text-sm`, `font-medium` | `<Label className="text-sm font-medium">` |
| Shadow | `shadow-sm`, `shadow-md` | `<Card className="shadow-sm">` |
| Motion | `duration-fast`, `duration-slow` | `<Progress className="duration-slow">` |
| Opacity | `opacity-disabled`, `opacity-muted` | `<Input className="disabled:opacity-disabled">` |

---

## Component Spec System

Every component has a `.spec.json` file — the **single source of truth** for AI coding rules:

```jsonc
// src/accord/schema/components/button.spec.json
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

These specs auto-sync to AI rules via `accord sync`, ensuring all AI tools always have the latest component API.

---

## Components

DesignAccord includes 23 production-ready components, each with a `.spec.json`, Storybook stories, and full token integration:

| Component | Key Features | Spec |
|-----------|-------------|------|
| **Alert** | 4 variants (default/error/success/warning), icon support | `alert.spec.json` |
| **Avatar** | Image + fallback, configurable sizes | `avatar.spec.json` |
| **Badge** | 5 variants, semantic colors | `badge.spec.json` |
| **Button** | 6 variants, 4 sizes, `asChild` composition | `button.spec.json` |
| **Card** | Header/Content/Footer composition | `card.spec.json` |
| **Checkbox** | Radix primitive, accessible | `checkbox.spec.json` |
| **Data Table** | Sort, filter, paginate, density modes | `data-table.spec.json` |
| **Dialog** | Modal + overlay, keyboard dismiss | `dialog.spec.json` |
| **Dropdown Menu** | Nested menus, keyboard navigation | `dropdown-menu.spec.json` |
| **Input** | Multiple types, disabled/error states | `input.spec.json` |
| **Label** | Associated disabled styling, semantic pairing | `label.spec.json` |
| **Popover** | Floating content + arrow | `popover.spec.json` |
| **Progress** | Animated value bar, token-driven duration | `progress.spec.json` |
| **Radio Group** | Radix grouping, accessible | `radio-group.spec.json` |
| **Scroll Area** | Custom scrollbar theming | `scroll-area.spec.json` |
| **Select** | Native select + token styling | `select.spec.json` |
| **Separator** | Horizontal/vertical + semantic spacing | `separator.spec.json` |
| **Skeleton** | Loading placeholder + animation | `skeleton.spec.json` |
| **Slider** | Range input, track/thumb theming | `slider.spec.json` |
| **Switch** | Toggle control, disabled opacity token | `switch.spec.json` |
| **Table** | Full table composition, sticky header | – |
| **Tabs** | List/Trigger/Content + active state | `tabs.spec.json` |
| **Textarea** | Min-height token, disabled opacity | `textarea.spec.json` |
| **Tooltip** | Delay animation + motion tokens | `tooltip.spec.json` |

---

## Multi-tool AI Governance

DesignAccord generates governance files for **every major AI coding tool** — not just Cursor:

| Tool | Config File | Automation |
|------|------------|-----------|
| Cursor | `.cursor/rules/*.mdc` + `.cursor/hooks.json` | Auto-runs `accord audit` after file save |
| Claude Code | `CLAUDE.md` | Inline workflow instructions |
| Windsurf | `.windsurfrules` | Inline governance rules |
| GitHub Copilot | `.github/copilot-instructions.md` | Inline governance rules |
| Generic (Cline, Continue, Aider) | `.cursorrules` + `AGENTS.md` | Reads project-root rule files |

One command (`accord govern` or `accord init`) configures all tools simultaneously.

---

## MCP Integration

DesignAccord includes a built-in [Model Context Protocol](https://modelcontextprotocol.io/) server for deep AI integration:

```bash
npx accord mcp
```

The MCP server exposes:
- **Component specs** — full schema data for each component
- **Token registry** — all derived token values and categories
- **Audit results** — real-time compliance status

---

## Architecture

```
tokens.json (seed layer)
    │
    ▼
emit-design-tokens-css.mjs ──► design-tokens.generated.css
    │                              ├── @theme inline { ... }    ← Tailwind utilities
    │                              ├── :root { ... }            ← CSS variables
    │                              └── .dark { ... }            ← Dark mode overrides
    ▼
*.spec.json (23 component specs)
    │
    ├──► sync-from-schema ──► .cursorrules + CLAUDE.md + .windsurfrules (AI rules)
    ├──► accord-audit ──► compliance report
    └──► Storybook Portal ──► visual editing + controls
```

### Token Flow: One Hop, Zero Drift

```
tokens.json ──(sync:tokens)──► design-tokens.generated.css ──► Tailwind v4 + Components
     │                                                              │
     └── Single file, three sections:                               │
         @theme (Tailwind mapping)                                  │
         :root  (non-Tailwind vars)                                 │
         .dark  (dark mode overrides)                               │
                                                                    ▼
                                                          AI reads governance rules
                                                         (auto-generated from specs)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Components | [Radix UI](https://www.radix-ui.com/) primitives + [CVA](https://cva.style/) variants |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + `@theme inline` token mapping |
| Token Engine | Ant Design algorithm ([`@ant-design/colors`](https://github.com/ant-design/ant-design-colors)) |
| Build | [Vite 6](https://vite.dev/) + custom Schema API plugin |
| Storybook | [Storybook 8](https://storybook.js.org/) + React + Vite |
| Color Science | [OKLCH](https://oklch.com/) perceptual color space via [Culori](https://culorijs.org/) |
| Type Safety | [TypeScript 5](https://www.typescriptlang.org/) strict mode |
| AI Protocol | [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) |

---

## Upgrade Strategy

DesignAccord follows the [shadcn/ui](https://ui.shadcn.com/) philosophy — component code lives in **your codebase**, not hidden in `node_modules`:

```bash
# First install
npm install design-accord
npx accord init

# Subsequent upgrades: auto-adds new components, preserves your modifications
npm update design-accord
npx accord upgrade
```

The upgrade system uses **content hashing** to detect modifications:
- **Unmodified components** → overwritten with latest version
- **Modified components** → preserved, marked in Storybook sidebar
- **New components** → added automatically

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Run type check (`npm run typecheck`)
4. Run token sync (`npm run sync:tokens`)
5. Run compliance audit (`npm run accord:audit`)
6. Commit your changes
7. Push and create a Pull Request

---

## License

[MIT](LICENSE) &copy; 2026 [Gusgoooo](https://github.com/Gusgoooo)

## Contact

Welcome to co-build or discuss: [q623814363@gmail.com](mailto:q623814363@gmail.com)

## Links

- GitHub: [https://github.com/Gusgoooo/DesignAccord](https://github.com/Gusgoooo/DesignAccord)

---

<p align="center"><em>Protocol is Design — Define design with protocols. Let the pipeline enforce execution.</em></p>
