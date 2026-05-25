# Image-reference workflow

When the user uploads a screenshot, mockup, or any visual reference and asks
the AI to build the UI, the agent must **ask which path** before generating
code.

## Path A — Extract tokens, override the library

Analyse the reference image and propose a diff against
`.anchor/src/design-tokens/tokens.json` covering at minimum:

- `colorPrimary` (and Success / Warning / Error / Info / Link if visible)
- `colorBgBase` / `colorTextBase`
- `borderRadius`
- `fontSize`
- `sizeUnit`

After the user confirms the diff, run `anchor sync` so every component
re-skins to match the reference.

### Automated path (recommended)

Don't eyeball-extract values yourself. Use one of:

- **CLI**: `anchor screenshot <image>` — interactive diff in the terminal,
  applies on `y`. Requires `OPENAI_API_KEY`.
- **MCP** (Cursor / Claude Code): call `extract_tokens_from_screenshot`
  with `{ imagePath }`, present the returned diff to the user, and only
  call `apply_token_extraction` after the user picks fields to accept.
- **Portal**: open Design Token tab → "Extract from screenshot" button
  → drop image → review diff → "Apply to draft" merges into the live
  preview; user clicks Save & Sync to commit.

All three paths share the same vision core and never write to disk
without explicit user approval.

**Use this when** the user wants the product to *look like* the reference,
or the reference is a brand redesign (new logo + palette).

## Path B — Follow existing tokens

Keep tokens untouched. Compose the new layout from existing `@design`
components — the result inherits the product's existing visual language.
Colors, radii, spacing stay the same; only the arrangement is new.

**Use this when** the reference is just a layout hint (where things go,
in what proportion) but should not change the brand or visual language.

## Default

If the user is silent or ambiguous, **default to Path B**. Path A changes
shared design tokens that affect every page in the product — it should be
an explicit choice, never a silent side effect.

## What's never OK

Silently inventing colors or radii from a screenshot without either path's
explicit consent. A hardcoded `bg-[#0204a3]` in business code is rejected
by `anchor audit` regardless of how it got there.
