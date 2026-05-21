#!/usr/bin/env node
/**
 * Cursor afterFileEdit hook: After the Agent writes a .tsx file, runs anchor-audit
 * in the associated component library root (.anchor/ or legacy anchor-ui/).
 * On failure, feeds the report back into the conversation via additional_context to prompt the model to fix issues.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function readStdin() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function pickFilePath(input) {
  return (
    input.file_path ||
    input.path ||
    input.file ||
    (typeof input.uri === "string" ? input.uri.replace(/^file:\/\//, "") : "") ||
    ""
  );
}

function isRelevantTsx(abs) {
  const n = abs.replace(/\\/g, "/");
  if (!n.endsWith(".tsx")) return false;
  if (n.includes(".stories.")) return false;
  if (n.includes("/node_modules/")) return false;
  return n.includes("/src/");
}

function isAnchorRoot(dir) {
  return fs.existsSync(path.join(dir, "src", "anchor", "schema", "components"));
}

function findAnchorRoot(filePath) {
  if (!filePath) return null;
  let dir = path.dirname(path.resolve(filePath));
  for (;;) {
    if (isAnchorRoot(dir)) return dir;
    for (const sub of [".anchor", "anchor-ui"]) {
      const nested = path.join(dir, sub);
      if (isAnchorRoot(nested)) return nested;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function runAudit(anchorRoot) {
  const script = path.join(anchorRoot, "scripts", "anchor-audit.mjs");
  if (!fs.existsSync(script)) return { ok: true, skip: true, out: "" };
  try {
    execFileSync(process.execPath, [script], {
      cwd: anchorRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: true, skip: false, out: "" };
  } catch (e) {
    const out = [e.stdout, e.stderr, e.message].filter(Boolean).join("\n").trim();
    return { ok: false, skip: false, out };
  }
}

const input = readStdin();
const filePath = pickFilePath(input);

if (!isRelevantTsx(filePath)) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const anchorRoot = findAnchorRoot(filePath);
if (!anchorRoot) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const result = runAudit(anchorRoot);
if (result.skip || result.ok) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const snippet = result.out.slice(0, 12_000);
const payload = {
  additional_context: [
    "[Design-anchor] Auto-run `anchor audit` after save did not pass. Please fix according to project rules (prefer Business components, forbidden native tags and arbitrary-value Tailwind declared in specs). Save again to re-verify after fixing.",
    "",
    snippet,
  ].join("\n"),
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
