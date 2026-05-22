/**
 * Docs page sections. Each section is rendered as markdown by DocsRoute.
 * The left nav lists section titles; the right "On this page" ToC is
 * extracted from h2/h3 headings inside the active section.
 */

export type DocsSection = {
  id: string;
  title: string;
  description?: string;
  markdown: string;
};

export const SECTIONS: DocsSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    description: "What Design-anchor is and why it exists.",
    markdown: `
## What is Design-anchor?

Design-anchor is a **token-driven design system + AI governance pipeline** that makes it structurally hard for AI coding tools to drift away from your design language.

Drop it into any React + Tailwind project with one command. You get:

- A complete component library (60+ shadcn-aligned base components)
- A live visual **token customizer** (color / radius / spacing / font seeds → derives 100+ semantic tokens)
- A **spec.json contract** per component (what props, what's forbidden, what tokens are baseline)
- Generated AI rules consumed by Cursor / Claude Code / Copilot / Qoder
- An **MCP server** that exposes the schema and audit tooling to any MCP-aware agent

## The problem

AI coding tools generate beautiful UI in isolation, but lose context across conversations:

- Same button rendered with 3 different border radii across 3 pages
- The same grey is \`gray-100\` here, \`#e5e7eb\` there, \`gray-200\` in a third place
- Spacing drifts from \`p-4\` to \`p-[15px]\` to \`py-3.5\`

After a few weeks of AI-assisted work, an enterprise product starts to look like it was built by 10 different teams. Adding a Figma library or design.md prompt doesn't fix it — soft constraints get forgotten on the 50th edit.

## How Design-anchor fixes it

Design seeds → derived tokens → component className → AST audit. Every node in the chain is **enforced**, not "documented":

1. You set ~14 seed tokens (colorPrimary, fontSize, borderRadius, sizeUnit, …)
2. The seed-to-map algorithm derives 200+ CSS variables (semantic colors, spacing scale, font scale)
3. Components reference tokens (\`bg-primary\` → \`var(--primary)\`); changing the seed re-skins everything live
4. \`spec.json\` per component declares what's allowed (forbidden tags, baseline classes, blacklist patterns)
5. \`anchor audit\` AST-scans business code for violations
6. AI tools read \`.cursorrules\` / \`CLAUDE.md\` / MCP responses and self-correct
`,
  },

  {
    id: "quickstart",
    title: "Quickstart",
    description: "Zero to running portal in one command.",
    markdown: `
## One command

In any project directory:

\`\`\`bash
npx anchor start
\`\`\`

This is the all-in-one. It will:

1. **\`init\`** — install the \`.anchor/\` subtree (a complete component library sub-project)
2. **\`install\`** — \`npm install\` inside \`.anchor/\` so the portal can run
3. **\`dev\`** — start the Portal at <http://localhost:6006>

Open the printed URL in your browser.

## What gets created in your project

\`\`\`
your-project/
├── .anchor/                    ← Design-anchor subtree (gitignored or vendored)
│   ├── src/components/base/   60+ ready-to-use React + Tailwind components
│   ├── src/anchor/schema/     per-component spec.json contracts
│   ├── src/design-tokens/     tokens.json + seed-to-map algorithm
│   └── package.json           own deps (Vite + React + Radix + …)
├── .cursorrules                AI-readable design contract (auto-regenerated)
├── .cursor/rules/anchor.mdc    Cursor-specific rule file
├── CLAUDE.md                   Claude Code project instructions
└── ANCHOR_INTEGRATION.md       one-page consumer guide
\`\`\`

## First interactions

In the Portal (top nav):

- **Docs** — you're reading them.
- **Design Token** — the visual customizer. Edit a seed on the left, watch the right preview update live. Hit **Save & Sync** to write to disk and regenerate \`.cursorrules\`.
- **Components** — browse the 60+ base components. Pick one to see its preview + controls.

## Importing components into your app

Add a TypeScript path alias \`@design\` → \`.anchor/src\` so imports stay short:

\`\`\`ts
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@design": [".anchor/src/components/base"]
    }
  }
}
\`\`\`

Then in your business code:

\`\`\`tsx
import { Button } from "@design";

export function CTA() {
  return <Button>Save changes</Button>;
}
\`\`\`
`,
  },

  {
    id: "token-system",
    title: "Token System",
    description: "Seeds → derived → CSS variables → components.",
    markdown: `
## The four layers

1. **Seeds** (\`.anchor/src/design-tokens/tokens.json\`) — ~14 user-editable knobs
2. **Derived map** — 200+ CSS variables computed by \`seed-to-map.mjs\` (Antd algorithm + custom mappings)
3. **\`@theme inline\`** block — wires the derived vars into Tailwind v4 utilities (\`bg-primary\` → \`var(--primary)\`)
4. **Component className** — uses the Tailwind utilities

Editing any seed re-runs the chain and re-skins the entire UI instantly.

## The seed set

| Category | Seeds | What it drives |
|---|---|---|
| Brand | colorPrimary / Success / Warning / Error / Info / Link | All semantic color slots + every component using \`bg-primary\` etc. |
| Surface | colorBgBase / colorTextBase | Light/dark anchors → 30+ derived neutrals (ink ladder, fills, borders) |
| Typography | fontSize | Drives \`text-xs\` through \`text-3xl\` font-size scale |
| Shape | borderRadius | Drives \`rounded-sm/md/lg/xl\` ladder |
| Spacing | sizeUnit (4px default) | Drives the full Tailwind \`p-N\` / \`gap-N\` / etc. scale |
| Charts | chart1 – chart5 (in \`customSeeds\`) | Chart palette for Recharts |

## Dark mode

The customizer toggle in the top nav flips between editing \`seed\` (light) and \`seedDark\` (dark overrides). Only the values you change get written to \`seedDark\` — everything else inherits from light.

## Per-slot overrides

Any individual derived token (e.g. \`muted\`, \`accent\`, \`border\`) can be overridden without changing the parent seed. In the customizer's **Surfaces > Derived** subgroup, click a row to open the editor and enter a custom value. The override lands in \`mapOverrides.light\` or \`mapOverrides.dark\` in \`tokens.json\`.

## Save & Sync

The "Save & Sync" button in the customizer:

1. POSTs the edited \`tokens.json\` to the dev server's \`/api/save-design-tokens\` endpoint
2. The plugin writes to disk and runs \`npm run sync:tokens\`
3. \`design-tokens.generated.css\` is rewritten
4. Vite HMR picks up the change → entire UI re-skins in ~200ms
`,
  },

  {
    id: "cli",
    title: "CLI Reference",
    description: "Every `anchor` command.",
    markdown: `
## Commands

\`\`\`bash
npx anchor <command> [args]
\`\`\`

| Command | Behaviour |
|---|---|
| \`start [dir]\` | One-click. Init + npm install + open Portal. The most common entry. |
| \`init [dir]\` | Scaffold \`.anchor/\` only (no install, no dev). Use when integrating into CI. |
| \`dev [dir]\` | Start the Portal against an existing \`.anchor/\`. |
| \`sync [dir]\` | Re-run schema + tokens sync. Regenerates \`.cursorrules\` / Tailwind / rules. Useful after manually editing \`tokens.json\` or a \`spec.json\`. |
| \`audit [dir]\` | AST-scan business code for forbidden tags + arbitrary-value Tailwind on token-sensitive prefixes. |
| \`upgrade [dir]\` | Pull the latest \`.anchor/\` template (preserves your tokens / custom components). |
| \`mcp [dir]\` | Start the MCP server on stdio. See [MCP Server](#mcp-server). |
| \`add <Component>\` | Import a new component into \`.anchor/src/components/base/\` and scaffold its spec + demo. |

## Common flows

### Customize tokens via terminal

\`\`\`bash
$EDITOR .anchor/src/design-tokens/tokens.json
npx anchor sync
\`\`\`

### Audit before commit

\`\`\`bash
npx anchor audit
\`\`\`

Add to a pre-commit hook via husky / lefthook so AI-generated drift fails CI.

### Re-init after pulling template updates

\`\`\`bash
npx anchor upgrade
\`\`\`

## Environment

The CLI looks for \`.anchor/\` in the current working directory by default. Pass a path as the last argument to point elsewhere:

\`\`\`bash
npx anchor dev ./apps/web
\`\`\`

The Portal starts on port 6006 by default. If the port is taken, it tries 6007, 6008, etc.
`,
  },

  {
    id: "mcp-server",
    title: "MCP Server",
    description: "Expose schema + audit + tokens to MCP-aware agents.",
    markdown: `
## What it does

MCP (Model Context Protocol) lets AI agents call structured tools. The Design-anchor MCP server exposes your schema, tokens, and audit pipeline as 13 tools, so agents can:

- List / read / create components programmatically
- Read and update individual tokens
- Read and update \`spec.json\` files
- Run audit and sync from inside a chat

## Tools exposed

| Tool | Purpose |
|---|---|
| \`list_components\` | Enumerate every component in the library |
| \`read_component <name>\` | Get the TSX source of one component |
| \`create_component <name> <code>\` | Add a new component + scaffold a demo |
| \`list_tokens\` | List all design tokens (id, light, dark, category) |
| \`update_token <id> <field> <value>\` | Change a single token value |
| \`list_schemas\` | List every \`spec.json\` filename |
| \`read_schema <name>\` | Read one spec |
| \`update_schema <name> <json>\` | Overwrite a spec (validated) |
| \`run_audit\` | Run \`anchor audit\` and return diagnostics |
| \`run_sync_rules\` | Run \`sync:anchor\` and return success/error |
| \`get_cursorrules\` | Return the generated \`.cursorrules\` text |
| \`read_file <relPath>\` | Read any file inside \`.anchor/\` |
| \`write_file <relPath> <content>\` | Write a file inside \`.anchor/\` |

## Wire it into Cursor

Add to \`.cursor/mcp.json\` at your project root:

\`\`\`json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
\`\`\`

Restart Cursor. The tools show up in the chat tool palette.

## Wire it into Claude Code

In your project, add to \`.mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "design-anchor": {
      "command": "npx",
      "args": ["anchor", "mcp", "."]
    }
  }
}
\`\`\`

Or globally: \`claude mcp add design-anchor npx anchor mcp .\`

## Wire it into other MCP clients

The server speaks the standard MCP stdio JSON-RPC. Any client (Continue, Cline, Zed, Qoder) that supports MCP config can point at \`npx anchor mcp .\` the same way.

## Verify it's running

\`\`\`bash
# In one terminal — start the server in stdio mode
npx anchor mcp .
\`\`\`

It blocks on stdin waiting for JSON-RPC messages. From an agent, the first thing you'll see is a \`tools/list\` response with the 13 tools above.
`,
  },

  {
    id: "auditing",
    title: "Auditing & Governance",
    description: "What `anchor audit` checks and what it ignores.",
    markdown: `
## What gets flagged

\`anchor audit\` AST-walks every \`.tsx\` file in your business code (skipping \`.anchor/\`, demos, fixtures) and flags two classes of issues:

### 1. Forbidden native tags

If a component \`spec.json\` declares e.g. \`<button>\` as forbidden, every use of raw \`<button>\` outside the library is an error.

\`\`\`json
"forbidden": [
  {
    "htmlTag": "button",
    "reason": "Raw <button> bypasses variant + size contract",
    "useInstead": "@design Button"
  }
]
\`\`\`

### 2. Arbitrary-value Tailwind on token-sensitive prefixes

The audit differentiates **critical** prefixes from **layout** prefixes:

**Flag (must be token or var(--…))**:
- Colors: \`bg / text / border / ring / fill / stroke / from / to / via / outline / accent / caret / decoration / divide / placeholder / shadow\`
- Spacing: \`p / px / py / pt / pb / pl / pr / m / mx / my / mt / mb / ml / mr / gap / gap-x / gap-y / space-x / space-y\`
- Radius: \`rounded / rounded-{side}\`

**Allow (one-off layout/positioning is fine)**:
- \`w / h / min-w / max-w / min-h / max-h\` (component sizing)
- \`top / right / bottom / left / inset\` (positioning)
- \`translate-x / translate-y\` (transforms)
- \`grid-cols / grid-rows / col-span / row-span\` (grid)
- \`aspect / z\`
- Any \`[var(--…)]\` (already a token via CSS variable)

So \`w-[280px]\` and \`max-w-[480px]\` are allowed (one-off layout pixels), but \`bg-[#0204a3]\` and \`p-[13px]\` are flagged (must be tokens).

## Suppressing rules

Edit \`src/anchor/linter/audit-config.json\`:

\`\`\`json
{
  "scanRoots": ["src"],
  "excludePathSubstrings": [
    "/node_modules/",
    "/components/base/",
    "/__fixtures__/"
  ],
  "reportForbiddenHtmlFromSpecs": true,
  "flagArbitraryTailwind": true
}
\`\`\`

## CI integration

\`\`\`yaml
# .github/workflows/ci.yml
- run: npx anchor audit
\`\`\`

Fails the build on any violation. Add as a pre-commit hook for tighter feedback:

\`\`\`bash
# .husky/pre-commit
npx anchor audit
\`\`\`
`,
  },

  {
    id: "ai-integration",
    title: "AI Tool Integration",
    description: "Cursor, Claude Code, Copilot, Qoder.",
    markdown: `
## Generated artifacts

\`anchor sync\` regenerates four AI-readable files. Each consumes them differently:

| File | Consumed by |
|---|---|
| \`.cursorrules\` | Cursor (always-applied project rules) |
| \`.cursor/rules/anchor.mdc\` | Cursor (rule registry; alwaysApply: true) |
| \`.cursor/rules/anchor-selfcheck.mdc\` | Cursor (post-edit self-check checklist) |
| \`CLAUDE.md\` | Claude Code (project instructions) |
| \`.windsurfrules\` | Windsurf |
| \`.github/copilot-instructions.md\` | GitHub Copilot Chat |
| \`src/anchor/rules/ANCHOR_RULES.md\` | Shared canonical version (markdown source) |

## Cursor

After \`anchor start\`, restart Cursor and open the project. The \`anchor.mdc\` rule is auto-applied to every chat. Try:

> "Add a confirm dialog when the user clicks Delete."

Expected behaviour: Cursor reaches for \`@design AlertDialog\` (not raw \`<dialog>\`) and uses \`destructive\` variant for the action button.

## Claude Code

CLI users: \`CLAUDE.md\` is read automatically when Claude Code starts in that directory. Try:

\`\`\`bash
cd your-project
claude
\`\`\`

Then prompt:

> "Show me where to put a new dashboard card."

Expected: Claude references the \`Card\` component from \`@design\` and respects the spec's baseline tokens.

## GitHub Copilot

Copilot Chat reads \`.github/copilot-instructions.md\`. The rules tell Copilot to:

- Import from \`@design\` (not from \`@radix-ui\` directly)
- Use semantic props (\`variant\`, \`size\`) instead of stacking Tailwind overrides
- Use design tokens for colors and spacing

## Qoder (and other MCP-aware tools)

Wire up the MCP server (see [MCP Server](#mcp-server)). Once connected, the agent can:

- Call \`list_components\` to discover what's available
- Call \`read_schema\` to read the spec before generating code
- Call \`run_audit\` after each edit to self-verify

## Self-check loop

\`.cursor/rules/anchor-selfcheck.mdc\` is a checklist the agent runs after each round of edits:

1. Are all imports from \`@design\`?
2. Are forbidden native tags absent?
3. Is any arbitrary-value Tailwind on color/spacing/radius prefixes?
4. Are component semantic props (\`variant\`, \`size\`) used instead of className overrides?

The agent self-corrects before returning the diff.
`,
  },

  {
    id: "spec-json",
    title: "Component Specs",
    description: "The `spec.json` contract per component.",
    markdown: `
## Why specs

Every component has a sibling \`*.spec.json\` in \`.anchor/src/anchor/schema/components/\`. The spec is the **single source of truth** for:

- What native HTML tags this component replaces (forbidden tags → audit)
- What props the component accepts (for typed AI generation)
- What className tokens are baseline (must be present)
- What className patterns are blacklisted (must not be added)
- Reusable code examples (for AI to crib from)
- AI prompt fragment merged into \`.cursorrules\`

## Schema shape

\`\`\`json
{
  "id": "button",
  "componentName": "Button",
  "version": "1.0.0",
  "intent": "Unified clickable action entry. Raw <button> with manual styling is forbidden.",
  "wraps": {
    "module": "@/components/base/button",
    "primitives": ["Button"]
  },
  "requiredProps": [...],
  "optionalProps": [...],
  "styleLock": {
    "baselineTokens": ["inline-flex", "rounded-md", "font-medium", "transition-colors"],
    "blacklist": [
      { "description": "...", "pattern": "^(h-|px-|py-)" }
    ]
  },
  "aiPrompt": "Always use Button from @design — never raw <button>. Pick variant by intent...",
  "forbidden": [
    { "htmlTag": "button", "reason": "...", "useInstead": "@design Button" }
  ],
  "corrections": [
    { "id": "no-raw-button", "violation": "...", "fixPrompt": "Replace with Button..." }
  ],
  "examples": [
    { "title": "Primary CTA", "snippet": "<Button>Save</Button>" }
  ],
  "meta": { "tags": ["button"], "category": "action", "status": "stable" }
}
\`\`\`

## How fields are used

| Field | Used by |
|---|---|
| \`intent\`, \`aiPrompt\`, \`examples\` | \`.cursorrules\` generator → AI tools |
| \`forbidden\` | \`anchor audit\` flags violations |
| \`corrections\` | AI sees these to know how to fix violations |
| \`styleLock.baselineTokens\` | Runtime \`stripLockedClasses\` enforces |
| \`styleLock.blacklist\` | Runtime + audit both check |
| \`requiredProps\` / \`optionalProps\` | Auto-generated Controls panel in the Portal |
| \`meta.category\` | Sidebar grouping |

## Editing specs

Open the Components tab → pick any component → switch to **Spec.json** tab in the bottom panel → edit → Save. The MCP \`update_schema\` tool exposes the same operation to agents.

After editing, run \`npx anchor sync\` to regenerate \`.cursorrules\` (or let the portal's auto-sync handle it).
`,
  },

  {
    id: "faq",
    title: "FAQ",
    description: "Common questions.",
    markdown: `
## Why isn't my token change reflected?

Two cases:

1. **In the Portal preview**: edits go to a draft; click **Save & Sync** to commit. The preview already reflects the draft live, but disk + downstream tools need the explicit save.
2. **In your business app**: after Save & Sync, the Tailwind generated CSS (\`.anchor/src/styles/design-tokens.generated.css\`) gets rewritten. Your app's Vite HMR / Webpack should pick it up. If not, restart the dev server.

## Why does the Controls panel show controls that don't do anything?

The auto-controls scan the component source for Tailwind classes and offer overrides. But classes inside scoped selectors (\`[&>input]:pb-3\`, \`has-[]:...\`, \`data-[state=active]:...\`) can't be overridden by a root-level className. Components with heavy use of these (InputGroup, Sidebar) hide those controls via \`hidePrefixes\` in their demo files.

## Can I add my own components?

Yes. Two ways:

1. **Portal UI**: Components tab → "Add Component" → paste local path. The component is copied into \`.anchor/src/components/base/\` and a starter demo is scaffolded.
2. **CLI**: \`npx anchor add MyComponent\`

Then write a \`spec.json\` in \`.anchor/src/anchor/schema/components/\` to declare its contract.

## Can I remove components I'm not using?

The library is small enough that tree-shaking handles unused components automatically. If you want to physically remove them, just delete the \`.tsx\` + \`spec.json\` and run \`anchor sync\`.

## How do I customize per-slot semantic colors (e.g. make \`muted\` warmer)?

In the customizer, open **Surfaces > Derived > Semantic** subgroup and click any row (e.g. \`muted\`). The editor opens and writes to \`mapOverrides.light\` (or \`.dark\`). The override survives token regeneration.

## Where does my data live?

Everything is local. Tokens are in \`.anchor/src/design-tokens/tokens.json\`. Components are in \`.anchor/src/components/base/\`. Specs are in \`.anchor/src/anchor/schema/components/\`. Generated artifacts (\`.cursorrules\` etc.) are at the project root. Nothing leaves your machine.

## How do I update Design-anchor?

\`\`\`bash
npx anchor upgrade
\`\`\`

Updates the \`.anchor/\` template files in place. Your seeds, custom components, and spec edits are preserved.
`,
  },
];
