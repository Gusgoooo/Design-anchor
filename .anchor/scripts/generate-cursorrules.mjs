#!/usr/bin/env node
/**
 * Generates root .cursorrules only (does not touch Tailwind).
 * For a full sync, use: npm run sync:anchor
 */
import fs from "node:fs";
import path from "node:path";
import { loadSpecs, loadDecorativeLibs, getRepoRoot } from "./lib/load-specs.mjs";
import { renderCursorrules } from "./lib/render-anchor-rules.mjs";

const root = getRepoRoot();
const outFile = path.join(root, ".cursorrules");

const specs = loadSpecs();
const decorativeLibs = loadDecorativeLibs();
fs.writeFileSync(outFile, renderCursorrules(specs, decorativeLibs), "utf8");
console.log(`Wrote ${path.relative(root, outFile)} (${specs.length} specs)`);
