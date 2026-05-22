<!--
  Design-anchor source repo — instructions for GitHub Copilot Chat.
  This is the kit source itself, not a consumer of it.
-->

# Design-anchor — Copilot rules

This is the `design-anchor` kit source (published to npm as `design-anchor`, scaffolded into consumer projects under `.anchor/`).

## Layout

- `src/components/base/` — 60+ React components (the library)
- `src/anchor/schema/components/*.spec.json` — per-component contracts
- `src/design-tokens/tokens.json` — 14 seeds + dark overrides
- `src/design-tokens/seed-to-map.mjs` — seed → CSS var derivation
- `src/styles/design-tokens.generated.css` — **generated**; never edit
- `src/anchor-portal/` — Portal (Vite + React)
- `bin/`, `scripts/` — CLI + helpers

## Hard rules

1. **No hardcoded colors.** Use Tailwind semantic classes (`bg-primary`, `text-muted-foreground`) or `var(--token)`. `bg-[#0204a3]` fails audit.
2. **No arbitrary Tailwind on `bg / text / border / ring / fill / stroke / from / to / via / shadow / p / m / gap / rounded`.** Allowed for one-off layout: `w / h / top / left / grid-cols / aspect / z`.
3. **No raw `<button>`, `<input>`, `<table>`** when a base component exists.
4. **Token-driven.** If a value doesn't exist as a token, add it to `tokens.json` — don't inline.

## Workflow

- New component → scaffold `*.spec.json` + run `npm run sync:anchor`
- Edit tokens → `npm run sync:tokens`
- Before finishing → `npm run anchor:audit` + `npx tsc --noEmit`

## Image reference

User uploads a screenshot? Default **Path B** (use existing tokens for new layout). Only **Path A** (re-skin via tokens.json diff) when the user explicitly says "match this design". Never invent hex values from screenshots.
