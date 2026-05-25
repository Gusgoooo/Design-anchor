import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/** Write to disk synchronously with fsync, preventing unflushed buffers on process crash */
function writeFileWithFsync(absPath, data) {
  fs.writeFileSync(absPath, data, "utf8");
  let fd;
  try {
    fd = fs.openSync(absPath, "r+");
    fs.fsyncSync(fd);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function execSyncCaptured(cmd, opts) {
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

/**
 * Portal API write whitelist -- only files under these directories are allowed to be written by the API.
 * Prevents Portal or malicious requests from writing to arbitrary repo locations.
 */
const WRITE_WHITELIST_PREFIXES = [
  "src/anchor/schema/",
  "src/design-tokens/",
  "src/components/base/",
];

function isWriteAllowed(repoRoot, absPath) {
  const rel = path.relative(repoRoot, absPath).split(path.sep).join("/");
  return WRITE_WHITELIST_PREFIXES.some(prefix => rel.startsWith(prefix));
}

// Curated allow-list of imports we know are safe to keep when copying
// components into the kit.
const SAFE_COMPONENT_IMPORTS = new Set([
  "react",
  "react-dom",
  "react/jsx-runtime",
  "lucide-react",
  "clsx",
  "tailwind-merge",
  "class-variance-authority",
  "@/lib/utils",
  "@/lib/modal-overlay-classes",
]);

const SAFE_COMPONENT_IMPORT_PREFIXES = [
  "@radix-ui/",
  "@radix-ui",
  "react-",
  "@tanstack/",
];

function classifyComponentImport(importPath) {
  if (SAFE_COMPONENT_IMPORTS.has(importPath)) return "safe";
  if (SAFE_COMPONENT_IMPORT_PREFIXES.some((pre) => importPath.startsWith(pre))) return "safe";
  if (importPath.startsWith("@/components/base/")) return "safe";
  if (importPath.startsWith("@/")) return "warn";
  if (importPath.startsWith("./") || importPath.startsWith("../")) return "warn";
  return "risky";
}

function inspectComponentImports(absPath) {
  const text = fs.readFileSync(absPath, "utf8");
  const importRe = /import\s+(?:[^"'`]*?)\s+from\s+["']([^"']+)["']/g;
  const imports = [];
  let m;
  while ((m = importRe.exec(text)) !== null) imports.push(m[1]);
  const classified = imports.map((imp) => ({ import: imp, level: classifyComponentImport(imp) }));
  const worstLevel = classified.some((c) => c.level === "risky")
    ? "risky"
    : classified.some((c) => c.level === "warn")
      ? "warn"
      : "safe";
  return { imports: classified, level: worstLevel };
}

function isInsidePath(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function isImportableComponentFile(filePath) {
  const name = path.basename(filePath);
  return name.endsWith(".tsx") && !name.includes(".demo.") && !name.includes(".stories.");
}

function collectImportableComponentFiles(sourcePath, { recursive = true, maxFiles = 500 } = {}) {
  const files = [];
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) return isImportableComponentFile(sourcePath) ? [sourcePath] : [];

  function walk(dir) {
    if (files.length >= maxFiles) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build") continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) walk(p);
        continue;
      }
      if (entry.isFile() && isImportableComponentFile(p)) files.push(p);
      if (files.length >= maxFiles) return;
    }
  }

  walk(sourcePath);
  return files;
}

function componentReportName(rootPath, filePath) {
  try {
    const stat = fs.statSync(rootPath);
    if (stat.isDirectory()) return path.relative(rootPath, filePath).split(path.sep).join("/");
  } catch {
    // fall back to basename below
  }
  return path.basename(filePath);
}

/**
 * Dev server middleware: reads/writes src/anchor/schema/components/*.spec.json, executes sync:anchor after saving.
 * Shared by standalone Portal and Storybook.
 */
export function schemaApiPlugin(repoRoot) {
  const specDir = path.join(repoRoot, "src/anchor/schema/components");
  const tokensPath = path.join(repoRoot, "src/design-tokens/tokens.json");

  return {
    name: "anchor-schema-api",
    /** Try to run before static asset handling to prevent /api/* from being incorrectly consumed */
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url ?? "/", "http://anchor.local");
        const url = parsedUrl.pathname;

        if (req.method === "GET" && url === "/api/setup-status") {
          // Reports whether the user has completed first-run onboarding.
          // Stored in .anchor-portal/setup.json (gitignored via .anchor-portal/).
          const p = path.join(repoRoot, ".anchor-portal/setup.json");
          if (!fs.existsSync(p)) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ configured: false }));
            return;
          }
          try {
            const body = JSON.parse(fs.readFileSync(p, "utf8"));
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ configured: true, ...body }));
          } catch {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ configured: false }));
          }
          return;
        }

        if (req.method === "POST" && url === "/api/setup-status") {
          // Records the user's onboarding choice. Subsequent visits skip
          // the wizard. Sending { configured: false } resets it (debug aid).
          let raw = "";
          req.on("data", (c) => { raw += String(c); });
          req.on("end", () => {
            try {
              const payload = raw ? JSON.parse(raw) : {};
              const dir = path.join(repoRoot, ".anchor-portal");
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              const p = path.join(dir, "setup.json");
              const body = {
                completedAt: new Date().toISOString(),
                mode: payload.mode ?? "default",
                imported: Array.isArray(payload.imported) ? payload.imported : [],
                ...payload,
              };
              writeFileWithFsync(p, JSON.stringify(body, null, 2) + "\n");
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true, ...body }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "POST" && url === "/api/scan-component-path") {
          // Pre-import compatibility check. Given a folder or .tsx path,
          // returns a per-file report:
          //   safe   — only imports from a curated allow-list
          //   warn   — uses @/lib/utils or other path-aliased imports
          //   risky  — imports an unknown package or relative path outside same dir
          let raw = "";
          req.on("data", (c) => { raw += String(c); });
          req.on("end", () => {
            try {
              const payload = raw ? JSON.parse(raw) : {};
              let p = String(payload.path ?? "").trim();
              if (!p) { res.statusCode = 400; res.end(JSON.stringify({ ok: false, error: "path required" })); return; }
              if (p.startsWith("~")) p = path.join(process.env.HOME || "", p.slice(1));
              if (!path.isAbsolute(p)) p = path.resolve(repoRoot, p);
              if (!fs.existsSync(p)) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: `not found: ${p}` }));
                return;
              }

              const stat = fs.statSync(p);
              if (stat.isFile() && !isImportableComponentFile(p)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "only component .tsx files supported" }));
                return;
              }
              const recursive = payload.recursive !== false;
              const files = collectImportableComponentFiles(p, { recursive });

              const reports = files.map((f) => {
                const insp = inspectComponentImports(f);
                return {
                  file: componentReportName(p, f),
                  absPath: f,
                  level: insp.level,
                  imports: insp.imports,
                };
              });

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                ok: true,
                kind: stat.isDirectory() ? "folder" : "file",
                root: p,
                files: reports,
                summary: {
                  safe: reports.filter((r) => r.level === "safe").length,
                  warn: reports.filter((r) => r.level === "warn").length,
                  risky: reports.filter((r) => r.level === "risky").length,
                },
              }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "POST" && url === "/api/clear-components") {
          // Wipes src/components/base/ for the "empty library" onboarding mode.
          // Tokens / specs / generated files stay so the user can grow from zero.
          try {
            const baseDir = path.join(repoRoot, "src/components/base");
            if (fs.existsSync(baseDir)) {
              for (const f of fs.readdirSync(baseDir)) {
                fs.rmSync(path.join(baseDir, f), { recursive: true, force: true });
              }
            }
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
          return;
        }

        if (req.method === "GET" && url === "/api/audit-status") {
          // Runs anchor-audit in --json mode. Always exits 0; payload tells us
          // pass/fail so the Govern KPI never crashes on a project with violations.
          const auditScript = path.join(repoRoot, "scripts/anchor-audit.mjs");
          if (!fs.existsSync(auditScript)) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: "anchor-audit.mjs not found" }));
            return;
          }
          const requestedScope = parsedUrl.searchParams.get("scope") || "all";
          const scope = ["app", "kit", "portal", "all"].includes(requestedScope) ? requestedScope : "app";
          const result = execSyncCaptured(`node "${auditScript}" --json --scope ${scope}`, { cwd: repoRoot });
          try {
            const parsed = JSON.parse(result.stdout);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: true, ranAt: new Date().toISOString(), ...parsed }));
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              ok: false,
              error: "audit produced non-JSON output",
              stderr: result.stderr,
            }));
          }
          return;
        }

        if (req.method === "GET" && url === "/api/component-usage") {
          // Surveys src/** for imports of base components, counts how many
          // distinct files reference each. Powers the Govern usage table.
          // Excludes the kit's own demo / story / spec / index files so we
          // measure real consumption, not internal bookkeeping.
          try {
            const baseDir = path.join(repoRoot, "src/components/base");
            const components = new Map(); // name → { files: Set, status: "kit" | "user-import" }
            if (fs.existsSync(baseDir)) {
              for (const f of fs.readdirSync(baseDir)) {
                if (!f.endsWith(".tsx")) continue;
                if (f.includes(".demo.") || f.includes(".stories.")) continue;
                const name = f.replace(/\.tsx$/, "");
                components.set(name, { files: new Set(), origin: "kit" });
              }
            }

            // Pull origin from kit-status.json if present (so user-imported
            // components appear with origin: "user-import").
            const kitStatusPath = path.join(repoRoot, ".anchor-portal/kit-status.json");
            if (fs.existsSync(kitStatusPath)) {
              try {
                const ks = JSON.parse(fs.readFileSync(kitStatusPath, "utf8"));
                for (const [name, info] of Object.entries(ks.components ?? {})) {
                  const lower = name.charAt(0).toLowerCase() + name.slice(1);
                  const entry = components.get(lower) ?? components.get(name);
                  if (entry && info.origin) entry.origin = info.origin;
                }
              } catch { /* tolerate broken kit-status */ }
            }

            // Recursive scan for .tsx / .ts files in src/, excluding the kit
            // itself and demo / story / spec / generated / portal sources.
            function walk(dir, acc = []) {
              for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                const p = path.join(dir, ent.name);
                if (ent.isDirectory()) {
                  if (ent.name === "node_modules" || ent.name === "anchor-portal" ||
                      ent.name === "components" || ent.name === "anchor" ||
                      ent.name === "design-tokens" || ent.name === "styles" ||
                      ent.name === "lib") continue;
                  walk(p, acc);
                } else if (
                  /\.(tsx|ts)$/.test(ent.name) &&
                  !ent.name.includes(".demo.") &&
                  !ent.name.includes(".stories.") &&
                  !ent.name.endsWith(".d.ts")
                ) {
                  acc.push(p);
                }
              }
              return acc;
            }
            const srcRoot = path.join(repoRoot, "src");
            const userFiles = fs.existsSync(srcRoot) ? walk(srcRoot, []) : [];

            const importRe = /from\s+["'](?:@\/components\/base\/|\.\.?\/.*\/components\/base\/|@design(?:\/|"$|'$|"\s|'\s))([\w-]*)["']/g;
            const designBarrelRe = /from\s+["']@design["']/;
            const namedImportRe = /import\s+\{([^}]+)\}\s+from\s+["']@design["']/g;

            for (const file of userFiles) {
              const text = fs.readFileSync(file, "utf8");

              // Path-style imports (@/components/base/button)
              importRe.lastIndex = 0;
              let m;
              while ((m = importRe.exec(text)) !== null) {
                const compName = m[1];
                if (!compName) continue;
                const entry = components.get(compName);
                if (entry) entry.files.add(path.relative(repoRoot, file));
              }

              // Barrel `import { Button, Card } from "@design"` — match each
              // imported identifier against component names (case-insensitive
              // since base files are kebab/lowercase, identifiers PascalCase).
              if (designBarrelRe.test(text)) {
                namedImportRe.lastIndex = 0;
                let nm;
                while ((nm = namedImportRe.exec(text)) !== null) {
                  for (const raw of nm[1].split(",")) {
                    const ident = raw.trim().split(/\s+as\s+/)[0].trim();
                    if (!ident) continue;
                    const lower = ident.charAt(0).toLowerCase() + ident.slice(1);
                    const kebab = lower.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
                    const entry = components.get(lower) ?? components.get(kebab);
                    if (entry) entry.files.add(path.relative(repoRoot, file));
                  }
                }
              }
            }

            const list = [...components.entries()].map(([name, { files, origin }]) => ({
              name,
              usage: files.size,
              files: [...files],
              origin,
            }));

            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              ok: true,
              total: list.length,
              used: list.filter((c) => c.usage > 0).length,
              unused: list.filter((c) => c.usage === 0).length,
              scannedFiles: userFiles.length,
              components: list,
            }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
          return;
        }

        if (req.method === "GET" && url === "/api/governance-status") {
          // Reports presence + freshness of generated AI rule / MCP files.
          // Consumed by the Govern tab's "treaty health" widget.
          try {
            const items = [
              { id: "cursorrules",       label: ".cursorrules",                   path: ".cursorrules" },
              { id: "claude-md",         label: "CLAUDE.md",                      path: "CLAUDE.md" },
              { id: "agents-md",         label: "AGENTS.md",                      path: "AGENTS.md" },
              { id: "copilot",           label: ".github/copilot-instructions.md", path: ".github/copilot-instructions.md" },
              { id: "cursor-rule",       label: ".cursor/rules/anchor.mdc",        path: ".cursor/rules/anchor.mdc" },
              { id: "cursor-selfcheck",  label: ".cursor/rules/anchor-selfcheck.mdc", path: ".cursor/rules/anchor-selfcheck.mdc" },
              { id: "root-mcp",          label: ".mcp.json",                      path: ".mcp.json" },
              { id: "cursor-mcp",        label: ".cursor/mcp.json",                path: ".cursor/mcp.json" },
            ];

            const tokensPath = path.join(repoRoot, "src/design-tokens/tokens.json");
            const tokensMtime = fs.existsSync(tokensPath) ? fs.statSync(tokensPath).mtimeMs : 0;

            const status = items.map((item) => {
              const abs = path.join(repoRoot, item.path);
              if (!fs.existsSync(abs)) return { ...item, present: false };
              const stat = fs.statSync(abs);
              const stale = item.id !== "root-mcp" && item.id !== "cursor-mcp"
                ? stat.mtimeMs < tokensMtime
                : false;
              return {
                ...item,
                present: true,
                mtime: stat.mtimeMs,
                stale,
              };
            });

            // MCP tool count — best-effort parse of root .mcp.json
            let mcpToolCount = null;
            const mcpPath = path.join(repoRoot, ".mcp.json");
            if (fs.existsSync(mcpPath)) {
              try {
                JSON.parse(fs.readFileSync(mcpPath, "utf8"));
                // The .mcp.json only declares servers, not their tools — to know
                // tool count we'd have to spawn MCP. Hardcode the known count of
                // anchor-mcp.mjs's TOOLS array length for now.
                const mcpEntry = path.join(repoRoot, "bin/anchor-mcp.mjs");
                if (fs.existsSync(mcpEntry)) {
                  const src = fs.readFileSync(mcpEntry, "utf8");
                  const matches = src.match(/^\s*\{\s*\n\s*name:\s*"[^"]+"/gm);
                  mcpToolCount = matches ? matches.length : null;
                }
              } catch { /* tolerate broken mcp.json */ }
            }

            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              ok: true,
              tokensMtime,
              files: status,
              mcpToolCount,
              presentCount: status.filter((s) => s.present).length,
              missingCount: status.filter((s) => !s.present).length,
              staleCount: status.filter((s) => s.stale).length,
            }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
          return;
        }

        if (req.method === "GET" && url === "/api/kit-status") {
          const statusPath = path.join(repoRoot, ".anchor-portal/kit-status.json");
          // Backwards-compat: also accept the legacy .storybook/kit-status.json so
          // consumers initialized before Stage 2 keep working until they re-run anchor upgrade.
          const legacy = path.join(repoRoot, ".storybook/kit-status.json");
          try {
            const file = fs.existsSync(statusPath) ? statusPath : legacy;
            const body = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : '{"components":{}}';
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.setHeader("Content-Type", "application/json");
            res.end('{"components":{}}');
          }
          return;
        }

        if (req.method === "GET" && url === "/api/design-tokens") {
          try {
            const body = fs.readFileSync(tokensPath, "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end("not found");
          }
          return;
        }

        if (req.method === "POST" && url === "/api/save-design-tokens") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              if (!isWriteAllowed(repoRoot, tokensPath)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "write path not in whitelist" }));
                return;
              }
              const payload = JSON.parse(raw);
              const jsonText = payload.jsonText ?? "";
              JSON.parse(jsonText);
              const pretty = `${JSON.stringify(JSON.parse(jsonText), null, 2)}\n`;
              writeFileWithFsync(tokensPath, pretty);
              const sync = execSyncCaptured("npm run sync:tokens", { cwd: repoRoot });
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  ok: true,
                  fileWritten: true,
                  syncOk: sync.ok,
                  syncError: sync.ok ? null : sync.stderr || sync.stdout,
                }),
              );
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "GET" && url === "/api/schemas") {
          try {
            const files = fs.readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
            const list = files.map((f) => {
              const spec = JSON.parse(fs.readFileSync(path.join(specDir, f), "utf8"));
              return { filename: f, id: spec.id, componentName: spec.componentName };
            });
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(list));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        if (req.method === "GET" && url.startsWith("/api/schema/")) {
          const name = decodeURIComponent(url.replace("/api/schema/", ""));
          if (!/^[\w.-]+\.spec\.json$/.test(name)) {
            res.statusCode = 400;
            res.end("bad filename");
            return;
          }
          const file = path.join(specDir, name);
          if (!file.startsWith(specDir + path.sep)) {
            res.statusCode = 403;
            res.end("forbidden");
            return;
          }
          try {
            const body = fs.readFileSync(file, "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end("not found");
          }
          return;
        }

        if (req.method === "POST" && url === "/api/rename-component-title") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              const payload = JSON.parse(raw);
              const importPathRaw = String(payload.importPath ?? "");
              const prevTitle = String(payload.prevTitle ?? "");
              const nextTitle = String(payload.nextTitle ?? "").trim();

              if (!importPathRaw || !prevTitle || !nextTitle || nextTitle === prevTitle) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "missing or unchanged title" }));
                return;
              }
              if (nextTitle.includes("/") || nextTitle.includes("\\")) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "title must not contain path separators" }));
                return;
              }

              const absImport = path.isAbsolute(importPathRaw)
                ? path.normalize(importPathRaw)
                : path.normalize(path.join(repoRoot, importPathRaw));
              const rel = path.relative(repoRoot, absImport);
              if (rel.startsWith("..")) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "forbidden path" }));
                return;
              }
              if (!rel.startsWith(`src${path.sep}`)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "only src/** files allowed" }));
                return;
              }
              if (!/\.(demo\.(tsx|ts|jsx|js)|stories\.(tsx|ts|jsx|js)|mdx)$/.test(rel)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "only demo, stories or mdx" }));
                return;
              }

              let text = fs.readFileSync(absImport, "utf8");
              const ext = path.extname(absImport);

              function escapeRe(s) {
                return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              }

              if (ext === ".mdx") {
                const re = new RegExp(
                  `(<Meta\\s+[^>]*\\btitle=)(["'])${escapeRe(prevTitle)}\\2`,
                  "m",
                );
                if (!re.test(text)) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify({ ok: false, error: "mdx Meta title not found" }));
                  return;
                }
                text = text.replace(re, (_, open, q) => `${open}${q}${nextTitle}${q}`);
              } else {
                const re = new RegExp(`(\\btitle\\s*:\\s*)(["'])${escapeRe(prevTitle)}\\2`);
                if (!re.test(text)) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify({ ok: false, error: "csf title not found" }));
                  return;
                }
                text = text.replace(re, (_, open, q) => `${open}${q}${nextTitle}${q}`);
              }

              fs.writeFileSync(absImport, text, "utf8");
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "POST" && url === "/api/save-schema") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              const payload = JSON.parse(raw);
              const filename = payload.filename ?? "";
              const jsonText = payload.jsonText ?? "";
              if (!/^[\w.-]+\.spec\.json$/.test(filename)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, fileWritten: false, error: "bad filename" }));
                return;
              }
              JSON.parse(jsonText);
              const pretty = `${JSON.stringify(JSON.parse(jsonText), null, 2)}\n`;
              const file = path.join(specDir, filename);
              if (!file.startsWith(specDir + path.sep) || !isWriteAllowed(repoRoot, file)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, fileWritten: false, error: "forbidden path" }));
                return;
              }

              writeFileWithFsync(file, pretty);
              const relPath = path.relative(repoRoot, file).split(path.sep).join("/");

              const anchorSync = execSyncCaptured("npm run sync:anchor", { cwd: repoRoot });
              let auditResult = null;
              if (anchorSync.ok) {
                const audit = execSyncCaptured("npm run anchor:audit", {
                  cwd: repoRoot,
                  timeout: 120000,
                });
                auditResult = audit.ok
                  ? { passed: true, output: audit.stdout || "" }
                  : { passed: false, output: audit.stderr || audit.stdout || "" };
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  ok: true,
                  fileWritten: true,
                  path: relPath,
                  syncOk: anchorSync.ok,
                  syncError: anchorSync.ok ? null : anchorSync.stderr || anchorSync.stdout || null,
                  audit: auditResult,
                }),
              );
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: false, fileWritten: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "POST" && url === "/api/delete-component") {
          let raw = "";
          req.on("data", (c) => { raw += String(c); });
          req.on("end", () => {
            try {
              const payload = JSON.parse(raw);
              const importPathRaw = String(payload.importPath ?? "");

              if (!importPathRaw) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "missing importPath" }));
                return;
              }

              const absStory = path.isAbsolute(importPathRaw)
                ? path.normalize(importPathRaw)
                : path.normalize(path.join(repoRoot, importPathRaw));
              const rel = path.relative(repoRoot, absStory);
              if (rel.startsWith("..") || !rel.startsWith(`src${path.sep}`)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "forbidden path" }));
                return;
              }

              const deleted = [];

              // Read the story to find the component import
              let componentFile = null;
              if (fs.existsSync(absStory)) {
                const storyText = fs.readFileSync(absStory, "utf8");
                // Match: import { X } from "./component-name";
                const importMatch = storyText.match(/from\s+["']\.\/([\w-]+)["']/);
                if (importMatch) {
                  const compBase = importMatch[1];
                  const dir = path.dirname(absStory);
                  // Try .tsx then .ts
                  for (const ext of [".tsx", ".ts"]) {
                    const candidate = path.join(dir, compBase + ext);
                    if (fs.existsSync(candidate)) {
                      componentFile = candidate;
                      break;
                    }
                  }
                }
              }

              // Delete story file
              if (fs.existsSync(absStory)) {
                fs.unlinkSync(absStory);
                deleted.push(path.relative(repoRoot, absStory));
              }

              // Delete component file
              if (componentFile && fs.existsSync(componentFile)) {
                fs.unlinkSync(componentFile);
                deleted.push(path.relative(repoRoot, componentFile));
              }

              // Delete spec.json if exists
              if (componentFile) {
                const compId = path.basename(componentFile, path.extname(componentFile)).toLowerCase();
                const specPath = path.join(specDir, `${compId}.spec.json`);
                if (fs.existsSync(specPath)) {
                  fs.unlinkSync(specPath);
                  deleted.push(path.relative(repoRoot, specPath));
                }
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: true, deleted }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "POST" && url === "/api/upload-component") {
          const chunks = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            try {
              const body = Buffer.concat(chunks);
              const boundary = (req.headers["content-type"] || "").split("boundary=")[1];
              if (!boundary) { res.statusCode = 400; res.end("no boundary"); return; }

              const parts = body.toString("binary").split("--" + boundary);
              let filename = "";
              let content = "";

              for (const part of parts) {
                const headerEnd = part.indexOf("\r\n\r\n");
                if (headerEnd < 0) continue;
                const headers = part.slice(0, headerEnd);
                const fileMatch = headers.match(/filename="([^"]+)"/);
                if (fileMatch) {
                  filename = fileMatch[1].replace(/.*[/\\]/, "");
                  content = part.slice(headerEnd + 4).replace(/\r\n$/, "");
                }
              }

              if (!filename || !filename.endsWith(".tsx")) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "Requires a .tsx file" }));
                return;
              }

              const compName = filename.replace(/\.tsx$/, "");
              const baseDir = path.join(repoRoot, "src/components/base");
              if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

              const compPath = path.join(baseDir, filename);
              if (!isWriteAllowed(repoRoot, compPath)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "forbidden" }));
                return;
              }

              writeFileWithFsync(compPath, Buffer.from(content, "binary"));

              const pascal = compName.replace(/(^|-)(\w)/g, (_, _2, c) => c.toUpperCase());
              const demoPath = path.join(baseDir, pascal + ".demo.tsx");
              if (!fs.existsSync(demoPath)) {
                const demo = [
                  `import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";`,
                  `import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";`,
                  `import { autoClassControls } from "@/design-tokens/tw-class-audit";`,
                  `import componentSrc from "./${compName}.tsx?raw";`,
                  `import { ${pascal} } from "./${compName}";`,
                  ``,
                  `const audit = autoClassControls(componentSrc);`,
                  ``,
                  `const meta = {`,
                  `  title: "${pascal}",`,
                  `  component: ${pascal},`,
                  `  parameters: { anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children"] }) },`,
                  `  args: { ...audit.args },`,
                  `  argTypes: { ...audit.argTypes },`,
                  `} satisfies Meta<typeof ${pascal}>;`,
                  ``,
                  `export default meta;`,
                  `type Story = StoryObj<typeof meta>;`,
                  ``,
                  `export const Default: Story = {`,
                  `  render: (args) => (`,
                  `    <${pascal} className={audit.buildClassName(args as unknown as Record<string, string>)}>`,
                  `      Sample content`,
                  `    </${pascal}>`,
                  `  ),`,
                  `};`,
                  ``,
                ].join("\n");
                writeFileWithFsync(demoPath, demo);
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                ok: true,
                component: compPath.replace(repoRoot + "/", ""),
                demo: demoPath.replace(repoRoot + "/", ""),
              }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        // POST /api/import-component-path  — accepts { path } where path is
        // an absolute (or ~-prefixed) file or folder on the dev machine.
        // For a .tsx file: copies it into src/components/base/ and
        // auto-generates a *.demo.tsx if missing.
        // For a folder: imports scanned .tsx files (skipping
        // *.demo.tsx and *.stories.tsx).
        if (req.method === "POST" && url === "/api/import-component-path") {
          const chunks = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            try {
              const raw = Buffer.concat(chunks).toString("utf8");
              const body = raw ? JSON.parse(raw) : {};
              let sourcePath = String(body?.path ?? "").trim();
              if (!sourcePath) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "path is required" }));
                return;
              }
              // Expand ~ to $HOME for ergonomics.
              if (sourcePath.startsWith("~")) {
                sourcePath = path.join(process.env.HOME || "", sourcePath.slice(1));
              }
              if (!path.isAbsolute(sourcePath)) {
                sourcePath = path.resolve(repoRoot, sourcePath);
              }
              if (!fs.existsSync(sourcePath)) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: `Path not found: ${sourcePath}` }));
                return;
              }

              const stat = fs.statSync(sourcePath);
              const requestedFiles = Array.isArray(body?.files)
                ? body.files.map((file) => String(file).trim()).filter(Boolean)
                : [];
              const safeOnly = body?.safeOnly === true;
              if (safeOnly && requestedFiles.length === 0) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "safeOnly import requires a files list" }));
                return;
              }

              if (!stat.isFile() && !stat.isDirectory()) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "Path is neither a file nor folder" }));
                return;
              }

              const sourceRoot = stat.isDirectory() ? sourcePath : path.dirname(sourcePath);
              const filesToImport = [];
              const skipped = [];
              if (requestedFiles.length > 0) {
                for (const rawFile of requestedFiles) {
                  let selectedPath = rawFile;
                  if (selectedPath.startsWith("~")) {
                    selectedPath = path.join(process.env.HOME || "", selectedPath.slice(1));
                  }
                  if (!path.isAbsolute(selectedPath)) {
                    selectedPath = path.resolve(sourceRoot, selectedPath);
                  }
                  if (!isInsidePath(sourceRoot, selectedPath)) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ ok: false, error: `Selected file is outside source path: ${rawFile}` }));
                    return;
                  }
                  if (!fs.existsSync(selectedPath) || !fs.statSync(selectedPath).isFile()) {
                    skipped.push({ file: path.basename(selectedPath), error: "not found or not a file" });
                    continue;
                  }
                  const entry = path.basename(selectedPath);
                  if (!isImportableComponentFile(selectedPath)) {
                    skipped.push({ file: entry, error: "not an importable component .tsx file" });
                    continue;
                  }
                  if (safeOnly) {
                    const inspection = inspectComponentImports(selectedPath);
                    if (inspection.level !== "safe") {
                      skipped.push({ file: entry, error: `not safe (${inspection.level})` });
                      continue;
                    }
                  }
                  filesToImport.push(selectedPath);
                }
              } else if (stat.isFile()) {
                if (!isImportableComponentFile(sourcePath)) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ ok: false, error: "File must be an importable component .tsx file" }));
                  return;
                }
                filesToImport.push(sourcePath);
              } else {
                filesToImport.push(...collectImportableComponentFiles(sourcePath, { recursive: body?.recursive === true }));
              }
              if (filesToImport.length === 0) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "No importable .tsx files found", errors: skipped }));
                return;
              }

              const baseDir = path.join(repoRoot, "src/components/base");
              if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

              const imported = [];
              const errors = [...skipped];
              for (const src of filesToImport) {
                try {
                  const sourceRel = stat.isDirectory()
                    ? path.relative(sourceRoot, src).split(path.sep).join("/")
                    : path.basename(src);
                  const filename = path.basename(src);
                  const compName = filename.replace(/\.tsx$/, "");
                  const dest = path.join(baseDir, sourceRel);
                  if (!isWriteAllowed(repoRoot, dest)) {
                    errors.push({ file: filename, error: "forbidden destination" });
                    continue;
                  }
                  const content = fs.readFileSync(src);
                  fs.mkdirSync(path.dirname(dest), { recursive: true });
                  writeFileWithFsync(dest, content);

                  const pascal = compName.replace(/(^|-)(\w)/g, (_, _2, c) => c.toUpperCase());
                  const demoPath = path.join(path.dirname(dest), pascal + ".demo.tsx");
                  if (!fs.existsSync(demoPath)) {
                    const demo = [
                      `import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";`,
                      `import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";`,
                      `import { autoClassControls } from "@/design-tokens/tw-class-audit";`,
                      `import componentSrc from "./${compName}.tsx?raw";`,
                      `import { ${pascal} } from "./${compName}";`,
                      ``,
                      `const audit = autoClassControls(componentSrc);`,
                      ``,
                      `const meta = {`,
                      `  title: "${pascal}",`,
                      `  component: ${pascal},`,
                      `  parameters: { anchorTokenCompliance: storyAnchorCompliance({ ignoreArgNames: ["children"] }) },`,
                      `  args: { ...audit.args },`,
                      `  argTypes: { ...audit.argTypes },`,
                      `} satisfies Meta<typeof ${pascal}>;`,
                      ``,
                      `export default meta;`,
                      `type Story = StoryObj<typeof meta>;`,
                      ``,
                      `export const Default: Story = {`,
                      `  render: (args) => (`,
                      `    <${pascal} className={audit.buildClassName(args as unknown as Record<string, string>)}>`,
                      `      Sample content`,
                      `    </${pascal}>`,
                      `  ),`,
                      `};`,
                      ``,
                    ].join("\n");
                    writeFileWithFsync(demoPath, demo);
                  }
                  imported.push(dest.replace(repoRoot + "/", ""));
                } catch (e) {
                  errors.push({ file: path.basename(src), error: String(e) });
                }
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                ok: imported.length > 0,
                imported,
                errors,
                kind: stat.isDirectory() ? "folder" : "file",
              }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
