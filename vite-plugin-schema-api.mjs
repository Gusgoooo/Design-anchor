import fs from "node:fs";
import path from "node:path";
import { consumerRootFor, projectTokenPaths } from "./scripts/lib/token-source.mjs";
import {
  execSyncCaptured,
  isInsidePath,
  isWriteAllowed,
  writeFileWithFsync,
} from "./src/anchor-server/fs-safety.mjs";
import { requireMutationConfirm, sendJson } from "./src/anchor-server/http-utils.mjs";

const COMPONENTS_REL = "src/components/anchor-ui";
const FALLBACK_COMPONENTS_REL = "src/components/base";
const COMPONENT_IMPORT_BASE = "@/components/anchor-ui";
const FALLBACK_COMPONENT_IMPORT_BASE = "@/components/base";
const DEMO_COMPONENTS_REL = "src/anchor/component-demos/base";

function componentSourceInfo(repoRoot) {
  const consumerRoot = consumerRootFor(repoRoot);
  const visibleDir = path.join(consumerRoot, COMPONENTS_REL);
  if (fs.existsSync(visibleDir)) {
    return {
      root: consumerRoot,
      dir: visibleDir,
      rel: COMPONENTS_REL,
      importBase: COMPONENT_IMPORT_BASE,
      mode: "visible",
    };
  }
  return {
    root: repoRoot,
    dir: path.join(repoRoot, FALLBACK_COMPONENTS_REL),
    rel: FALLBACK_COMPONENTS_REL,
    importBase: FALLBACK_COMPONENT_IMPORT_BASE,
    mode: "fallback",
  };
}

function demoSourceInfo(repoRoot) {
  const demoDir = path.join(repoRoot, DEMO_COMPONENTS_REL);
  if (fs.existsSync(demoDir)) {
    return { dir: demoDir, rel: DEMO_COMPONENTS_REL };
  }
  return { dir: path.join(repoRoot, FALLBACK_COMPONENTS_REL), rel: FALLBACK_COMPONENTS_REL };
}

function rewriteImportedComponentSource(text) {
  return String(text)
    .replaceAll("@/components/base", COMPONENT_IMPORT_BASE)
    .replaceAll("src/components/base", COMPONENTS_REL);
}

function demoComponentSpecifier(componentRel, sourceRel = "") {
  const normalized = componentRel.split(path.sep).join("/").replace(/\.tsx$/, "");
  return `${COMPONENT_IMPORT_BASE}/${normalized}`;
}

function demoRawSpecifier(componentRel) {
  const normalized = componentRel.split(path.sep).join("/");
  return `${COMPONENT_IMPORT_BASE}/${normalized}?raw`;
}

const ACTIVE_PRESET_STYLE_REL = "src/anchor/rules/ACTIVE_PRESET_STYLE.md";

function cleanPromptText(value, maxLength = 480) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanPromptList(value, maxItems = 5) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanPromptText(item, 360))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeAiStyleGuide(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const designPhilosophy = cleanPromptText(value.designPhilosophy, 520);
  const apply = cleanPromptList(value.apply, 6);
  const avoid = cleanPromptList(value.avoid, 6);
  if (!designPhilosophy && apply.length === 0 && avoid.length === 0) return null;
  return { designPhilosophy, apply, avoid };
}

function renderActivePresetStyleBody({ preset, presetName, tone, preferredTheme, guide }) {
  const name = cleanPromptText(presetName || preset || "Preset", 80);
  const id = cleanPromptText(preset, 80);
  const presetTone = cleanPromptText(tone, 160);
  const theme = cleanPromptText(preferredTheme, 24);
  const lines = [
    `# Active preset style: ${name}`,
    "",
    "This is a lightweight B2B aesthetic layer for AI-written UI. It is secondary to Design-anchor component specs, semantic tokens, and audit rules.",
    "",
    "## Priority",
    "",
    "- First obey component specs, imports, semantic props, and token-only styling.",
    "- Use this preset only for page rhythm, hierarchy, density, surface treatment, motion restraint, and decorative restraint.",
    "- Do not copy colors, hex values, pixel values, or custom component implementations from this text.",
    "",
    "## Preset context",
    "",
    `- Preset: ${name}${id && id !== name ? ` (${id})` : ""}`,
  ];
  if (presetTone) lines.push(`- Tone: ${presetTone}`);
  if (theme) lines.push(`- Preferred theme: ${theme}`);
  lines.push("");
  if (guide.designPhilosophy) {
    lines.push("## Design philosophy", "", guide.designPhilosophy, "");
  }
  if (guide.apply.length > 0) {
    lines.push("## Apply lightly", "");
    guide.apply.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }
  if (guide.avoid.length > 0) {
    lines.push("## Avoid", "");
    guide.avoid.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }
  lines.push("## B2B restraint rule", "");
  lines.push("- Prefer clarity, scanability, and predictable workflows over expressive visual moments.");
  lines.push("- If a style choice would make a dashboard, form, table, or settings screen harder to read, choose the quieter option.");
  return `${lines.join("\n").trim()}\n`;
}

function renderCursorPresetStyleRule(styleBody) {
  return `---
description: Active Design-anchor preset style, restrained B2B layer for AI-written UI
alwaysApply: true
---

${styleBody}`;
}

function writePresetStyleArtifacts(repoRoot, payload) {
  const guide = normalizeAiStyleGuide(payload.aiStyleGuide);
  if (!guide) return { styleWritten: false };

  const styleBody = renderActivePresetStyleBody({
    preset: payload.preset,
    presetName: payload.presetName,
    tone: payload.tone,
    preferredTheme: payload.preferredTheme,
    guide,
  });

  const activeStylePath = path.join(repoRoot, ACTIVE_PRESET_STYLE_REL);
  if (!isWriteAllowed(repoRoot, activeStylePath)) {
    throw new Error("active preset style path not in whitelist");
  }
  fs.mkdirSync(path.dirname(activeStylePath), { recursive: true });
  writeFileWithFsync(activeStylePath, styleBody);

  const consumerRoot = consumerRootFor(repoRoot);
  const cursorStylePath = path.join(consumerRoot, ".cursor/rules/anchor-style.mdc");
  fs.mkdirSync(path.dirname(cursorStylePath), { recursive: true });
  writeFileWithFsync(cursorStylePath, renderCursorPresetStyleRule(styleBody));

  return {
    styleWritten: true,
    activeStylePath: path.relative(repoRoot, activeStylePath).split(path.sep).join("/"),
    cursorStylePath: path.relative(consumerRoot, cursorStylePath).split(path.sep).join("/"),
  };
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
  if (importPath.startsWith("@/components/anchor-ui/")) return "safe";
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

function isImportableComponentFile(filePath) {
  const name = path.basename(filePath);
  return name.endsWith(".tsx") && !name.includes(".demo.") && !name.includes(".stories.");
}

function inspectReactTailwindComponent(absPath) {
  const text = fs.readFileSync(absPath, "utf8");
  const reasons = [];
  const hasTsxExtension = isImportableComponentFile(absPath);
  const hasJsxSignal = /<([A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(\s|>|\/)/.test(text) || /React\.createElement\s*\(/.test(text);
  const hasReactSignal =
    /\bfrom\s+["']react["']/.test(text) ||
    /\bReact\./.test(text) ||
    /\bReactNode\b|\bComponentProps\b|\bHTMLAttributes\b|\bforwardRef\b/.test(text) ||
    hasJsxSignal;
  const hasComponentExport =
    /export\s+(?:default\s+)?(?:function|const|class)\s+[A-Z][A-Za-z0-9_]*/.test(text) ||
    /export\s+default\s+[A-Z][A-Za-z0-9_]*/.test(text) ||
    /export\s+const\s+[A-Z][A-Za-z0-9_]*\s*=.*(?:forwardRef|React\.forwardRef|\(|<)/s.test(text);
  const hasTailwindSignal =
    /\bclassName\s*=/.test(text) ||
    /\bclassName\s*:/.test(text) ||
    /\b(?:cn|clsx|cva|twMerge)\s*\(/.test(text) ||
    /\bfrom\s+["'](?:clsx|tailwind-merge|class-variance-authority|@\/lib\/utils)["']/.test(text);
  const hasTailwindUtility =
    /\b(?:bg|text|border|rounded|shadow|ring|p|px|py|m|mx|my|w|h|min-w|min-h|max-w|max-h|flex|grid|gap|items|justify|content|space|divide|absolute|relative|fixed|sticky|inset|top|right|bottom|left|z|opacity|transition|duration|ease|hover|focus|active|disabled|data-\[[^\]]+\]):?-/.test(text);
  const hasUnsupportedStyleImport = /import\s+["'][^"']+\.(?:css|scss|sass|less|styl|module\.css)["']/.test(text)
    || /from\s+["'][^"']+\.(?:css|scss|sass|less|styl|module\.css)["']/.test(text);

  if (!hasTsxExtension) reasons.push("must be a component .tsx file");
  if (!hasReactSignal || !hasJsxSignal || !hasComponentExport) reasons.push("must look like an exported React component");
  if (!hasTailwindSignal || !hasTailwindUtility) reasons.push("must use Tailwind-style className/cn/cva utilities");
  if (hasUnsupportedStyleImport) reasons.push("external CSS/module style imports are not supported");

  return {
    ok: reasons.length === 0,
    reasons,
    checks: {
      tsx: hasTsxExtension,
      react: hasReactSignal && hasJsxSignal && hasComponentExport,
      tailwind: hasTailwindSignal && hasTailwindUtility,
      externalStyleImport: hasUnsupportedStyleImport,
    },
  };
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

function consumerProjectRoot(anchorRoot) {
  return path.basename(anchorRoot) === ".anchor" ? path.dirname(anchorRoot) : anchorRoot;
}

function toPascalName(name) {
  return String(name)
    .replace(/\.[tj]sx?$/, "")
    .replace(/(^|[-_\s])(\w)/g, (_, _sep, c) => c.toUpperCase());
}

function toKebabName(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

function collectComponentCatalog(repoRoot) {
  const components = new Map();
  const source = componentSourceInfo(repoRoot);
  const baseDir = source.dir;
  const specDir = path.join(repoRoot, "src/anchor/schema/components");

  if (fs.existsSync(baseDir)) {
    function walkBase(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkBase(p);
          continue;
        }
        if (!entry.name.endsWith(".tsx")) continue;
        if (entry.name.includes(".demo.") || entry.name.includes(".stories.")) continue;
        const rel = path.relative(baseDir, p).split(path.sep).join("/");
        const id = rel.replace(/\.tsx$/, "");
        const leaf = path.basename(id);
        components.set(id, {
          id,
          name: toPascalName(leaf),
          file: `${source.rel}/${rel}`,
          files: new Set(),
          origin: "kit",
        });
      }
    }
    walkBase(baseDir);
  }

  if (fs.existsSync(specDir)) {
    for (const file of fs.readdirSync(specDir)) {
      if (!file.endsWith(".spec.json")) continue;
      try {
        const spec = JSON.parse(fs.readFileSync(path.join(specDir, file), "utf8"));
        const modulePath = String(spec.wraps?.module ?? "");
        const id = modulePath.startsWith(`${COMPONENT_IMPORT_BASE}/`)
          ? modulePath.slice(`${COMPONENT_IMPORT_BASE}/`.length)
          : modulePath.startsWith(`${FALLBACK_COMPONENT_IMPORT_BASE}/`)
            ? modulePath.slice(`${FALLBACK_COMPONENT_IMPORT_BASE}/`.length)
          : file.replace(/\.spec\.json$/, "");
        const entry = components.get(id) ?? {
          id,
          name: spec.componentName ?? toPascalName(path.basename(id)),
          file: modulePath,
          files: new Set(),
          origin: "kit",
        };
        entry.name = spec.componentName ?? entry.name;
        entry.specId = spec.id;
        entry.specFile = `src/anchor/schema/components/${file}`;
        components.set(id, entry);
      } catch {
        // tolerate a broken spec; consistency checks report it elsewhere
      }
    }
  }

  return components;
}

function collectUsageScanFiles(projectRoot, anchorRoot) {
  const roots = ["src", "app", "pages", "packages", "apps"]
    .map((dir) => path.join(projectRoot, dir))
    .filter((dir) => fs.existsSync(dir));
  const out = [];
  const projectAbs = path.resolve(projectRoot);
  const anchorAbs = path.resolve(anchorRoot);
  const scanStandaloneRepo = projectAbs === anchorAbs;
  const skipDirs = new Set([
    "node_modules",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".turbo",
    ".vite",
    ".git",
    "coverage",
  ]);

  function walk(dir) {
    const resolved = path.resolve(dir);
    if (!scanStandaloneRepo && isInsidePath(anchorAbs, resolved)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      const rel = path.relative(projectRoot, p).split(path.sep).join("/");
      if (ent.isDirectory()) {
        if (skipDirs.has(ent.name) || ent.name === ".anchor") continue;
        if (scanStandaloneRepo && (
          rel === "src/components" ||
          rel === "src/anchor" ||
          rel === "src/styles"
        )) continue;
        walk(p);
      } else if (
        /\.(tsx|ts|jsx|js)$/.test(ent.name) &&
        !ent.name.includes(".demo.") &&
        !ent.name.includes(".stories.") &&
        !ent.name.endsWith(".d.ts")
      ) {
        out.push(p);
      }
    }
  }

  for (const root of roots) walk(root);
  return out;
}

/**
 * Dev server middleware: reads/writes src/anchor/schema/components/*.spec.json, executes sync:anchor after saving.
 * Shared by standalone Portal and Storybook.
 */
export function schemaApiPlugin(repoRoot) {
  const specDir = path.join(repoRoot, "src/anchor/schema/components");
  const getTokenPaths = () => projectTokenPaths(repoRoot);

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
          // Pre-import compatibility check. Given a folder or React + Tailwind
          // .tsx path,
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
                const stack = inspectReactTailwindComponent(f);
                return {
                  file: componentReportName(p, f),
                  absPath: f,
                  level: stack.ok ? insp.level : "risky",
                  imports: insp.imports,
                  stack,
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
                  incompatible: reports.filter((r) => !r.stack.ok).length,
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
          // Wipes the visible component source for the "empty library" onboarding mode.
          // Tokens / specs / generated files stay so the user can grow from zero.
          let raw = "";
          req.on("data", (c) => { raw += String(c); });
          req.on("end", () => {
            try {
              const payload = raw ? JSON.parse(raw) : {};
              const mutation = requireMutationConfirm(res, payload, "clear components");
              if (!mutation) return;

              const baseDir = componentSourceInfo(repoRoot).dir;
              const removed = [];
              if (fs.existsSync(baseDir)) {
                for (const f of fs.readdirSync(baseDir)) {
                  const target = path.join(baseDir, f);
                  removed.push(path.relative(repoRoot, target).split(path.sep).join("/"));
                  if (!mutation.dryRun) fs.rmSync(target, { recursive: true, force: true });
                }
              }
              sendJson(res, { ok: true, dryRun: mutation.dryRun, removed });
            } catch (e) {
              sendJson(res, { ok: false, error: String(e) }, 500);
            }
          });
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
          // Surveys the consumer app for imports of base components, counts how
          // many distinct files reference each. When Portal runs inside
          // project/.anchor, scan the parent business project; when developing
          // this repo directly, scan this repo.
          try {
            const projectRoot = consumerProjectRoot(repoRoot);
            const components = collectComponentCatalog(repoRoot);

            const kitStatusPath = path.join(repoRoot, ".anchor-portal/kit-status.json");
            if (fs.existsSync(kitStatusPath)) {
              try {
                const ks = JSON.parse(fs.readFileSync(kitStatusPath, "utf8"));
                for (const [name, info] of Object.entries(ks.components ?? {})) {
                  const entry = components.get(toKebabName(name)) ?? components.get(name);
                  if (entry && info.origin) entry.origin = info.origin;
                }
              } catch { /* tolerate broken kit-status */ }
            }

            const userFiles = collectUsageScanFiles(projectRoot, repoRoot);
            const byKebab = new Map();
            const byPascal = new Map();
            for (const entry of components.values()) {
              byKebab.set(entry.id, entry);
              byKebab.set(toKebabName(path.basename(entry.id)), entry);
              byPascal.set(entry.name, entry);
            }

            const importKinds = { designAlias: 0, baseDeep: 0, jsxDetected: 0 };

            for (const file of userFiles) {
              const text = fs.readFileSync(file, "utf8");
              const relFile = path.relative(projectRoot, file).split(path.sep).join("/");

              if (/from\s+["']@design/.test(text)) importKinds.designAlias += 1;
              if (/components\/(?:anchor-ui|base)\//.test(text) || /\.anchor\/src\/components\/base\//.test(text)) importKinds.baseDeep += 1;
              if (/<[A-Z][A-Za-z0-9]*\b/.test(text)) importKinds.jsxDetected += 1;

              const importRe = /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
              let m;
              while ((m = importRe.exec(text)) !== null) {
                const clause = m[1];
                const source = m[2];

                if (
                  source === "@design" ||
                  source.endsWith("/src/components/anchor-ui") ||
                  source.endsWith("/.anchor/src/components/base")
                ) {
                  const named = /\{([^}]+)\}/.exec(clause);
                  if (!named) continue;
                  for (const raw of named[1].split(",")) {
                    const ident = raw.trim().split(/\s+as\s+/)[0].trim();
                    const entry = byPascal.get(ident) ?? byKebab.get(toKebabName(ident));
                    if (entry) entry.files.add(relFile);
                  }
                  continue;
                }

                const baseMatch =
                  /(?:^@\/components\/anchor-ui\/|^@\/components\/base\/|^@design\/|\/src\/components\/anchor-ui\/|\/\.anchor\/src\/components\/base\/)(.+)$/.exec(source);
                if (baseMatch) {
                  const id = baseMatch[1].replace(/\/index$/, "");
                  const entry = byKebab.get(id) ?? byKebab.get(toKebabName(path.basename(id)));
                  if (entry) entry.files.add(relFile);
                  continue;
                }

                if (source.includes("components/anchor-ui/") || source.includes("components/base/")) {
                  const id = source
                    .split(/components\/(?:anchor-ui|base)\//)
                    .pop()
                    .replace(/\/index$/, "");
                  const entry = byKebab.get(id) ?? byKebab.get(toKebabName(path.basename(id)));
                  if (entry) entry.files.add(relFile);
                }
              }

              const jsxTags = [...text.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((match) => match[1]);
              for (const tag of jsxTags) {
                const entry = byPascal.get(tag);
                if (entry) entry.files.add(relFile);
              }
            }

            const list = [...components.values()].map(({ id, name, files, origin, specId, specFile }) => ({
              id,
              name,
              usage: files.size,
              files: [...files],
              origin,
              specId,
              specFile,
            }));
            const usedList = list.filter((c) => c.usage > 0);
            const coverage = list.length ? Math.round((usedList.length / list.length) * 100) : 0;

            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              ok: true,
              projectRoot,
              anchorRoot: repoRoot,
              total: list.length,
              used: usedList.length,
              unused: list.filter((c) => c.usage === 0).length,
              coverage,
              totalReferences: list.reduce((sum, c) => sum + c.usage, 0),
              scannedFiles: userFiles.length,
              importKinds,
              top: [...usedList].sort((a, b) => b.usage - a.usage).slice(0, 8),
              components: list,
            }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
          return;
        }

        if (req.method === "GET" && url === "/api/token-summary") {
          try {
            const { tokensPath, cssPath, spacingPath } = getTokenPaths();
            const tokenDoc = fs.existsSync(tokensPath)
              ? JSON.parse(fs.readFileSync(tokensPath, "utf8"))
              : {};
            const cssText = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
            const spacing = fs.existsSync(spacingPath)
              ? JSON.parse(fs.readFileSync(spacingPath, "utf8"))
              : null;

            const seed = tokenDoc.seed ?? {};
            const seedDark = tokenDoc.seedDark ?? {};
            const customSeeds = tokenDoc.customSeeds ?? {};
            const mapOverrides = tokenDoc.mapOverrides ?? {};
            const lightOverrides = mapOverrides.light ?? {};
            const darkOverrides = mapOverrides.dark ?? {};
            const cssVars = [...cssText.matchAll(/^\s*--([a-zA-Z0-9_.\\-]+)\s*:/gm)].map((m) => m[1]);
            const updatedAt = fs.existsSync(tokensPath) ? fs.statSync(tokensPath).mtimeMs : null;
            const generatedAt = fs.existsSync(cssPath) ? fs.statSync(cssPath).mtimeMs : null;
            const generatedStale = updatedAt != null && generatedAt != null ? generatedAt < updatedAt : false;

            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({
              ok: true,
              status: generatedStale ? "stale" : Object.keys(seed).length ? "ready" : "missing",
              version: tokenDoc.version ?? null,
              seedCount: Object.keys(seed).length,
              darkOverrideCount: Object.keys(seedDark).length,
              customSeedCount: Object.keys(customSeeds).length,
              overrideCount: Object.keys(lightOverrides).length + Object.keys(darkOverrides).length,
              chartSeedCount: Object.keys(customSeeds).filter((key) => /^chart\d/.test(key)).length,
              spacingStopCount: spacing?.suffixToPx ? Object.keys(spacing.suffixToPx).length : cssVars.filter((name) => name.startsWith("spacing-")).length,
              cssVarCount: cssVars.length,
              anchorMirrorCount: cssVars.filter((name) => name.startsWith("_anchor-")).length,
              colorVarCount: cssVars.filter((name) => name.startsWith("color-")).length,
              radiusVarCount: cssVars.filter((name) => name.startsWith("radius-")).length,
              fontVarCount: cssVars.filter((name) => name.startsWith("font-size-")).length,
              updatedAt,
              generatedAt,
              generatedStale,
              seeds: {
                colorPrimary: seed.colorPrimary,
                colorBgBase: seed.colorBgBase,
                colorTextBase: seed.colorTextBase,
                fontSize: seed.fontSize,
                borderRadius: seed.borderRadius,
                sizeUnit: seed.sizeUnit,
              },
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
          // AI contract files live at the *project* root, not inside .anchor/.
          const projectRoot = path.basename(repoRoot) === ".anchor"
            ? path.dirname(repoRoot)
            : repoRoot;
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

            const { tokensPath } = getTokenPaths();
            const tokensMtime = fs.existsSync(tokensPath) ? fs.statSync(tokensPath).mtimeMs : 0;

            const status = items.map((item) => {
              const abs = path.join(projectRoot, item.path);
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
            const mcpPath = path.join(projectRoot, ".mcp.json");
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
            const { tokensPath } = getTokenPaths();
            const body = fs.readFileSync(tokensPath, "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end("not found");
          }
          return;
        }

        if (req.method === "POST" && url === "/api/apply-token-preset") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              const { tokensPath } = getTokenPaths();
              if (!isWriteAllowed(repoRoot, tokensPath)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "write path not in whitelist" }));
                return;
              }
              const payload = raw ? JSON.parse(raw) : {};
              const preset = String(payload.preset ?? "").trim();
              const patch = payload.tokenPatch ?? {};
              if (!preset || typeof patch !== "object" || Array.isArray(patch)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "preset and tokenPatch are required" }));
                return;
              }

              const doc = fs.existsSync(tokensPath)
                ? JSON.parse(fs.readFileSync(tokensPath, "utf8"))
                : { version: 2, seed: {}, seedDark: {}, customSeeds: {}, fixedAliases: {}, mapOverrides: { light: {}, dark: {} } };
              let mergedFields = 0;
              for (const section of ["seed", "seedDark", "customSeeds", "fixedAliases", "mapOverrides"]) {
                const incoming = patch[section];
                if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) continue;
                if (!doc[section] || typeof doc[section] !== "object" || Array.isArray(doc[section])) doc[section] = {};
                for (const [key, value] of Object.entries(incoming)) {
                  if (value && typeof value === "object" && !Array.isArray(value)) {
                    doc[section][key] = { ...(doc[section][key] ?? {}), ...value };
                  } else {
                    doc[section][key] = value;
                  }
                  mergedFields++;
                }
              }

              const style = writePresetStyleArtifacts(repoRoot, payload);
              writeFileWithFsync(tokensPath, JSON.stringify(doc, null, 2) + "\n");
              const sync = execSyncCaptured("npm run sync:anchor", {
                cwd: repoRoot,
                env: { ...process.env, ANCHOR_TOKEN_ROOT: consumerRootFor(repoRoot) },
              });
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  ok: true,
                  preset,
                  mergedFields,
                  fileWritten: true,
                  ...style,
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

        if (req.method === "POST" && url === "/api/save-design-tokens") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              const { tokensPath } = getTokenPaths();
              if (!isWriteAllowed(repoRoot, tokensPath)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "write path not in whitelist" }));
                return;
              }
              const payload = raw ? JSON.parse(raw) : {};
              const jsonText = payload.jsonText ?? "";
              JSON.parse(jsonText);
              const pretty = `${JSON.stringify(JSON.parse(jsonText), null, 2)}\n`;
              writeFileWithFsync(tokensPath, pretty);
              const sync = execSyncCaptured("npm run sync:tokens", {
                cwd: repoRoot,
                env: { ...process.env, ANCHOR_TOKEN_ROOT: consumerRootFor(repoRoot) },
              });
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
              const mutation = requireMutationConfirm(res, payload, "delete component");
              if (!mutation) return;

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
                const source = componentSourceInfo(repoRoot);
                const designImport = storyText.match(/from\s+["']@design\/([^"']+)["']/)
                  || storyText.match(/from\s+["']@\/components\/anchor-ui\/([^"']+)["']/)
                  || storyText.match(/from\s+["']@\/components\/base\/([^"']+)["']/);
                if (designImport) {
                  const compRel = designImport[1].replace(/\.tsx(?:\?raw)?$/, "").replace(/\?raw$/, "");
                  for (const ext of [".tsx", ".ts"]) {
                    const candidate = path.join(source.dir, compRel + ext);
                    if (fs.existsSync(candidate)) {
                      componentFile = candidate;
                      break;
                    }
                  }
                }
                // Match legacy demos: import { X } from "./component-name";
                const importMatch = storyText.match(/from\s+["']\.\/([\w-]+)["']/);
                if (!componentFile && importMatch) {
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
                if (!isWriteAllowed(repoRoot, absStory)) {
                  res.statusCode = 403;
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify({ ok: false, error: "story path forbidden" }));
                  return;
                }
                if (!mutation.dryRun) fs.unlinkSync(absStory);
                deleted.push(path.relative(repoRoot, absStory).split(path.sep).join("/"));
              }

              // Delete component file
              if (componentFile && fs.existsSync(componentFile)) {
                if (!isWriteAllowed(repoRoot, componentFile)) {
                  res.statusCode = 403;
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify({ ok: false, error: "component path forbidden" }));
                  return;
                }
                if (!mutation.dryRun) fs.unlinkSync(componentFile);
                const source = componentSourceInfo(repoRoot);
                deleted.push(path.relative(source.root, componentFile).split(path.sep).join("/"));
              }

              // Delete spec.json if exists
              if (componentFile) {
                const compId = path.basename(componentFile, path.extname(componentFile)).toLowerCase();
                const specPath = path.join(specDir, `${compId}.spec.json`);
                if (fs.existsSync(specPath)) {
                  if (!isWriteAllowed(repoRoot, specPath)) {
                    res.statusCode = 403;
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify({ ok: false, error: "spec path forbidden" }));
                    return;
                  }
                  if (!mutation.dryRun) fs.unlinkSync(specPath);
                  deleted.push(path.relative(repoRoot, specPath));
                }
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: true, dryRun: mutation.dryRun, deleted }));
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
              const mutation = requireMutationConfirm(res, {
                confirm: parsedUrl.searchParams.get("confirm") === "true" || req.headers["x-anchor-confirm"] === "true",
                dryRun: parsedUrl.searchParams.get("dryRun") === "true",
              }, "upload component");
              if (!mutation) return;

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
              const source = componentSourceInfo(repoRoot);
              const baseDir = source.dir;
              if (!mutation.dryRun && !fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

              const compPath = path.join(baseDir, filename);
              if (!isWriteAllowed(repoRoot, compPath)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "forbidden" }));
                return;
              }

              if (!mutation.dryRun) {
                writeFileWithFsync(compPath, rewriteImportedComponentSource(Buffer.from(content, "binary").toString("utf8")));
              }

              const pascal = compName.replace(/(^|-)(\w)/g, (_, _2, c) => c.toUpperCase());
              const demo = demoSourceInfo(repoRoot);
              const demoPath = path.join(demo.dir, pascal + ".demo.tsx");
              if (!fs.existsSync(demoPath)) {
                const demo = [
                  `import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";`,
                  `import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";`,
                  `import { autoClassControls } from "@/design-tokens/tw-class-audit";`,
                  `import componentSrc from "${demoRawSpecifier(filename)}";`,
                  `import { ${pascal} } from "${demoComponentSpecifier(filename)}";`,
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
                if (!mutation.dryRun) {
                  fs.mkdirSync(path.dirname(demoPath), { recursive: true });
                  writeFileWithFsync(demoPath, demo);
                }
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                ok: true,
                dryRun: mutation.dryRun,
                component: path.relative(source.root, compPath).split(path.sep).join("/"),
                demo: path.relative(repoRoot, demoPath).split(path.sep).join("/"),
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
        // For a React + Tailwind .tsx file: copies it into
        // src/components/anchor-ui/ and auto-generates a Portal *.demo.tsx if missing.
        // For a folder: imports compatible scanned .tsx files (skipping
        // *.demo.tsx and *.stories.tsx).
        if (req.method === "POST" && url === "/api/import-component-path") {
          const chunks = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            try {
              const raw = Buffer.concat(chunks).toString("utf8");
              const body = raw ? JSON.parse(raw) : {};
              const mutation = requireMutationConfirm(res, body, "import component path");
              if (!mutation) return;
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
                  const stack = inspectReactTailwindComponent(selectedPath);
                  if (!stack.ok) {
                    skipped.push({
                      file: entry,
                      error: `not a supported React + Tailwind component (${stack.reasons.join("; ")})`,
                    });
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
                const stack = inspectReactTailwindComponent(sourcePath);
                if (!stack.ok) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({
                    ok: false,
                    error: "File must be a React + Tailwind .tsx component",
                    reasons: stack.reasons,
                  }));
                  return;
                }
                filesToImport.push(sourcePath);
              } else {
                for (const candidate of collectImportableComponentFiles(sourcePath, { recursive: body?.recursive === true })) {
                  const stack = inspectReactTailwindComponent(candidate);
                  if (!stack.ok) {
                    skipped.push({
                      file: componentReportName(sourcePath, candidate),
                      error: `not a supported React + Tailwind component (${stack.reasons.join("; ")})`,
                    });
                    continue;
                  }
                  filesToImport.push(candidate);
                }
              }
              if (filesToImport.length === 0) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "No importable .tsx files found", errors: skipped }));
                return;
              }

              const source = componentSourceInfo(repoRoot);
              const baseDir = source.dir;
              if (!mutation.dryRun && !fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

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
                  const content = rewriteImportedComponentSource(fs.readFileSync(src, "utf8"));
                  if (!mutation.dryRun) {
                    fs.mkdirSync(path.dirname(dest), { recursive: true });
                    writeFileWithFsync(dest, content);
                  }

                  const pascal = compName.replace(/(^|-)(\w)/g, (_, _2, c) => c.toUpperCase());
                  const demoRoot = demoSourceInfo(repoRoot);
                  const demoPath = path.join(demoRoot.dir, path.dirname(sourceRel), pascal + ".demo.tsx");
                  if (!fs.existsSync(demoPath)) {
                    const demo = [
                      `import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";`,
                      `import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";`,
                      `import { autoClassControls } from "@/design-tokens/tw-class-audit";`,
                      `import componentSrc from "${demoRawSpecifier(sourceRel)}";`,
                      `import { ${pascal} } from "${demoComponentSpecifier(sourceRel)}";`,
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
                    if (!mutation.dryRun) {
                      fs.mkdirSync(path.dirname(demoPath), { recursive: true });
                      writeFileWithFsync(demoPath, demo);
                    }
                  }
                  imported.push(path.relative(source.root, dest).split(path.sep).join("/"));
                } catch (e) {
                  errors.push({ file: path.basename(src), error: String(e) });
                }
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({
                ok: imported.length > 0,
                dryRun: mutation.dryRun,
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
