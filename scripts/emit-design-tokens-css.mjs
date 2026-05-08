#!/usr/bin/env node
/**
 * Reads src/design-tokens/tokens.json (v2 Seed structure),
 * calls seed-to-map engine to derive all map/alias tokens,
 * and writes src/styles/design-tokens.generated.css (:root / .dark).
 *
 * Backwards-compatible: if tokens.json is v1 (has "tokens" array), falls back
 * to the legacy flat-emit path.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeedToMap } from "../src/design-tokens/seed-to-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src/design-tokens/tokens.json");
const out = path.join(root, "src/styles/design-tokens.generated.css");

const doc = JSON.parse(fs.readFileSync(src, "utf8"));

// --- v1 legacy fallback ---
if (doc.version === 1 || Array.isArray(doc.tokens)) {
  const tokens = Array.isArray(doc.tokens) ? doc.tokens : [];
  const rootLines = [":root {"];
  const darkLines = [".dark {"];
  for (const t of tokens) {
    if (t?.emitCss === false) continue;
    if (!t?.id || t.light === undefined || t.dark === undefined) continue;
    rootLines.push(`  --${t.id}: ${t.light};`);
    darkLines.push(`  --${t.id}: ${t.dark};`);
  }
  rootLines.push("}");
  darkLines.push("}");
  const banner = `/* AUTO-GENERATED (v1 legacy) — 源：tokens.json；请勿手改 */\n\n`;
  fs.writeFileSync(out, `${banner}${rootLines.join("\n")}\n\n${darkLines.join("\n")}\n`, "utf8");
  console.log(`[v1] Wrote ${path.relative(root, out)} (${tokens.length} rows)`);
  process.exit(0);
}

// --- v2 Seed→Map generation ---
const { seed, seedDark = {}, customSeeds = {}, fixedAliases = {}, mapOverrides = {} } = doc;
const moLight = mapOverrides.light ?? {};
const moDark = mapOverrides.dark ?? {};

const lightVars = deriveSeedToMap(seed, { dark: false, customSeeds, fixedAliases });
const darkSeed = { ...seed, ...seedDark };
const darkVars = deriveSeedToMap(darkSeed, { dark: true, customSeeds, fixedAliases });
const lightVarsMerged = { ...lightVars, ...moLight };
const darkVarsMerged = { ...darkVars, ...moDark };

function toCSS(vars, selector) {
  const lines = [`${selector} {`];
  for (const [name, value] of Object.entries(vars)) {
    if (value === "" || value == null) continue;
    lines.push(`  --${name}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}

const banner = `/* AUTO-GENERATED (v2 Seed→Map) — 源：tokens.json seed 层；请勿手改。运行 npm run sync:tokens */\n\n`;
const content = `${banner}${toCSS(lightVarsMerged, ":root")}\n\n${toCSS(darkVarsMerged, ".dark")}\n`;

fs.writeFileSync(out, content, "utf8");

const lightCount = Object.keys(lightVarsMerged).filter((k) => lightVarsMerged[k] !== "" && lightVarsMerged[k] != null).length;
const darkCount = Object.keys(darkVarsMerged).filter((k) => darkVarsMerged[k] !== "" && darkVarsMerged[k] != null).length;
console.log(`[v2] Wrote ${path.relative(root, out)} — light: ${lightCount} vars, dark: ${darkCount} vars`);
