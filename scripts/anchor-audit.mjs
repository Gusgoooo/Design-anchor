#!/usr/bin/env node
/**
 * AST-level compliance audit: forbidden native HTML tags + arbitrary-value Tailwind in className (e.g. m-[13px]).
 * Run: npm run anchor:audit
 *      npm run anchor:audit -- --scope kit
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { loadSpecs, getRepoRoot } from "./lib/load-specs.mjs";
import { deriveSeedToMap } from "../src/design-tokens/seed-to-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = getRepoRoot();
const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const fixMode = args.includes("--fix");
const yesMode = args.includes("--yes") || args.includes("-y");
const requestedScope = readArgValue("--scope") || process.env.ANCHOR_AUDIT_SCOPE || "app";
const maxIssues = Number(readArgValue("--max-issues") || 200);
const AUDIT_SCOPES = new Set(["app", "kit", "portal", "all"]);

const ARBITRARY_TW_RE = /\b([a-z./%-]+)-\[([^\]]+)\]/gi;

function readArgValue(name) {
  const eq = args.find((arg) => arg.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];
  return null;
}

/**
 * Tailwind utility prefixes that MUST use design tokens, not arbitrary
 * values. These are the "design system contract" — colors, the spacing
 * grid, radius scale, type scale. Hardcoded literals here cause visual
 * drift across the product.
 */
const TOKEN_REQUIRED_PREFIXES = new Set([
  // colors
  "bg", "text", "border", "ring", "fill", "stroke",
  "from", "to", "via", "outline", "accent", "caret", "decoration",
  "divide", "placeholder", "shadow",
  // spacing — padding
  "p", "px", "py", "pt", "pb", "pl", "pr",
  // spacing — margin
  "m", "mx", "my", "mt", "mb", "ml", "mr",
  // spacing — gap / space
  "gap", "gap-x", "gap-y", "space-x", "space-y",
  // radius
  "rounded", "rounded-t", "rounded-r", "rounded-b", "rounded-l",
  "rounded-tl", "rounded-tr", "rounded-bl", "rounded-br",
  "rounded-s", "rounded-e", "rounded-ss", "rounded-se", "rounded-es", "rounded-ee",
]);

/**
 * Prefixes intentionally NOT in the must-be-token list: w / h / min-w /
 * max-w / min-h / max-h, top / right / bottom / left / inset,
 * translate-x / translate-y, grid-cols / grid-rows / col-span / row-span,
 * aspect, z. These are layout / positioning / sizing — one-off literal
 * values are acceptable because they're not part of the design grid.
 *
 * Also exempt: any arbitrary value whose body starts with `var(--` —
 * that IS using a token, just via CSS variable syntax.
 */
function isTokenViolation(prefix, value) {
  // Stripping the leading negative sign so `-mx-[4px]` is still caught.
  const p = prefix.replace(/^-/, "");
  if (!TOKEN_REQUIRED_PREFIXES.has(p)) return false;
  const normalizedValue = value.trim();
  if (normalizedValue.includes("var(--")) return false;
  if (normalizedValue === "inherit" || normalizedValue === "currentColor") return false;
  if (p === "stroke" && /^(?:\d+(?:\.\d+)?(?:px|rem|em)?|calc\()/.test(normalizedValue)) return false;
  return true;
}

let fixContext = null;

function parsePx(value) {
  const v = String(value).trim();
  const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(v);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === "rem" ? n * 16 : n;
}

function normalizePrefix(prefix) {
  return String(prefix).replace(/^-/, "");
}

function nearestByPx(options, px) {
  let best = null;
  for (const option of options) {
    const delta = Math.abs(option.px - px);
    if (!best || delta < best.delta) best = { ...option, delta };
  }
  return best;
}

function loadFixContext() {
  if (fixContext) return fixContext;
  const tokenPath = path.join(root, "src/design-tokens/tokens.json");
  let vars = {};
  if (fs.existsSync(tokenPath)) {
    const doc = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    vars = {
      ...deriveSeedToMap(doc.seed ?? {}, {
        dark: false,
        customSeeds: doc.customSeeds ?? {},
        fixedAliases: doc.fixedAliases ?? {},
      }),
      ...(doc.mapOverrides?.light ?? {}),
    };
  }

  const spacing = Object.entries(vars)
    .filter(([key]) => key.startsWith("spacing-"))
    .map(([key, value]) => ({
      suffix: key.slice("spacing-".length),
      px: parsePx(value),
    }))
    .filter((entry) => entry.px != null);

  const radius = [
    ["xs", "border-radius-xs"],
    ["sm", "border-radius-sm"],
    ["md", "border-radius"],
    ["lg", "border-radius-lg"],
    ["xl", "border-radius-xl"],
  ]
    .map(([label, key]) => ({ label, px: parsePx(vars[key]) }))
    .filter((entry) => entry.px != null);

  const fontSize = [
    ["xs", "font-size-sm"],
    ["sm", "font-size"],
    ["base", "font-size-lg"],
    ["lg", "font-size-heading-5"],
    ["xl", "font-size-xl"],
    ["2xl", "font-size-heading-3"],
    ["3xl", "font-size-heading-2"],
  ]
    .map(([label, key]) => ({ label, px: parsePx(vars[key]) }))
    .filter((entry) => entry.px != null);

  fixContext = { spacing, radius, fontSize };
  return fixContext;
}

function safeAutoFix(prefix, value) {
  const p = normalizePrefix(prefix);
  const px = parsePx(value);
  const ctx = loadFixContext();

  if (p === "ring" && px != null) return `${prefix}-[var(--ring-width)]`;
  if (p === "border" && px != null) {
    return px <= 1.25
      ? `${prefix}-[var(--line-width)]`
      : `${prefix}-[var(--line-width-bold)]`;
  }

  if (p === "text" && px != null) {
    const match = nearestByPx(ctx.fontSize, px);
    return match ? `${prefix}-${match.label}` : null;
  }

  if (p === "rounded" || p.startsWith("rounded-")) {
    const match = px != null ? nearestByPx(ctx.radius, px) : null;
    return match ? `${prefix}-${match.label}` : null;
  }

  if (
    p === "p" || p === "px" || p === "py" || p === "pt" || p === "pb" || p === "pl" || p === "pr" ||
    p === "m" || p === "mx" || p === "my" || p === "mt" || p === "mb" || p === "ml" || p === "mr" ||
    p === "gap" || p === "gap-x" || p === "gap-y" || p === "space-x" || p === "space-y"
  ) {
    const match = px != null ? nearestByPx(ctx.spacing, Math.abs(px)) : null;
    return match ? `${prefix}-${match.suffix}` : null;
  }

  return null;
}

function readAuditConfig() {
  const p = path.join(root, "src/anchor/linter/audit-config.json");
  if (!fs.existsSync(p)) {
    return { scanRoots: ["src"], excludePathSubstrings: [], reportForbiddenHtmlFromSpecs: true, flagArbitraryTailwind: true };
  }
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function profileConfig(scope, baseCfg) {
  if (scope === "app") return { name: "app", ...baseCfg };
  if (scope === "kit") {
    return {
      name: "kit",
      scanRoots: ["src/components/base"],
      excludePathSubstrings: [
        "/node_modules/",
        "/__fixtures__/",
        ".stories.",
        ".demo.",
      ],
      reportForbiddenHtmlFromSpecs: false,
      flagArbitraryTailwind: true,
    };
  }
  if (scope === "portal") {
    return {
      name: "portal",
      scanRoots: ["src/anchor-portal", "src/design-tokens"],
      excludePathSubstrings: [
        "/node_modules/",
        "/__fixtures__/",
        ".stories.",
        ".demo.",
      ],
      reportForbiddenHtmlFromSpecs: false,
      flagArbitraryTailwind: true,
    };
  }
  throw new Error(`Unknown audit scope: ${scope}`);
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

function collectStringLiteral(node, sink) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    sink.push({ text: node.text, pos: node.getStart(), contentStart: node.getStart() + 1 });
  }
}

function applyReplacements(sourceText, replacements) {
  const ordered = [...replacements].sort((a, b) => b.start - a.start);
  let out = sourceText;
  for (const r of ordered) out = `${out.slice(0, r.start)}${r.text}${out.slice(r.end)}`;
  return out;
}

function auditFile(filePath, sourceText, forbiddenTags, flagArbitrary) {
  const sf = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diags = [];
  const replacements = [];
  let fixedCount = 0;

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
    if (flagArbitrary) {
      const literals = [];
      collectStringLiteral(node, literals);
      for (const { text, pos, contentStart } of literals) {
        ARBITRARY_TW_RE.lastIndex = 0;
        let m;
        while ((m = ARBITRARY_TW_RE.exec(text)) !== null) {
          const [match, prefix, value] = m;
          if (!isTokenViolation(prefix, value)) continue;
          const fix = safeAutoFix(prefix, value);
          if (fixMode && fix) {
            replacements.push({
              start: contentStart + m.index,
              end: contentStart + m.index + match.length,
              text: fix,
            });
            fixedCount += 1;
            continue;
          }
          diags.push({
            file: filePath,
            line: posLine(pos),
            message: `Arbitrary-value token class \`${match}\`: ${prefix}-* must use a design token (semantic name or var(--…)). Layout/positioning utilities (w-[…], top-[…], grid-cols-[…], aspect-[…], etc.) are allowed.${fix ? ` Safe autofix: \`${fix}\` (run with --fix).` : ""}`,
          });
        }
      }
    }
    ts.forEachChild(node, walk);
  }

  walk(sf);

  return { diags, fixedCount, replacements };
}

const specs = loadSpecs();
const pendingFixes = [];

function forbiddenTagsForConfig(cfg) {
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
  return forbiddenTags;
}

function runAuditScope(scope, baseCfg) {
  const cfg = profileConfig(scope, baseCfg);
  const forbiddenTags = forbiddenTagsForConfig(cfg);
  const files = collectFiles(cfg.scanRoots ?? ["src"], cfg);
  const flagArbitrary = cfg.flagArbitraryTailwind !== false;
  const issues = [];
  let fixedCount = 0;

  for (const file of files) {
    const sourceText = fs.readFileSync(file, "utf8");
    const result = auditFile(file, sourceText, forbiddenTags, flagArbitrary);
    issues.push(...result.diags);
    fixedCount += result.fixedCount;
    if (fixMode && result.replacements.length) {
      pendingFixes.push({
        file,
        replacements: result.replacements,
      });
    }
  }

  return {
    scope,
    passed: issues.length === 0,
    scanned: files.length,
    fixedCount,
    issueCount: issues.length,
    issues: issues.map((d) => ({
      scope,
      file: path.relative(root, d.file),
      line: d.line,
      message: d.message,
    })),
  };
}

function buildPayload() {
  const scope = AUDIT_SCOPES.has(requestedScope) ? requestedScope : "app";
  const baseCfg = readAuditConfig();
  if (scope === "all") {
    const profiles = ["app", "kit", "portal"].map((profile) => runAuditScope(profile, baseCfg));
    const issueCount = profiles.reduce((sum, profile) => sum + profile.issueCount, 0);
    const fixedCount = profiles.reduce((sum, profile) => sum + profile.fixedCount, 0);
    const issues = profiles.flatMap((profile) => profile.issues).slice(0, maxIssues);
    return {
      scope: "all",
      passed: profiles.every((profile) => profile.passed),
      scanned: profiles.reduce((sum, profile) => sum + profile.scanned, 0),
      fixedCount,
      issueCount,
      issues,
      profiles,
      truncated: issueCount > issues.length,
    };
  }
  const payload = runAuditScope(scope, baseCfg);
  return {
    ...payload,
    issues: payload.issues.slice(0, maxIssues),
    truncated: payload.issueCount > maxIssues,
  };
}

const payload = buildPayload();

function summarizeFixes(fixes) {
  const rows = fixes.map((fix) => ({
    file: path.relative(root, fix.file),
    count: fix.replacements.length,
  }));
  return {
    count: rows.reduce((sum, row) => sum + row.count, 0),
    files: rows.length,
    rows,
  };
}

async function askForConfirmation(summary) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      `Apply ${summary.count} safe token auto-fix(es) across ${summary.files} file(s)? Type "yes" to continue: `,
    );
    return answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

function applyPendingFixes(fixes) {
  for (const fix of fixes) {
    const sourceText = fs.readFileSync(fix.file, "utf8");
    fs.writeFileSync(fix.file, applyReplacements(sourceText, fix.replacements), "utf8");
  }
}

async function confirmAndApplyFixes() {
  if (!fixMode || pendingFixes.length === 0) return true;

  const summary = summarizeFixes(pendingFixes);
  payload.fixConfirmationRequired = !yesMode;
  payload.fixFiles = summary.rows;

  if (!yesMode) {
    if (jsonMode) return false;
    console.error(`anchor-audit planned ${summary.count} safe auto-fix(es) in ${summary.files} file(s):`);
    for (const row of summary.rows.slice(0, 20)) {
      console.error(`- ${row.file}: ${row.count}`);
    }
    if (summary.rows.length > 20) {
      console.error(`- ... ${summary.rows.length - 20} more file(s)`);
    }
    console.error("");

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.error("No files changed. Re-run in an interactive terminal or pass --yes to apply these fixes.");
      return false;
    }

    const confirmed = await askForConfirmation(summary);
    if (!confirmed) {
      console.error("No files changed. Confirmation declined.");
      return false;
    }
  }

  applyPendingFixes(pendingFixes);
  payload.fixConfirmationRequired = false;
  return true;
}

const fixesApplied = await confirmAndApplyFixes();

/**
 * `--json` mode: emit a single structured payload to stdout, always exit 0.
 * Consumed by the Portal's Govern tab so the UI doesn't have to parse stderr.
 */
if (jsonMode) {
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

if (fixMode && pendingFixes.length > 0 && !fixesApplied) {
  process.exit(1);
}

if (!payload.passed) {
  const fixedText = fixMode && payload.fixedCount ? ` (${payload.fixedCount} auto-fixed)` : "";
  console.error(`anchor-audit failed: ${payload.issueCount} issue(s) in ${payload.scope} scope${fixedText}\n`);
  if (payload.profiles) {
    for (const profile of payload.profiles) {
      console.error(`- ${profile.scope}: ${profile.issueCount} issue(s), ${profile.scanned} file(s) scanned`);
    }
    console.error("");
  }
  for (const d of payload.issues) {
    const scopePrefix = payload.scope === "all" ? `[${d.scope}] ` : "";
    console.error(`${scopePrefix}${d.file}:${d.line}\n  ${d.message}\n`);
  }
  if (payload.truncated) console.error(`Output truncated to ${payload.issues.length} issue(s). Use --max-issues to change the limit.\n`);
  process.exit(1);
}

if (payload.profiles) {
  const fixedText = fixMode && payload.fixedCount ? `, ${payload.fixedCount} auto-fixed` : "";
  console.log(`anchor-audit passed (${payload.scanned} .tsx files across ${payload.profiles.length} scopes${fixedText})`);
} else {
  const fixedText = fixMode && payload.fixedCount ? `, ${payload.fixedCount} auto-fixed` : "";
  console.log(`anchor-audit passed (${payload.scope} scope, scanned ${payload.scanned} .tsx files${fixedText})`);
}
