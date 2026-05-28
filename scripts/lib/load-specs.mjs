import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve repository root:
 * 1. Use rootOverride if provided
 * 2. Check if cwd contains src/anchor (supports anchor-init generated directories)
 * 3. Fall back to two levels above the scripts directory
 */
export function getRepoRoot(rootOverride) {
  if (rootOverride) return path.resolve(rootOverride);
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "src/anchor/schema/components"))) return cwd;
  return path.resolve(__dirname, "../..");
}

export function loadSpecs(rootOverride) {
  const root = getRepoRoot(rootOverride);
  const specDir = path.join(root, "src/anchor/schema/components");
  if (!fs.existsSync(specDir)) return [];
  const files = fs.readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(specDir, f), "utf8");
    return JSON.parse(raw);
  });
}

export function loadDecorativeLibs(rootOverride) {
  const root = getRepoRoot(rootOverride);
  const file = path.join(root, "src/anchor/references/decorative-libs.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function loadActivePresetStyle(rootOverride) {
  const root = getRepoRoot(rootOverride);
  const file = path.join(root, "src/anchor/rules/ACTIVE_PRESET_STYLE.md");
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8").trim();
  return text ? text : null;
}
