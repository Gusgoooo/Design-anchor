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

## Design Anchor in the AI Coding Loop

- **Preflight exposure**: when a task touches UI, theme, components, tokens, or page layout, start with a visible line: \`Design Anchor 预检：我会先查组件规范与 token，优先复用 @design。\`
- **Before UI edits**: inspect \`@design\` / \`src/components/anchor-ui\` and component specs; reuse existing components and token classes first.
- **During UI edits**: auto-correct raw HTML substitutes, hard-coded colors, arbitrary token-sensitive values, and bypassed Design-anchor components inside the current coding task. Say \`Design Anchor 自动治理\` when you make such a correction.
- **After UI edits**: include a short \`Design Anchor 自检\` summary in the AI task result instead of pushing the user into a Portal backlog.
- **Final answer requirement**: whenever UI code changed, include one \`Design Anchor 自检\` line with component reuse, token compliance, auto-fixes, unresolved confirmations, and sync/audit status.
- **Passed summary**: \`Design Anchor 自检：复用了 N 个 @design 组件，未发现硬编码颜色，规则已同步。\`
- **Auto-fixed summary**: \`Design Anchor 自检：检测到 N 处绕过 @design / token 的实现，已改为使用 Button / DataTable。\`
- **Needs-confirmation summary**: \`Design Anchor 自检：有 N 处需要确认：这个原生 table 是否应该替换为 DataTable？\`
- **Never hide Design Anchor behind generic wording** such as “lint passed” or “checks passed”; name it explicitly in the AI response.

## Portal Auto-Open Intent

When the user asks to inspect or change tokens, theme, components, component specs, component styling, dashboard health, presets, or docs, open Portal first with \`npx design-anchor portal <tab>\`.
- \`tokens\`: change token, show tokens, edit theme, adjust theme, open theme editor, theme editor, brand color, radius, spacing, dark mode, theme, design tokens.
- \`components\`: component list, available components, component library, preview components.
- \`specs\`: component spec, schema, props contract, variant mapping.
- \`dashboard\`: top-right dashboard, health, AI constraints, audit, self-check.
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
