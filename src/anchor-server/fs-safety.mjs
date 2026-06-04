import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { consumerRootFor } from "../../scripts/lib/token-source.mjs";

export const DEFAULT_WRITE_WHITELIST_PREFIXES = [
  "src/anchor/schema/",
  "src/anchor/component-demos/",
  "src/anchor/rules/",
  "src/design-tokens/",
  "src/styles/",
  "src/components/anchor-ui/",
  "src/components/base/",
];

export function writeFileWithFsync(absPath, data) {
  fs.writeFileSync(absPath, data, "utf8");
  let fd;
  try {
    fd = fs.openSync(absPath, "r+");
    fs.fsyncSync(fd);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

export function execSyncCaptured(cmd, opts) {
  try {
    const out = execSync(cmd, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      ...opts,
    });
    return { ok: true, stdout: out ?? "", stderr: "" };
  } catch (e) {
    const stderr = e.stderr != null ? String(e.stderr) : "";
    const stdout = e.stdout != null ? String(e.stdout) : "";
    return { ok: false, stdout, stderr: stderr || stdout || e.message || String(e) };
  }
}

export function isInsidePath(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function isWriteAllowed(repoRoot, absPath, prefixes = DEFAULT_WRITE_WHITELIST_PREFIXES) {
  const roots = [...new Set([path.resolve(repoRoot), consumerRootFor(repoRoot)])];
  return roots.some((root) => {
    const rel = path.relative(root, absPath).split(path.sep).join("/");
    if (rel.startsWith("..") || path.isAbsolute(rel)) return false;
    return prefixes.some((prefix) => rel.startsWith(prefix));
  });
}
