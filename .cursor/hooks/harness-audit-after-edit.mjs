#!/usr/bin/env node
/**
 * Cursor afterFileEdit hook：在 Agent 写入 .tsx 后，在关联的组件库根目录（.harness/ 或旧版 harness-ui/）运行 harness-audit。
 * 若失败，通过 additional_context 把报告塞回对话，促使模型修复。
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

function isHarnessRoot(dir) {
  return fs.existsSync(path.join(dir, "src", "harness", "schema", "components"));
}

function findHarnessRoot(filePath) {
  if (!filePath) return null;
  let dir = path.dirname(path.resolve(filePath));
  for (;;) {
    if (isHarnessRoot(dir)) return dir;
    for (const sub of [".harness", "harness-ui"]) {
      const nested = path.join(dir, sub);
      if (isHarnessRoot(nested)) return nested;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function runAudit(harnessRoot) {
  const script = path.join(harnessRoot, "scripts", "harness-audit.mjs");
  if (!fs.existsSync(script)) return { ok: true, skip: true, out: "" };
  try {
    execFileSync(process.execPath, [script], {
      cwd: harnessRoot,
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

const harnessRoot = findHarnessRoot(filePath);
if (!harnessRoot) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const result = runAudit(harnessRoot);
if (result.skip || result.ok) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const snippet = result.out.slice(0, 12_000);
const payload = {
  additional_context: [
    "[Harness] 保存后自动运行 `harness audit` 未通过。请按项目规范修复（优先使用 Business 组件、禁止 spec 中声明的原生标签与任意值 Tailwind），修复后可再保存验证。",
    "",
    snippet,
  ].join("\n"),
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
