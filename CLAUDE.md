<!--
  Design-anchor source repo — instructions for Claude Code CLI / Claude Desktop.
  This is the kit source itself (the thing that gets published as `design-anchor` on npm
  and scaffolded into consumer projects under `.anchor/`).
-->

# Design-anchor (source repo) — AI working rules

You are editing the **source** of the `design-anchor` npm package, not a consumer of it. There is no `.anchor/` folder here — the kit IS this repo. Layout:

- `src/components/base/` — 60+ shadcn-aligned React components (the library)
- `src/anchor/schema/components/*.spec.json` — per-component contracts (forbidden tags, baseline classes, blacklist, aiPrompt, examples)
- `src/design-tokens/tokens.json` — 14 seed tokens + dark overrides + customSeeds
- `src/design-tokens/seed-to-map.mjs` — seed → 200+ CSS variable derivation
- `src/styles/design-tokens.generated.css` — generated; **never edit by hand**
- `src/anchor-portal/` — the Vite + React Portal app (Docs / Design Token / Components tabs)
- `bin/` — CLI entrypoints (`anchor`, `anchor-mcp`, `postinstall`)
- `scripts/` — sync / audit / token-emit helpers
- `vendor/design-system-template/` — upstream shadcn snapshot for reference (read-only)

## The pipeline (don't break it)

```
seed (tokens.json) → seed-to-map.mjs → 200+ CSS variables → @theme inline → component className
```

Editing seeds is fine. After editing tokens.json, run `npm run sync:tokens`. After editing schemas, run `npm run sync:anchor`. Never hand-edit `design-tokens.generated.css` or `tailwind.anchor.generated.ts` — they're outputs.

## Hard rules when editing components in `src/components/base/`

1. **No hardcoded color values.** Use Tailwind semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`) or `var(--token-name)`. `bg-[#0204a3]` is rejected by `anchor audit`.
2. **No arbitrary Tailwind on token-sensitive prefixes.** Blocked: `bg / text / border / ring / fill / stroke / from / to / via / shadow / p / m / gap / rounded` with `[value]`. Allowed: `w / h / top / left / grid-cols / aspect / z` with `[value]` for one-off layout.
3. **No native `<button>`, `<input>`, `<table>` etc.** in places where a base component exists. Use the existing component or extend it.
4. **Stay token-driven.** If a value can't be expressed via existing tokens, add a token to `tokens.json` — don't inline it.

## Workflow rules

- **Adding a new component**: create `src/components/base/<Name>.tsx`, scaffold `src/anchor/schema/components/<name>.spec.json`, run `npm run sync:anchor`.
- **Changing component variants**: update both the component AND its spec (forbidden / baseline / examples).
- **Changing tokens**: edit `src/design-tokens/tokens.json`, run `npm run sync:tokens`. CSS variables regenerate.
- **Before finishing**: run `npm run anchor:audit` and `npx tsc --noEmit`; include a visible `Design Anchor 自检` line in the task summary when the change affects UI generation rules, components, or tokens. If the work changes UI behavior, also call out any `Design Anchor 自动治理` fix you made.

## Image-reference workflow

When the user uploads a screenshot / mockup as a reference and asks to build a page:
- Default to **Path B** — use existing tokens & components for the new layout (visual language stays consistent).
- Only go **Path A** (extract tokens + re-skin) if the user explicitly says "match this design" / "rebrand to this".
- Never silently invent hex values, radii, or spacing from the image. Audit will reject hardcoded values regardless.

Full rule: `src/anchor/rules/AGENTS_IMAGE_REFERENCE.md`.

## Useful commands

```bash
npm run dev                # Portal at http://localhost:6006
npm run typecheck          # tsc --noEmit
npm run sync:tokens        # regenerate design-tokens.generated.css from tokens.json
npm run sync:anchor        # regenerate .cursorrules + tailwind + rule mirrors from schema
npm run anchor:audit       # AST scan for forbidden tags + token violations
node bin/anchor.mjs <cmd>  # exercise the CLI locally
```

## MCP

`.mcp.json` is configured to load the local anchor MCP server (`bin/anchor-mcp.mjs`). 13 tools exposed: `list_components`, `read_component`, `create_component`, `list_tokens`, `update_token`, `list_schemas`, `read_schema`, `update_schema`, `run_audit`, `run_sync_rules`, `get_cursorrules`, `read_file`, `write_file`. Use them instead of grep/find when navigating the kit.

## Don't

- Don't introduce dependencies without checking `package.json` size impact.
- Don't add backwards-compat shims for renamed identifiers — full rename, delete old.
- Don't generate documentation files (`*.md`) unless explicitly asked.
- Don't run `anchor start` from inside this repo (it scaffolds `.anchor/` recursively — pointless and confusing).
