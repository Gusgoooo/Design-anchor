#!/usr/bin/env node
/**
 * Pull the production/upstream tokens.json into this repo's canonical path, then run sync:tokens.
 *
 * Usage (run from repo root or a kit root containing src/design-tokens):
 *   ANCHOR_TOKENS_URL=https://your-cdn.example.com/design/tokens.json npm run sync:tokens:pull
 *   node scripts/pull-product-tokens.mjs --url=https://...
 *
 * Optional auth (do not commit secrets; use CI secrets):
 *   ANCHOR_TOKENS_AUTH_HEADER='Bearer xxx'
 *
 * Optional root override (consumer .anchor sub-project):
 *   node scripts/pull-product-tokens.mjs --url=... --root=/path/to/.anchor
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function argValue(name) {
  const pre = `${name}=`;
  const hit = process.argv.find((a) => a === name || a.startsWith(pre));
  if (!hit) return undefined;
  if (hit === name) {
    const i = process.argv.indexOf(hit);
    return process.argv[i + 1];
  }
  return hit.slice(pre.length);
}

const url = argValue("--url") ?? process.env.ANCHOR_TOKENS_URL;
const repoRoot = path.resolve(argValue("--root") ?? process.cwd());
const tokensPath = path.join(repoRoot, "src/design-tokens/tokens.json");
const auth = process.env.ANCHOR_TOKENS_AUTH_HEADER;

if (!url || !String(url).trim()) {
  console.error(
    "Missing token URL: set ANCHOR_TOKENS_URL env var or pass --url=https://...\n" +
      "Example: ANCHOR_TOKENS_URL=https://api.example.com/v1/tokens.json npm run sync:tokens:pull",
  );
  process.exit(1);
}

function validateTokensDoc(doc) {
  if (!doc || typeof doc !== "object") throw new Error("Response is not a JSON object");
  if (doc.version === 2) {
    if (!doc.seed || typeof doc.seed !== "object") throw new Error("v2 missing seed object");
    return;
  }
  if (doc.version === 1 || Array.isArray(doc.tokens)) return;
  throw new Error("Unrecognized format: requires version:2 + seed, or v1 tokens array");
}

async function main() {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 60_000);

  const headers = { Accept: "application/json" };
  if (auth) headers.Authorization = auth;

  let res;
  try {
    res = await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error("Response body is not valid JSON");
  }
  validateTokensDoc(doc);

  const dir = path.dirname(tokensPath);
  if (!fs.existsSync(dir)) {
    throw new Error(`Target directory does not exist: ${dir} (ensure --root points to a kit root containing src/design-tokens)`);
  }

  const pretty = `${JSON.stringify(doc, null, 2)}\n`;
  fs.writeFileSync(tokensPath, pretty, "utf8");
  console.log(`Wrote ${path.relative(repoRoot, tokensPath) || tokensPath}`);

  execSync("npm run sync:tokens", { cwd: repoRoot, stdio: "inherit" });
  console.log("sync:tokens complete.");
}

main().catch((e) => {
  console.error(`pull-product-tokens failed: ${e.message || e}`);
  process.exit(1);
});
