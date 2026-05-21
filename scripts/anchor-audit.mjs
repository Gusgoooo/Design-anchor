#!/usr/bin/env node
/**
 * AST-level compliance audit: forbidden native HTML tags + arbitrary-value Tailwind in className (e.g. m-[13px]).
 * Run: npm run anchor:audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { loadSpecs, getRepoRoot } from "./lib/load-specs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = getRepoRoot();

const ARBITRARY_TW_RE = /\b[a-z./%-]+-\[[^\]]+\]/gi;

function readAuditConfig() {
  const p = path.join(root, "src/anchor/linter/audit-config.json");
  if (!fs.existsSync(p)) {
    return { scanRoots: ["src"], excludePathSubstrings: [], reportForbiddenHtmlFromSpecs: true, flagArbitraryTailwind: true };
  }
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function shouldSkip(absPath, cfg) {
  const norm = absPath.split(path.sep).join("/");
  for (const sub of cfg.excludePathSubstrings ?? []) {
    if (norm.includes(sub)) return true;
  }
  return false;
}

function collectFiles(scanRoots, cfg) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name.startsWith(".")) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === "dist") continue;
        walk(p);
      } else if (ent.name.endsWith(".tsx")) {
        const abs = path.resolve(p);
        if (!shouldSkip(abs, cfg)) out.push(abs);
      }
    }
  }
  for (const rel of scanRoots) {
    const dir = path.join(root, rel);
    if (fs.existsSync(dir)) walk(dir);
  }
  return out;
}

function jsxIntrinsicTag(tagName) {
  if (ts.isIdentifier(tagName)) return tagName.text;
  return null;
}

function collectClassNameLiterals(node, sink) {
  if (!ts.isJsxAttribute(node)) return;
  const n = node.name;
  if (!ts.isIdentifier(n) || n.text !== "className") return;
  const init = node.initializer;
  if (!init) return;
  if (ts.isStringLiteral(init)) {
    sink.push({ text: init.text, pos: init.getStart() });
    return;
  }
  if (ts.isJsxExpression(init) && init.expression) {
    const ex = init.expression;
    if (ts.isStringLiteral(ex)) sink.push({ text: ex.text, pos: ex.getStart() });
  }
}

function auditFile(filePath, sourceText, forbiddenTags, flagArbitrary) {
  const sf = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diags = [];

  function posLine(pos) {
    const { line } = sf.getLineAndCharacterOfPosition(pos);
    return line + 1;
  }

  function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = jsxIntrinsicTag(node.tagName);
      if (tag && forbiddenTags.has(tag)) {
        diags.push({
          file: filePath,
          line: posLine(node.getStart()),
          message: `Forbidden native <${tag}>; use the business component declared in schema instead (see .cursorrules).`,
        });
      }
    }
    if (flagArbitrary && ts.isJsxAttribute(node)) {
      const literals = [];
      collectClassNameLiterals(node, literals);
      for (const { text, pos } of literals) {
        ARBITRARY_TW_RE.lastIndex = 0;
        let m;
        while ((m = ARBITRARY_TW_RE.exec(text)) !== null) {
          diags.push({
            file: filePath,
            line: posLine(pos),
            message: `Detected arbitrary-value Tailwind class \`${m[0]}\`: use schema semantic props or tailwindExtend tokens instead of magic numbers.`,
          });
        }
      }
    }
    ts.forEachChild(node, walk);
  }

  walk(sf);
  return diags;
}

const cfg = readAuditConfig();
const specs = loadSpecs();
const forbiddenTags = new Set();
if (cfg.reportForbiddenHtmlFromSpecs) {
  for (const s of specs) {
    for (const f of s.forbidden ?? []) {
      forbiddenTags.add(String(f.htmlTag).toLowerCase());
    }
    for (const frag of Object.values(s.storyAnchor ?? {})) {
      if (!frag || typeof frag !== "object") continue;
      for (const f of frag.forbidden ?? []) {
        forbiddenTags.add(String(f.htmlTag).toLowerCase());
      }
    }
  }
}

const files = collectFiles(cfg.scanRoots ?? ["src"], cfg);
const flagArbitrary = cfg.flagArbitraryTailwind !== false;
const all = [];

for (const file of files) {
  const sourceText = fs.readFileSync(file, "utf8");
  all.push(...auditFile(file, sourceText, forbiddenTags, flagArbitrary));
}

if (all.length) {
  console.error(`anchor-audit failed: ${all.length} issue(s)\n`);
  for (const d of all) {
    console.error(`${path.relative(root, d.file)}:${d.line}\n  ${d.message}\n`);
  }
  process.exit(1);
}

console.log(`anchor-audit passed (scanned ${files.length} .tsx files)`);
