#!/usr/bin/env node
/**
 * Schema → Tailwind extend + safelist → .cursorrules + src/anchor/rules mirror
 * Run: npm run sync:anchor
 */
import fs from "node:fs";
import path from "node:path";
import { loadSpecs, loadDecorativeLibs, loadActivePresetStyle, getRepoRoot } from "./lib/load-specs.mjs";
import { renderCursorrules, renderAnchorMarkdown } from "./lib/render-anchor-rules.mjs";

const root = getRepoRoot();

/** Collect class tokens from specs that must be preserved in JIT (JSON enumMap / baseline) */
function consumeSpecLikeForSafelist(specLike, set) {
  if (!specLike || typeof specLike !== "object") return;
  for (const t of specLike.styleLock?.baselineTokens ?? []) {
    for (const part of String(t).split(/\s+/)) if (part) set.add(part);
  }
  const props = [...(specLike.requiredProps ?? []), ...(specLike.optionalProps ?? [])];
  for (const p of props) {
    const em = p.enumMap;
    if (!em) continue;
    for (const classes of Object.values(em)) {
      if (!Array.isArray(classes)) continue;
      for (const chunk of classes) {
        for (const part of String(chunk).split(/\s+/)) if (part) set.add(part);
      }
    }
  }
}

function collectSafelistTokens(specs) {
  const set = new Set();
  for (const s of specs) {
    consumeSpecLikeForSafelist(s, set);
    for (const frag of Object.values(s.storyAnchor ?? {})) {
      consumeSpecLikeForSafelist(frag, set);
    }
  }
  return [...set].sort();
}

function buildTailwindExtend(specs) {
  const spacing = {};
  const colors = {};
  const borderRadius = {};
  function mergeTe(te) {
    if (!te) return;
    Object.assign(spacing, te.spacing ?? {});
    Object.assign(colors, te.colors ?? {});
    Object.assign(borderRadius, te.borderRadius ?? {});
  }
  for (const s of specs) {
    mergeTe(s.tailwindExtend);
    for (const frag of Object.values(s.storyAnchor ?? {})) {
      mergeTe(frag?.tailwindExtend);
    }
  }
  return { spacing, colors, borderRadius };
}

function writeTailwindAnchorGenerated(specs) {
  const extend = buildTailwindExtend(specs);
  const safelist = collectSafelistTokens(specs);
  const outPath = path.join(root, "tailwind.anchor.generated.ts");
  const body = `/* eslint-disable */
// AUTO-GENERATED — run npm run sync:anchor to regenerate; do not edit manually.
export const anchorTailwindExtend = ${JSON.stringify(extend, null, 2)} as const;

/** From schema enumMap / baselineTokens, for Tailwind JIT safelist */
export const anchorSafelist: string[] = ${JSON.stringify(safelist, null, 2)};
`;
  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Wrote ${path.relative(root, outPath)}`);
}

const decorativeLibs = loadDecorativeLibs();
const activePresetStyle = loadActivePresetStyle();

function writeAnchorRulesMirror(specs) {
  const dir = path.join(root, "src/anchor/rules");
  fs.mkdirSync(dir, { recursive: true });
  const md = renderAnchorMarkdown(specs, decorativeLibs, activePresetStyle);
  const mdPath = path.join(dir, "ANCHOR_RULES.md");
  fs.writeFileSync(mdPath, md, "utf8");
  console.log(`Wrote ${path.relative(root, mdPath)}`);
}

function writeCursorrules(specs) {
  const outFile = path.join(root, ".cursorrules");
  fs.writeFileSync(outFile, renderCursorrules(specs, decorativeLibs, activePresetStyle), "utf8");
  console.log(`Wrote ${path.relative(root, outFile)}`);
}

function writeAgentsMd() {
  const agentsPath = path.join(root, "AGENTS.md");
  if (fs.existsSync(agentsPath)) return;
  const content = `# AGENTS.md — AI Coding Boundaries & Contracts

## Directory Conventions

1. **UI / component implementation source of truth** → \`src/components/\`
2. **Project token source of truth** → the business project \`src/design-tokens/tokens.json\`; generated CSS lives in \`src/styles/design-tokens.generated.css\`
3. **Portal / sync / kit integration** → root-level CLI, scripts, src/anchor-portal
4. **Upstream npm package** → \`node_modules/design-anchor/\` **read-only**, synced via \`anchor upgrade\`

## AI Coding Contracts

- **Import**: prefer \`@design\` alias; do not import kit components from deep \`node_modules\` paths.
- **Colors**: use only Design Token semantic classes; no hard-coded color values.
- **Spacing**: no arbitrary-value Tailwind (\`m-[13px]\`); use schema semantic props.
- **Component specs**: \`src/anchor/schema/components/*.spec.json\` is the single source of truth.
- **After changes**: run \`npm run sync:anchor\` to sync .cursorrules.

## Portal Auto-Open Intent

When the user asks to inspect or change tokens, theme, components, component specs, component styling, governance health, presets, or docs, open Portal first with \`npx design-anchor portal <tab>\`.
- \`tokens\`: change token, show tokens, brand color, radius, spacing, dark mode, theme, design tokens.
- \`components\`: component list, available components, component library, preview components.
- \`specs\`: component spec, schema, props contract, variant mapping.
- \`govern\`: governance, health, component usage, audit, drift check.
- \`docs\`: docs, setup, CLI commands.
- \`presets\`: preset, style preset, onboarding, brand style.
`;
  fs.writeFileSync(agentsPath, content, "utf8");
  console.log(`Wrote AGENTS.md`);
}

const specs = loadSpecs();
writeTailwindAnchorGenerated(specs);
writeAnchorRulesMirror(specs);
writeCursorrules(specs);
writeAgentsMd();

console.log(`sync:anchor complete (${specs.length} specs)`);
