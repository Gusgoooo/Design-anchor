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
        const url = req.url?.split("?")[0] ?? "";

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
        // For a folder: imports every direct-child .tsx file (skipping
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
              const filesToImport = [];
              if (stat.isFile()) {
                if (!sourcePath.endsWith(".tsx")) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ ok: false, error: "File must end with .tsx" }));
                  return;
                }
                filesToImport.push(sourcePath);
              } else if (stat.isDirectory()) {
                for (const entry of fs.readdirSync(sourcePath)) {
                  if (!entry.endsWith(".tsx")) continue;
                  if (entry.includes(".demo.") || entry.includes(".stories.")) continue;
                  filesToImport.push(path.join(sourcePath, entry));
                }
                if (filesToImport.length === 0) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ ok: false, error: "No .tsx files found in folder" }));
                  return;
                }
              } else {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "Path is neither a file nor folder" }));
                return;
              }

              const baseDir = path.join(repoRoot, "src/components/base");
              if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

              const imported = [];
              const errors = [];
              for (const src of filesToImport) {
                try {
                  const filename = path.basename(src);
                  const compName = filename.replace(/\.tsx$/, "");
                  const dest = path.join(baseDir, filename);
                  if (!isWriteAllowed(repoRoot, dest)) {
                    errors.push({ file: filename, error: "forbidden destination" });
                    continue;
                  }
                  const content = fs.readFileSync(src);
                  writeFileWithFsync(dest, content);

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
