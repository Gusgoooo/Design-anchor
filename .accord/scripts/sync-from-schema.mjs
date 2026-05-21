#!/usr/bin/env node
/**
 * Schema → Tailwind extend + safelist → .cursorrules + src/accord/rules mirror
 * Run: npm run sync:accord
 */
import fs from "node:fs";
import path from "node:path";
import { loadSpecs, loadDecorativeLibs, getRepoRoot } from "./lib/load-specs.mjs";
import { renderCursorrules, renderAccordMarkdown } from "./lib/render-accord-rules.mjs";

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
    for (const frag of Object.values(s.storyAccord ?? {})) {
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
    for (const frag of Object.values(s.storyAccord ?? {})) {
      mergeTe(frag?.tailwindExtend);
    }
  }
  return { spacing, colors, borderRadius };
}

function writeTailwindAccordGenerated(specs) {
  const extend = buildTailwindExtend(specs);
  const safelist = collectSafelistTokens(specs);
  const outPath = path.join(root, "tailwind.accord.generated.ts");
  const body = `/* eslint-disable */
// AUTO-GENERATED — run npm run sync:accord to regenerate; do not edit manually.
export const accordTailwindExtend = ${JSON.stringify(extend, null, 2)} as const;

/** From schema enumMap / baselineTokens, for Tailwind JIT safelist */
export const accordSafelist: string[] = ${JSON.stringify(safelist, null, 2)};
`;
  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Wrote ${path.relative(root, outPath)}`);
}

const decorativeLibs = loadDecorativeLibs();

function writeAccordRulesMirror(specs) {
  const dir = path.join(root, "src/accord/rules");
  fs.mkdirSync(dir, { recursive: true });
  const md = renderAccordMarkdown(specs, decorativeLibs);
  const mdPath = path.join(dir, "ACCORD_RULES.md");
  fs.writeFileSync(mdPath, md, "utf8");
  console.log(`Wrote ${path.relative(root, mdPath)}`);
}

function writeCursorrules(specs) {
  const outFile = path.join(root, ".cursorrules");
  fs.writeFileSync(outFile, renderCursorrules(specs, decorativeLibs), "utf8");
  console.log(`Wrote ${path.relative(root, outFile)}`);
}

function writeAgentsMd() {
  const agentsPath = path.join(root, "AGENTS.md");
  if (fs.existsSync(agentsPath)) return;
  const content = `# AGENTS.md — AI Coding Boundaries & Contracts

## Directory Conventions

1. **UI / components / token source of truth** → \`src/components/\` and \`src/design-tokens/\`
2. **Portal / sync / kit integration** → root-level CLI, scripts, .storybook
3. **Upstream npm package** → \`node_modules/design-accord/\` **read-only**, synced via \`accord upgrade\`

## AI Coding Contracts

- **Import**: prefer \`@design\` alias; do not import kit components from deep \`node_modules\` paths.
- **Colors**: use only Design Token semantic classes; no hard-coded color values.
- **Spacing**: no arbitrary-value Tailwind (\`m-[13px]\`); use schema semantic props.
- **Component specs**: \`src/accord/schema/components/*.spec.json\` is the single source of truth.
- **After changes**: run \`npm run sync:accord\` to sync .cursorrules.
`;
  fs.writeFileSync(agentsPath, content, "utf8");
  console.log(`Wrote AGENTS.md`);
}

const specs = loadSpecs();
writeTailwindAccordGenerated(specs);
writeAccordRulesMirror(specs);
writeCursorrules(specs);
writeAgentsMd();

console.log(`sync:accord complete (${specs.length} specs)`);
