import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve repository root:
 * 1. Use rootOverride if provided
 * 2. Check if cwd contains src/accord (supports accord-init generated directories)
 * 3. Fall back to two levels above the scripts directory
 */
export function getRepoRoot(rootOverride) {
  if (rootOverride) return path.resolve(rootOverride);
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "src/accord/schema/components"))) return cwd;
  return path.resolve(__dirname, "../..");
}

export function loadSpecs(rootOverride) {
  const root = getRepoRoot(rootOverride);
  const specDir = path.join(root, "src/accord/schema/components");
  if (!fs.existsSync(specDir)) return [];
  const files = fs.readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(specDir, f), "utf8");
    return JSON.parse(raw);
  });
}

export function loadDecorativeLibs(rootOverride) {
  const root = getRepoRoot(rootOverride);
  const file = path.join(root, "src/accord/references/decorative-libs.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
