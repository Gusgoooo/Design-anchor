# AGENTS.md — AI Coding Boundaries & Contract

## Directory Conventions

1. **UI / Components / Token source of truth** → `src/components/` and `src/design-tokens/`
2. **Portal / sync / kit integration** → root-level CLI, scripts, .storybook
3. **Upstream npm package** → `node_modules/design-accord/` **read-only**, sync via `accord upgrade`

## AI Coding Contract

- **Imports**: Prefer `@design` alias; never import kit components from deep `node_modules` paths.
- **Colors**: Only Design Token semantic classes — no hardcoded color values.
- **Spacing**: No arbitrary Tailwind (`m-[13px]`) — use schema semantic props.
- **Component specs**: `src/accord/schema/components/*.spec.json` is the single source of truth.
- **After changes**: Run `npm run sync:accord` to regenerate .cursorrules.

## Workflow (auto-run after edits)

After modifying any .tsx/.jsx/.ts file:
1. Run `npx accord audit` — compliance check
2. Fix any violations before proceeding

After modifying any *.spec.json file:
3. Run `npx accord sync` — regenerate rules + Tailwind extensions

Before committing:
4. Run `npx tsc --noEmit` — type check
