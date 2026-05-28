#!/usr/bin/env node
import { dirname, resolve, join, relative, sep } from "node:path";
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createConnection } from "node:net";
import { createHash } from "node:crypto";
import { applyTokenExtraction } from "../scripts/lib/screenshot-to-tokens.mjs";
import { projectTokenPaths, resolveTokenPaths, TOKEN_REL } from "../scripts/lib/token-source.mjs";

/* ─── ANSI constants used by doScreenshot — defined at top to avoid TDZ
 *     since the top-level switch dispatches calls before later const blocks
 *     are initialized. ─── */
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  yellow: "\x1b[33m",
};

const SCREENSHOT_PROMPT = `Analyze the attached screenshot and update Design-anchor design tokens.

The MCP server (in this project's .mcp.json) exposes:
  list_tokens          — view current seed values
  update_token         — { id, field: "light" | "dark", value } writes to tokens.json
  run_sync_rules       — regenerate generated CSS after edits

Identify the *semantic role* of what you see, not every color present. Only fill values you can identify with high confidence (≥ 70%). For each, call \`update_token\` with the seed id below.

  colorPrimary    Brand / primary CTA color (main button fill, key brand accent — NOT body text or background).
  colorBgBase     Page canvas — the dominant background.
  colorTextBase   Body text — dominant paragraph / label color.
  colorSuccess    Success feedback (green checks, success toast). Skip if not visible.
  colorWarning    Warnings (amber / yellow). Skip if not visible.
  colorError      Error / destructive (red). Skip if not visible.
  colorInfo       Info / link accent (usually blue / indigo). Skip if not visible.
  borderRadius    Most common corner radius in px (median across cards / buttons).
  fontSize        Body text size in px (paragraph / label, NOT headings).
  sizeUnit        Base spacing unit. 3 = compact, 4 = default, 5 = spacious. Read padding / gap rhythm.

Rules:
  1. Only update a token when confident. Skip ambiguous ones.
  2. Colors are #RRGGBB hex. borderRadius / fontSize / sizeUnit are plain integers.
  3. After all updates, call run_sync_rules.
  4. Print a one-line summary of what changed and what was skipped.`;

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");

const [, , cmd, ...rest] = process.argv;

/** 消费者项目中的 Anchor 控制面根目录：Portal / schema / sync / governance。 */
const DEFAULT_ANCHOR_DIR = ".anchor";
/** 消费者项目中的组件源码根目录：业务代码可见、可提交、可继续维护。 */
const DEFAULT_COMPONENTS_REL = "src/components/anchor-ui";
const TEMPLATE_COMPONENTS_REL = "src/components/base";
const DEMO_COMPONENTS_REL = "src/anchor/component-demos/base";
const COMPONENT_IMPORT_BASE = "@/components/anchor-ui";

const PORTAL_PATH = "/#/_designtoken";
const DEFAULT_PORT = 6006;
const PORTAL_ROUTE_MAP = {
  token: "/#/theme",
  tokens: "/#/theme",
  theme: "/#/theme",
  themeEditor: "/#/theme",
  themeeditor: "/#/theme",
  "theme-editor": "/#/theme",
  theme_editor: "/#/theme",
  designToken: "/#/theme",
  designtoken: "/#/theme",
  component: "/#/library",
  components: "/#/library",
  library: "/#/library",
  spec: "/#/library",
  specs: "/#/library",
  schema: "/#/library",
  govern: "/#/theme",
  governance: "/#/theme",
  health: "/#/theme",
  audit: "/#/theme",
  docs: "/#/docs",
  document: "/#/docs",
  documents: "/#/docs",
  preset: "/#/onboarding",
  presets: "/#/onboarding",
  onboarding: "/#/onboarding",
};

const MANIFEST_FILE = ".design-kit-manifest.json";
const KIT_STATUS_FILE = ".anchor-portal/kit-status.json";

/**
 * Reference Policy — 决定「被引用」的含义与侧栏圆点语义。
 *
 * 引用扫描范围：
 *   scan:    **\/*.{ts,tsx,js,jsx}
 *   exclude: **\/*.demo.*, **\/*.stories.*, node_modules/**
 *   即：仅生产/业务代码的 import 算「被引用」；demo / stories 内的引用不算。
 *
 * 圆点语义（侧栏组件行右侧）：
 *   蓝色 #3b82f6  = NEW     该组件由本次 kit sync/upgrade 新增
 *   琥珀 #f59e0b  = MODIFIED 用户已在本地修改过（hash 与 kit 基准不同）
 *   无圆点        = UNCHANGED 与 kit 基准一致，或非 kit 管理文件
 *
 * 升级策略（anchor upgrade）：
 *   1. 新增路径（kit 有、本地无） → 直接拷贝
 *   2. 未修改路径（本地 hash = kitHash）→ 覆盖为新版
 *   3. 已修改路径（本地 hash ≠ kitHash）→ 跳过，打印日志
 */
const REFERENCE_POLICY = {
  scanGlobs: ["**/*.{ts,tsx,js,jsx}"],
  excludeGlobs: ["**/*.demo.*", "**/*.stories.*", "node_modules/**"],
  dotColors: {
    new: "#3b82f6",
    modified: "#f59e0b",
  },
};

const HELP = `
anchor — AI coding governance CLI

说明:
  默认在**当前项目根**下创建隐藏目录 ${DEFAULT_ANCHOR_DIR}/（Anchor Portal / schema / sync 控制面），
  并把组件源码安装到 ${DEFAULT_COMPONENTS_REL}/。业务代码可直接从 @design 或 @/components/anchor-ui 引用组件。
  ${DEFAULT_ANCHOR_DIR}/ 不再作为组件实现真源，只负责 Design-anchor 产品能力与 AI 治理文件。

用法:
  anchor start [目标目录]    一键启动（init + install + 打开 Portal）— 设计师推荐
  anchor init  [目标目录]    初始化组件库（默认 ./${DEFAULT_ANCHOR_DIR}）
  anchor govern              治理模式：仅注入 AI 规则文件，不拷贝组件/CSS（适合已有项目）
  anchor theme  <文件>       从 Design Prompt 提取 Token，写入 tokens.json 并生成主题规则
  anchor screenshot [图片]   打印一段 prompt + 操作引导，让你的 AI 工具读图并通过 MCP 改 tokens.json
  anchor upgrade [目标目录]  升级 kit：新增组件直接加入、未修改覆盖、已修改跳过
  anchor dev   [目标目录]    启动 Anchor Portal（Vite）并打开浏览器
  anchor portal [tab] [目录] 打开指定 Portal tab：tokens/theme/theme-editor/components/specs/docs
  anchor mcp   [目标目录]    启动 MCP Server（供 Cursor Agent 使用）
  anchor sync  [目标目录]    同步 schema → Tailwind + .cursorrules + 规则镜像
  anchor audit [目标目录]    运行合规审计（可加 --fix；写入前会确认，脚本化使用 --yes）
  anchor help                显示帮助
`.trim();

switch (cmd) {
  case "start":
    doStart(rest[0]);
    break;
  case "init":
    doInit(rest[0]);
    break;
  case "govern":
    doGovern();
    break;
  case "theme":
    doTheme(rest[0]);
    break;
  case "screenshot":
    doScreenshot(rest[0]);
    break;
  case "upgrade":
    doUpgrade(rest[0]);
    break;
  case "dev":
    doDev(rest[0], rest[1]);
    break;
  case "portal":
  case "open":
    doPortal(rest);
    break;
  case "mcp":
    doMcp(rest[0]);
    break;
  case "sync":
    doSync(rest[0]);
    break;
  case "audit":
    doAudit(rest);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`未知命令: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
}

/* ─── manifest helpers ─── */

function fileHash(absPath) {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex").slice(0, 16);
}

function contentHash(data) {
  return createHash("sha256").update(data).digest("hex").slice(0, 16);
}

function normalizeRel(p) {
  return p.split(sep).join("/");
}

function isDemoLike(rel) {
  const name = rel.split("/").pop() || "";
  return name.includes(".demo.") || name.includes(".stories.") || name === "_story-runtime.tsx";
}

function rewriteComponentSource(text) {
  return text
    .replaceAll("@/components/base", COMPONENT_IMPORT_BASE)
    .replaceAll("src/components/base", DEFAULT_COMPONENTS_REL);
}

function rewriteDemoSource(text, demoRel) {
  const demoDir = normalizeRel(dirname(demoRel));
  const componentPrefix = demoDir === "." ? "@design" : `@design/${demoDir}`;
  return text
    .replace(/(from\s+["'])\.\/([^"']+)(["'])/g, (_match, open, spec, close) => {
      if (spec.startsWith("_")) return `${open}./${spec}${close}`;
      return `${open}${componentPrefix}/${spec}${close}`;
    })
    .replace(/(import\s+[^"']+\s+from\s+["'])\.\/([^"']+)(["'])/g, (_match, open, spec, close) => {
      if (spec.startsWith("_")) return `${open}./${spec}${close}`;
      return `${open}${componentPrefix}/${spec}${close}`;
    });
}

function rewriteAnchorSchemaSource(text) {
  return rewriteComponentSource(text);
}

function managedFileContent(entry) {
  const data = readFileSync(entry.src);
  if (!entry.transform) return data;
  const text = data.toString("utf8");
  if (entry.transform === "component") return rewriteComponentSource(text);
  if (entry.transform === "demo") return rewriteDemoSource(text, entry.demoRel || "");
  if (entry.transform === "schema") return rewriteAnchorSchemaSource(text);
  return text;
}

function writeManagedFile(entry) {
  mkdirSync(dirname(entry.dst), { recursive: true });
  writeFileSync(entry.dst, managedFileContent(entry));
}

/** Files the kit manages across .anchor control plane and visible component source. */
function collectKitFiles(anchorRoot, projectRoot = resolve(anchorRoot, "..")) {
  const entries = [];

  function addFiles(srcRoot, dstRoot, keyRoot, transform = null) {
    if (!existsSync(srcRoot)) return;
    walkDir(srcRoot, (filePath) => {
      const rel = normalizeRel(relative(srcRoot, filePath));
      if (transform === "component" && isDemoLike(rel)) return;
      entries.push({
        key: normalizeRel(join(keyRoot, rel)),
        src: filePath,
        dst: join(dstRoot, rel),
        transform,
        demoRel: transform === "demo" ? rel : undefined,
      });
    });
  }

  function addControl(rel, transform = null) {
    const src = join(PKG_ROOT, rel);
    const dst = join(anchorRoot, rel);
    if (!existsSync(src)) return;
    const stat = statSync(src);
    if (stat.isDirectory()) addFiles(src, dst, rel, transform);
    else entries.push({ key: rel, src, dst, transform });
  }

  for (const rel of [
    "src/design-tokens",
    "src/styles",
    "src/anchor-portal",
    "vite-plugin-schema-api.mjs",
    "anchor-vite.d.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "tailwind.anchor.generated.ts",
    "scripts",
  ]) {
    addControl(rel);
  }
  addControl("src/anchor", "schema");

  addFiles(
    join(PKG_ROOT, TEMPLATE_COMPONENTS_REL),
    join(projectRoot, DEFAULT_COMPONENTS_REL),
    `../${DEFAULT_COMPONENTS_REL}`,
    "component",
  );
  addFiles(join(PKG_ROOT, "src/lib"), join(projectRoot, "src/lib"), "../src/lib");
  addFiles(join(PKG_ROOT, "src/hooks"), join(projectRoot, "src/hooks"), "../src/hooks");

  const demoSrcRoot = join(PKG_ROOT, TEMPLATE_COMPONENTS_REL);
  if (existsSync(demoSrcRoot)) {
    walkDir(demoSrcRoot, (filePath) => {
      const rel = normalizeRel(relative(demoSrcRoot, filePath));
      if (!isDemoLike(rel)) return;
      entries.push({
        key: normalizeRel(join(DEMO_COMPONENTS_REL, rel)),
        src: filePath,
        dst: join(anchorRoot, DEMO_COMPONENTS_REL, rel),
        transform: rel.endsWith(".demo.tsx") ? "demo" : null,
        demoRel: rel,
      });
    });
  }

  return entries;
}

function copyComponentTree(sourceDir, destDir) {
  if (!existsSync(sourceDir)) return 0;
  let count = 0;
  walkDir(sourceDir, (filePath) => {
    const rel = normalizeRel(relative(sourceDir, filePath));
    if (isDemoLike(rel)) return;
    const dst = join(destDir, rel);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, rewriteComponentSource(readFileSync(filePath, "utf8")));
    count++;
  });
  return count;
}

function copySupportDirIfMissing(sourceDir, destDir) {
  if (!existsSync(sourceDir)) return 0;
  let count = 0;
  walkDir(sourceDir, (filePath) => {
    const rel = normalizeRel(relative(sourceDir, filePath));
    const dst = join(destDir, rel);
    if (existsSync(dst)) return;
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(filePath, dst);
    count++;
  });
  return count;
}

function ensureProjectComponentSource(projectRoot, anchorRoot) {
  const dest = join(projectRoot, DEFAULT_COMPONENTS_REL);
  if (existsSync(dest) && readdirSyncSafe(dest).length > 0) {
    return { created: false, dest, count: 0 };
  }
  const source = existsSync(join(anchorRoot, TEMPLATE_COMPONENTS_REL))
    ? join(anchorRoot, TEMPLATE_COMPONENTS_REL)
    : join(PKG_ROOT, TEMPLATE_COMPONENTS_REL);
  const count = copyComponentTree(source, dest);
  if (count > 0) {
    console.log(`  ✅ ${DEFAULT_COMPONENTS_REL} — 已安装组件源码（${count} files）`);
  }
  return { created: count > 0, dest, count };
}

function ensureProjectSupportSource(projectRoot) {
  const copiedLib = copySupportDirIfMissing(join(PKG_ROOT, "src/lib"), join(projectRoot, "src/lib"));
  const copiedHooks = copySupportDirIfMissing(join(PKG_ROOT, "src/hooks"), join(projectRoot, "src/hooks"));
  if (copiedLib || copiedHooks) {
    console.log(`  ✅ src/lib + src/hooks — 已补齐组件运行支持文件（${copiedLib + copiedHooks} files）`);
  }
}

function writeAnchorTsconfig(target) {
  const tsconfigPath = join(target, "tsconfig.json");
  if (!existsSync(tsconfigPath)) return;
  try {
    const json = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    json.compilerOptions = json.compilerOptions || {};
    json.compilerOptions.baseUrl = json.compilerOptions.baseUrl || ".";
    json.compilerOptions.paths = {
      ...(json.compilerOptions.paths || {}),
      "@design": [`../${DEFAULT_COMPONENTS_REL}/index.ts`],
      "@design/*": [`../${DEFAULT_COMPONENTS_REL}/*`],
      "@/components/base": [`../${DEFAULT_COMPONENTS_REL}/index.ts`],
      "@/components/base/*": [`../${DEFAULT_COMPONENTS_REL}/*`],
      "@/components/anchor-ui": [`../${DEFAULT_COMPONENTS_REL}/index.ts`],
      "@/components/anchor-ui/*": [`../${DEFAULT_COMPONENTS_REL}/*`],
      "@/lib/*": ["../src/lib/*"],
      "@/hooks/*": ["../src/hooks/*"],
      react: ["../node_modules/@types/react"],
      "react/*": ["../node_modules/@types/react/*"],
      "react-dom": ["../node_modules/@types/react-dom"],
      "react-dom/*": ["../node_modules/@types/react-dom/*"],
    };
    writeFileSync(tsconfigPath, JSON.stringify(json, null, 2) + "\n");
    console.log("  ✅ tsconfig.json（Portal aliases → project components）");
  } catch {
    // Keep the copied tsconfig if parsing fails; TypeScript will report details.
  }
}

function walkDir(dir, cb) {
  for (const ent of readdirSyncSafe(dir)) {
    const p = join(dir, ent);
    try {
      const st = statSync(p);
      if (st.isDirectory()) walkDir(p, cb);
      else cb(p);
    } catch { /* skip unreadable */ }
  }
}

function readManifest(target) {
  const p = join(target, MANIFEST_FILE);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

function writeManifest(target, manifest) {
  writeFileSync(join(target, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + "\n");
}

function buildManifest(target, kitVersion) {
  const files = {};
  const projectRoot = resolve(target, "..");
  const kitFiles = collectKitFiles(target, projectRoot);
  for (const entry of kitFiles) {
    if (!existsSync(entry.dst)) continue;
    files[entry.key] = { kitHash: contentHash(managedFileContent(entry)), status: "unchanged" };
  }
  return {
    kitPackage: "design-anchor",
    kitVersion,
    syncedAt: new Date().toISOString(),
    referencePolicy: REFERENCE_POLICY,
    files,
  };
}

/**
 * Derive component-level status from file-level manifest for the Portal sidebar.
 * Maps component display names to { status: "new" | "modified" | "unchanged" }.
 */
function buildKitStatus(manifest) {
  const components = {};
  for (const [rel, info] of Object.entries(manifest.files ?? {})) {
    const m = rel.match(/^(?:\.\.\/)?src\/components\/(?:anchor-ui|base)\/(.+)\.tsx$/);
    if (!m) continue;
    const fileName = m[1].split("/").pop() || m[1];
    if (fileName.includes(".demo") || fileName.includes(".stories")) continue;
    const name = fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const prev = components[name];
    if (!prev || statusPriority(info.status) > statusPriority(prev.status)) {
      components[name] = { status: info.status, file: rel };
    }
  }
  return {
    kitVersion: manifest.kitVersion,
    syncedAt: manifest.syncedAt,
    dotColors: REFERENCE_POLICY.dotColors,
    components,
  };
}

function statusPriority(s) {
  return s === "new" ? 2 : s === "modified" ? 1 : 0;
}

function writeKitStatus(target, manifest) {
  const status = buildKitStatus(manifest);
  const dir = join(target, ".anchor-portal");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(target, KIT_STATUS_FILE), JSON.stringify(status, null, 2) + "\n");
}

/* ─── init ─── */

function ensureProjectTokenSource(projectRoot, anchorRoot) {
  const projectTokens = projectTokenPaths(anchorRoot);
  if (existsSync(projectTokens.tokensPath)) {
    return { created: false, ...projectTokens };
  }

  const candidates = [
    { label: ".harness", path: join(projectRoot, ".harness", TOKEN_REL) },
    { label: ".anchor template", path: join(anchorRoot, TOKEN_REL) },
    { label: "package template", path: join(PKG_ROOT, TOKEN_REL) },
  ];
  const source = candidates.find((candidate) => existsSync(candidate.path));
  if (!source) return { created: false, ...projectTokens };

  mkdirSync(join(projectTokens.tokensPath, ".."), { recursive: true });
  cpSync(source.path, projectTokens.tokensPath);
  console.log(`  ✅ ${relative(projectRoot, projectTokens.tokensPath)} — 已建立项目 token 真源（from ${source.label}）`);
  return { created: true, source: source.label, ...projectTokens };
}

function ensureProjectTokenCss(projectRoot, anchorRoot) {
  const paths = projectTokenPaths(anchorRoot);
  if (!existsSync(paths.tokensPath)) return false;
  if (existsSync(paths.cssPath)) {
    try {
      if (statSync(paths.cssPath).mtimeMs >= statSync(paths.tokensPath).mtimeMs) return true;
    } catch {
      return true;
    }
  }
  const canUseLocalRuntime = existsSync(join(anchorRoot, "node_modules"));
  const emitScript = canUseLocalRuntime && existsSync(join(anchorRoot, "scripts/emit-design-tokens-css.mjs"))
    ? join(anchorRoot, "scripts/emit-design-tokens-css.mjs")
    : join(PKG_ROOT, "scripts/emit-design-tokens-css.mjs");
  execSync(`node "${emitScript}"`, {
    cwd: anchorRoot,
    stdio: "inherit",
    env: { ...process.env, ANCHOR_TOKEN_ROOT: projectRoot },
  });
  return true;
}

function doInit(targetArg) {
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);
  const projectRoot = resolve(target, "..");
  console.log(`\n📦 初始化 Design-anchor 控制面到 ${target}\n`);

  if (existsSync(join(target, "package.json"))) {
    console.log("⚠️  目标目录已存在 package.json，跳过控制面 scaffold（补齐可见组件目录与规则）");
    ensureProjectComponentSource(projectRoot, target);
    ensureProjectSupportSource(projectRoot);
    writeAnchorTsconfig(target);
    ensureProjectTokenSource(projectRoot, target);
    ensureProjectTokenCss(projectRoot, target);
    patchGlobalsCss(projectRoot, target);
    writeAnchorConsumerDocs(projectRoot, target);
    generateCursorRule(projectRoot, target);
    return;
  }

  mkdirSync(target, { recursive: true });

  const managedFiles = collectKitFiles(target, projectRoot);
  const copiedGroups = new Set();
  for (const entry of managedFiles) {
    if (entry.key.startsWith("../") && existsSync(entry.dst)) continue;
    writeManagedFile(entry);
    const group = entry.key.startsWith("../")
      ? entry.key.split("/").slice(0, 3).join("/")
      : entry.key.split("/").slice(0, 2).join("/");
    if (!copiedGroups.has(group)) {
      copiedGroups.add(group);
      console.log(`  ✅ ${group}`);
    }
  }
  writeAnchorTsconfig(target);

  // 生成 package.json（react / react-dom 用 peer + dev，减轻与业务项目双 React 冲突）
  const parentPkg = readPkgJson(PKG_ROOT);
  const { dependencies, peerDependencies, devDependencies } = buildScaffoldPackageJson(parentPkg);
  const pkg = {
    name: "anchor-local",
    version: "0.1.0",
    private: true,
    type: "module",
    main: "index.ts",
    scripts: {
      "sync:tokens": parentPkg.scripts?.["sync:tokens"] || "node scripts/emit-design-tokens-css.mjs",
      "sync:anchor": parentPkg.scripts?.["sync:anchor"] || "npm run sync:tokens && node scripts/sync-from-schema.mjs",
      "anchor:audit": parentPkg.scripts?.["anchor:audit"] || "node scripts/anchor-audit.mjs",
      "anchor:audit:app": parentPkg.scripts?.["anchor:audit:app"] || "node scripts/anchor-audit.mjs --scope app",
      "anchor:audit:kit": parentPkg.scripts?.["anchor:audit:kit"] || "node scripts/anchor-audit.mjs --scope kit",
      "anchor:audit:portal": parentPkg.scripts?.["anchor:audit:portal"] || "node scripts/anchor-audit.mjs --scope portal",
      "anchor:audit:all": parentPkg.scripts?.["anchor:audit:all"] || "node scripts/anchor-audit.mjs --scope all",
      "anchor:audit:fix": parentPkg.scripts?.["anchor:audit:fix"] || "node scripts/anchor-audit.mjs --scope all --fix",
      "check:tokens": parentPkg.scripts?.["check:tokens"] || "node scripts/check-token-contract.mjs",
      "check:anchor": parentPkg.scripts?.["check:anchor"] || "node scripts/check-anchor-consistency.mjs && npm run check:tokens",
      dev: "vite --config src/anchor-portal/vite.config.ts",
      build: "vite build --config src/anchor-portal/vite.config.ts",
      typecheck: "tsc --noEmit",
    },
    dependencies,
    peerDependencies,
    devDependencies,
  };
  if (!Object.keys(pkg.peerDependencies).length) delete pkg.peerDependencies;
  writeFileSync(join(target, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  console.log("  ✅ package.json");

  // 生成组件入口 index.ts
  generateIndex(target);

  // 生成 manifest + kit status（供 upgrade 和侧栏圆点使用）
  const kitVersion = parentPkg.version || "0.0.0";
  const manifest = buildManifest(target, kitVersion);
  writeManifest(target, manifest);
  writeKitStatus(target, manifest);
  console.log("  ✅ .design-kit-manifest.json + .anchor-portal/kit-status.json");

  // 生成 AI 集成文件（写到用户项目根目录）
  ensureProjectTokenSource(projectRoot, target);
  ensureProjectTokenCss(projectRoot, target);
  generateCursorRule(projectRoot, target);          // Cursor → .cursor/rules/anchor.mdc
  generateClaudeMd(projectRoot, target);            // Claude Code / Desktop → CLAUDE.md
  generateCopilotInstructions(projectRoot, target); // Copilot Chat → .github/copilot-instructions.md
  generateCursorMcp(projectRoot, target);           // Cursor MCP → .cursor/mcp.json
  generateRootMcp(projectRoot, target);             // Claude Code / Cline / Zed MCP → .mcp.json
  generateAgentsMd(projectRoot, target);
  installCursorHooks(projectRoot);
  installSelfcheckRule(projectRoot);
  writeAnchorConsumerDocs(projectRoot, target);
  patchGlobalsCss(projectRoot, target);
  injectDepsToProject(projectRoot, parentPkg);

  console.log("\n📦 scaffold 完成！\n");
  console.log("后续步骤：");
  console.log("  npm install                    # 安装业务项目依赖（组件源码从项目根解析依赖）");
  console.log("  cd .anchor && npm install       # 安装 Portal 工具链（或直接用 npx design-anchor start）");
  console.log("  npx design-anchor dev");
  console.log("");
  console.log("🤖 AI 集成已自动配置：");
  console.log("  • CLAUDE.md                          — Claude Code / Claude Desktop");
  console.log("  • .cursor/rules/anchor.mdc           — Cursor（alwaysApply）");
  console.log("  • .cursor/rules/anchor-selfcheck.mdc — 改完代码后的自检清单");
  console.log("  • .github/copilot-instructions.md    — GitHub Copilot Chat");
  console.log("  • AGENTS.md                          — 通用 AI 边界与契约");
  console.log("  • .mcp.json                          — Claude Code / Cline / Zed MCP");
  console.log("  • .cursor/mcp.json                   — Cursor MCP");
  console.log("  • .cursor/hooks.json                 — 保存 .tsx 后自动跑 anchor audit");
  console.log("  • ANCHOR_BOUNDARIES.md               — Directory boundary guide");
  console.log("  • ANCHOR_INTEGRATION.md              — @design 别名与 Vite 示例");
  console.log("  重新打开 IDE 后规则生效。\n");
}

/**
 * 脚手架 package.json：.anchor 只安装 Portal 工具链，运行时依赖装在业务项目根。
 *
 * 组件源码现在位于 ../src/components/anchor-ui。TypeScript / Vite 会从组件文件
 * 所在的业务项目根解析 React、Radix、lucide 等运行时依赖；如果把这些依赖也装进
 * .anchor/node_modules，容易形成两套 React / @types/react。
 */
function buildScaffoldPackageJson(parentPkg) {
  const excludedDevDeps = new Set(["react", "react-dom", "@types/react", "@types/react-dom"]);
  const devDeps = {};
  for (const [name, version] of Object.entries(parentPkg.devDependencies || {})) {
    if (!excludedDevDeps.has(name)) devDeps[name] = version;
  }
  return {
    dependencies: {},
    peerDependencies: {},
    devDependencies: devDeps,
  };
}

/** 自动 patch 消费端 globals.css：智能合并 anchor tokens，保留用户自定义样式 */
/** 将 .anchor 的运行时依赖注入到用户项目的 package.json，避免 .anchor 有独立 node_modules */
function injectDepsToProject(projectRoot, parentPkg) {
  const projectPkgPath = join(projectRoot, "package.json");
  if (!existsSync(projectPkgPath)) return { runtime: 0, dev: 0 };

  const projectPkg = JSON.parse(readFileSync(projectPkgPath, "utf8"));
  const projectDeps = projectPkg.dependencies || {};
  const projectDevDeps = projectPkg.devDependencies || {};
  const anchorDeps = { ...(parentPkg.peerDependencies || {}), ...(parentPkg.dependencies || {}) };

  let added = 0;
  for (const [name, version] of Object.entries(anchorDeps)) {
    if (!hasProjectDependency(projectPkg, name)) {
      projectDeps[name] = version;
      added++;
    }
  }

  let addedDev = 0;
  for (const name of ["@types/react", "@types/react-dom"]) {
    const version = parentPkg.devDependencies?.[name];
    if (version && !hasProjectDependency(projectPkg, name)) {
      projectDevDeps[name] = version;
      addedDev++;
    }
  }

  if (added > 0 || addedDev > 0) {
    projectPkg.dependencies = Object.fromEntries(
      Object.entries(projectDeps).sort(([a], [b]) => a.localeCompare(b))
    );
    if (Object.keys(projectDevDeps).length) {
      projectPkg.devDependencies = Object.fromEntries(
        Object.entries(projectDevDeps).sort(([a], [b]) => a.localeCompare(b))
      );
    }
    writeFileSync(projectPkgPath, JSON.stringify(projectPkg, null, 2) + "\n");
    console.log(`  ✅ package.json — 注入 ${added} 个组件库依赖、${addedDev} 个类型依赖（运行 npm install 生效）`);
  }
  return { runtime: added, dev: addedDev };
}

function hasProjectDependency(pkg, name) {
  return Boolean(
    pkg.dependencies?.[name]
    || pkg.devDependencies?.[name]
    || pkg.peerDependencies?.[name]
    || pkg.optionalDependencies?.[name]
  );
}

function nodeModulePath(root, name) {
  return join(root, "node_modules", ...name.split("/"));
}

function requiredProjectDependencies(parentPkg) {
  return {
    ...(parentPkg.peerDependencies || {}),
    ...(parentPkg.dependencies || {}),
    "@types/react": parentPkg.devDependencies?.["@types/react"],
    "@types/react-dom": parentPkg.devDependencies?.["@types/react-dom"],
  };
}

function missingProjectDependencies(projectRoot, parentPkg) {
  const projectPkgPath = join(projectRoot, "package.json");
  if (!existsSync(projectPkgPath)) return [];
  const required = requiredProjectDependencies(parentPkg);
  return Object.keys(required).filter((name) => required[name] && !existsSync(nodeModulePath(projectRoot, name)));
}

function installProjectDependenciesIfNeeded(projectRoot, parentPkg) {
  if (!existsSync(join(projectRoot, "package.json"))) return;
  const missing = missingProjectDependencies(projectRoot, parentPkg);
  if (!missing.length) return;
  console.log(`\n  📥 安装业务项目依赖（组件源码位于 ${DEFAULT_COMPONENTS_REL}，需要从项目根解析依赖）…\n`);
  try {
    execSync("npm install --loglevel=error", { cwd: projectRoot, stdio: "inherit" });
  } catch {
    console.error("❌ 业务项目依赖安装失败");
    process.exit(1);
  }
}

function assertProjectDependenciesInstalled(projectRoot, parentPkg) {
  const missing = missingProjectDependencies(projectRoot, parentPkg);
  if (!missing.length) return;
  const shown = missing.slice(0, 6).join(", ");
  const more = missing.length > 6 ? ` 等 ${missing.length} 个` : "";
  console.error(`❌ 业务项目依赖未安装：${shown}${more}`);
  console.error(`   组件源码在 ${join(projectRoot, DEFAULT_COMPONENTS_REL)}，请先在项目根执行: npm install`);
  console.error(`   或直接运行: npx design-anchor start`);
  process.exit(1);
}

function patchGlobalsCss(projectRoot, libTarget) {
  const candidates = [
    "src/app/globals.css",
    "app/globals.css",
    "src/globals.css",
    "styles/globals.css",
  ];
  let globalsCssPath = null;
  for (const c of candidates) {
    const p = join(projectRoot, c);
    if (existsSync(p)) { globalsCssPath = p; break; }
  }
  if (!globalsCssPath) return;

  const content = readFileSync(globalsCssPath, "utf8");
  const projectTokenCss = projectTokenPaths(libTarget).cssPath;
  const relLib = relative(join(globalsCssPath, ".."), projectTokenCss).split(sep).join("/");

  // anchor 接管的 CSS 变量名（会出现在 :root 或 @media dark 中）
  const anchorVars = new Set([
    "--background", "--foreground", "--card", "--card-foreground",
    "--popover", "--popover-foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
    "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring", "--radius",
    "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5",
    "--sidebar-background", "--sidebar-foreground", "--sidebar-primary",
    "--sidebar-primary-foreground", "--sidebar-accent", "--sidebar-accent-foreground",
    "--sidebar-border", "--sidebar-ring",
  ]);

  let css = content;

  // 1. 删除 @theme inline { ... } 块（anchor 通过 generated.css 提供 @theme）
  css = css.replace(/@theme\s+inline\s*\{[^}]*\}/gs, "");

  // 2. 从 :root { ... } 块中删除 anchor 接管的变量，保留用户自定义变量
  css = css.replace(/:root\s*\{([^}]*)\}/gs, (_match, body) => {
    const lines = body.split("\n").filter((line) => {
      const varMatch = line.match(/^\s*(--[\w-]+)\s*:/);
      if (!varMatch) return true;
      return !anchorVars.has(varMatch[1]);
    });
    const remaining = lines.filter((l) => l.trim()).join("\n");
    return remaining ? `:root {\n${remaining}\n}` : "";
  });

  // 3. 删除 prefers-color-scheme dark 中只包含 anchor 变量的 @media 块
  css = css.replace(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{[^}]*:root\s*\{([^}]*)\}[^}]*\}/gs, (_match, body) => {
    const lines = body.split("\n").filter((line) => {
      const varMatch = line.match(/^\s*(--[\w-]+)\s*:/);
      if (!varMatch) return true;
      return !anchorVars.has(varMatch[1]);
    });
    const remaining = lines.filter((l) => l.trim()).join("\n");
    return remaining ? `@media (prefers-color-scheme: dark) {\n  :root {\n${remaining}\n  }\n}` : "";
  });

  // 4. 清理空 @media 块和多余空行
  css = css.replace(/@media[^{]*\{\s*\}/gs, "");
  css = css.replace(/\n{3,}/g, "\n\n").trim();

  // 5. 确保 @import "tailwindcss" 存在
  if (!/@import\s+["']tailwindcss["']/.test(css)) {
    css = `@import "tailwindcss";\n${css}`;
  }

  // 6. 注入 anchor token import（紧跟 tailwindcss import 之后）
  const importLine = `@import "${relLib}";`;
  const existingTokenImport = /@import\s+["'][^"']*design-tokens\.generated\.css["'];?\s*/g;
  if (existingTokenImport.test(css)) {
    css = css.replace(existingTokenImport, `${importLine}\n`);
  } else {
    css = css.replace(/(@import\s+["']tailwindcss["'];?\s*\n?)/, `$1${importLine}\n`);
  }

  // 7. 确保有 @custom-variant dark
  if (!css.includes("@custom-variant dark")) {
    css = css.replace(/(design-tokens\.generated\.css["'];?\s*\n)/, `$1\n@custom-variant dark (&:is(.dark *));\n`);
  }

  // 8. 确保有 @layer base 中的 border-border + bg-background
  if (!css.includes("border-border")) {
    css += `\n\n@layer base {\n  * {\n    @apply border-border outline-ring/50;\n  }\n\n  body {\n    @apply bg-background text-foreground;\n  }\n}\n`;
  }

  writeFileSync(globalsCssPath, css + "\n");
  const relCss = relative(projectRoot, globalsCssPath);
  console.log(`  ✅ ${relCss} — 已智能合并 design-anchor tokens（用户自定义样式已保留）`);
}

/** 项目根：边界说明 + import 别名集成（立刻可做的「一页纸」） */
function writeAnchorConsumerDocs(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const relComponents = "./" + DEFAULT_COMPONENTS_REL;
  const boundariesSrc = join(PKG_ROOT, "docs", "BOUNDARIES.md");
  const boundariesDst = join(projectRoot, "ANCHOR_BOUNDARIES.md");
  if (existsSync(boundariesSrc)) {
    cpSync(boundariesSrc, boundariesDst);
    console.log("  ✅ ANCHOR_BOUNDARIES.md（项目根）");
  }

  const integration = `# Design-anchor Integration (import aliases)

组件源码路径：\`${relComponents}/\`。Anchor 控制面路径：\`${relLib}/\`（一般为 \`./.anchor/\`）。业务代码请放在项目自有的 \`src/\`，详见同目录 **ANCHOR_BOUNDARIES.md**。

## 推荐：TypeScript \`paths\` — \`@design\`

在**业务项目**的 \`tsconfig.json\` 的 \`compilerOptions.paths\` 中合并（路径按你仓库结构调整）：

\`\`\`json
{
  "compilerOptions": {
    "paths": {
      "@design": ["${relComponents}/index.ts"],
      "@design/*": ["${relComponents}/*"]
    }
  }
}
\`\`\`

业务中写法示例：

\`\`\`tsx
import { DataTable, Button } from "@design";
\`\`\`

> If your project already maps \`@\` to \`src/\`, do not reuse the same prefix for \`@design\`; keep \`@design\` pointing only to the Design-anchor barrel.

## Vite / Rspack 等：\`resolve.alias\`

\`\`\`ts
import path from "node:path";
// vite.config.ts
export default {
  resolve: {
    // 防止 workspace 里出现第二份 React。
    dedupe: ["react", "react-dom"],
    alias: {
      "@design": path.resolve(__dirname, "${relComponents}/index.ts"),
    },
  },
};
\`\`\`

## 无别名时

使用相对路径，例如从 \`src/pages/Foo.tsx\` 导入：

\`\`\`tsx
import { Button } from "../components/anchor-ui";
\`\`\`

（具体相对路径以文件位置为准。）

---
*由 \`anchor init\` 生成；修改别名后无需改本文件，以业务侧 tsconfig / Vite 为准。*
`;
  writeFileSync(join(projectRoot, "ANCHOR_INTEGRATION.md"), integration);
  console.log("  ✅ ANCHOR_INTEGRATION.md（项目根）");
}

function readPkgJson(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  } catch {
    return {};
  }
}

function generateIndex(target) {
  const projectRoot = resolve(target, "..");
  const compsDir = join(projectRoot, DEFAULT_COMPONENTS_REL);
  if (!existsSync(compsDir)) return;

  const lines = [
    "// Auto-generated — Design-anchor compatibility barrel.",
    `// Prefer importing from @design or @/${DEFAULT_COMPONENTS_REL.replace(/^src\//, "")}.`,
    "",
  ];

  if (existsSync(join(compsDir, "index.ts"))) {
    lines.push(`export * from "../${DEFAULT_COMPONENTS_REL}";`);
  } else {
    const files = readdirSyncSafe(compsDir).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".demo.") && !f.includes(".stories."),
    );
    for (const f of files) {
      const mod = f.replace(/\.tsx$/, "");
      lines.push(`export * from "../${DEFAULT_COMPONENTS_REL}/${mod}";`);
    }
  }


  writeFileSync(join(target, "index.ts"), lines.join("\n") + "\n");
  console.log("  ✅ index.ts（组件统一入口）");
}

function readdirSyncSafe(dir) {
  try { return readdirSync(dir); }
  catch { return []; }
}

/* ─── 场景路由表生成 ─── */

function buildSceneRouting(specDir) {
  if (!existsSync(specDir)) return "";

  const sceneKeywords = [
    { keywords: ["聊天", "对话", "chat", "conversation", "AI 对话"], scene: "AI 对话/聊天界面" },
    { keywords: ["助手", "assistant", "AI 助手", "copilot"], scene: "AI 助手集成" },
    { keywords: ["侧边栏", "sidebar", "工作台"], scene: "侧边栏/工作台布局" },
    { keywords: ["弹窗", "modal", "浮窗", "弹出"], scene: "弹窗/浮层" },
    { keywords: ["思考", "推理", "思维链", "reasoning", "chain of thought"], scene: "AI 思考过程展示" },
    { keywords: ["工具调用", "tool-call", "function call"], scene: "AI 工具调用展示" },
    { keywords: ["模型选择", "model selector", "切换模型"], scene: "AI 模型切换" },
    { keywords: ["附件", "上传", "attachment", "upload"], scene: "文件上传/附件" },
    { keywords: ["markdown", "富文本"], scene: "Markdown/富文本渲染" },
    { keywords: ["主表格", "数据表格", "datatable", "data table", "分页"], scene: "数据表格展示" },
    { keywords: ["表单字段", "文本输入", "勾选", "单选", "滑块"], scene: "表单/数据输入" },
    { keywords: ["面包屑", "breadcrumb", "导航菜单", "navigation menu"], scene: "导航" },
    { keywords: ["确认", "不可逆", "危险操作", "二次确认"], scene: "危险操作确认" },
    { keywords: ["toast", "操作反馈"], scene: "操作反馈/通知" },
    { keywords: ["骨架屏", "skeleton", "旋转指示", "spinner", "加载旋转"], scene: "加载状态" },
    { keywords: ["空状态", "无数据", "empty"], scene: "空状态" },
    { keywords: ["日期", "日历", "calendar"], scene: "日期选择" },
    { keywords: ["选项卡", "tabs"], scene: "选项卡切换" },
    { keywords: ["头像", "avatar"], scene: "用户头像" },
    { keywords: ["进度", "progress", "百分比"], scene: "进度展示" },
  ];

  const files = readdirSync(specDir).filter(f => f.endsWith(".spec.json"));
  const sceneMap = {};

  for (const f of files) {
    try {
      const s = JSON.parse(readFileSync(join(specDir, f), "utf8"));
      const intent = (s.intent || "").toLowerCase();
      const name = s.componentName;

      for (const { keywords, scene } of sceneKeywords) {
        if (keywords.some(kw => intent.includes(kw.toLowerCase()))) {
          if (!sceneMap[scene]) sceneMap[scene] = [];
          if (!sceneMap[scene].includes(name)) sceneMap[scene].push(name);
        }
      }
    } catch {}
  }

  if (!Object.keys(sceneMap).length) return "";

  let table = "## 场景 → 组件速查（重要：先查此表再动手写）\n\n";
  table += "遇到以下场景时，**必须使用对应组件，禁止从零手写**：\n\n";
  table += "| 场景 | 使用组件 | 禁止 |\n";
  table += "|------|---------|------|\n";

  for (const [scene, components] of Object.entries(sceneMap)) {
    const forbidden = scene.includes("AI") ? "从零手写聊天/AI UI" :
                      scene.includes("表格") ? "原生 `<table>` + 手写样式" :
                      scene.includes("表单") ? "原生 `<input>` + 手写样式" :
                      scene.includes("导航") ? "原生 `<nav>` + 手写链接列表" :
                      scene.includes("确认") ? "`window.confirm()` 或手写弹窗" :
                      scene.includes("通知") ? "`alert()` 或手写 toast" :
                      scene.includes("加载") ? "手写 CSS 动画 spinner" :
                      "手写替代实现";
    table += `| ${scene} | ${components.join("、")} | ${forbidden} |\n`;
  }

  table += "\n> **规则：写任何 UI 前，先在此表中查找是否已有对应组件。找到就用，找不到再造。**\n";
  return table;
}

/* ─── Cursor 集成 ─── */

/** 收集规则正文需要的所有动态片段（spec 列表 + 场景路由表 + 相对路径）。 */
function collectRuleSections(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const relComponents = DEFAULT_COMPONENTS_REL;
  const specDir = join(libTarget, "src/anchor/schema/components");

  let specSummary = "";
  if (existsSync(specDir)) {
    const files = readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
    for (const f of files) {
      try {
        const s = JSON.parse(readFileSync(join(specDir, f), "utf8"));
        specSummary += `- **${s.componentName}**: ${s.intent}\n`;
      } catch {}
    }
  }

  const sceneRouting = buildSceneRouting(specDir);
  return { relLib, relComponents, specSummary, sceneRouting };
}

/** 多 IDE 共享的规则正文（不含 frontmatter，留给各 IDE 包装）。 */
function buildAnchorRuleBody({ relLib, relComponents, specSummary, sceneRouting }) {
  return `# Design-anchor Component Governance

This project uses Design-anchor. The visible component source is \`${relComponents}\`; the hidden \`${relLib}\` directory is the Anchor control plane for Portal, schema, sync, and governance. All UI development must follow these rules.

## Directory Conventions

- **Application / business pages**: Write in your project's own \`src/\` (or your project's original app directory). **Do NOT** write business pages, routes, or feature code inside \`${relLib}\`.
- **Component source**: Maintain Design-anchor components in \`${relComponents}\`. App code should import from \`@design\` or \`@/components/anchor-ui\`.
- **Anchor control plane**: \`${relLib}\` contains Portal, schema, rules, scripts, generated previews, and sync tooling. Do not treat it as the app's UI implementation folder.
- **Design Tokens**: Runtime token source is \`src/design-tokens/tokens.json\`; generated CSS is \`src/styles/design-tokens.generated.css\`.

## AI Coding Loop Visibility

- **Preflight exposure**: when a task touches UI, theme, components, tokens, or page layout, start with a visible line: \`Design Anchor 预检：我会先查组件规范与 token，优先复用 @design。\`
- **Before writing UI**: check \`@design\` / \`@/components/anchor-ui\` and component specs first; prefer existing components and token classes.
- **During edits**: if raw HTML, hard-coded colors, arbitrary token-sensitive values, or bypassed Design-anchor components appear, fix them inside the current AI coding task and say: \`Design Anchor 自动治理：已将原生标签 / hardcoded color / arbitrary spacing 改为组件或语义 token。\`
- **After edits**: include a short Design Anchor self-check in the task summary instead of sending the user to a Portal backlog.
- **Final answer must include a \`Design Anchor 自检\` line whenever UI code changed**, covering reused components, token compliance, auto-fixes, unresolved confirmations, and sync/audit status.
- **Passed summary**: \`Design Anchor 自检：复用了 N 个 @design 组件，未发现硬编码颜色，规则已同步。\`
- **Auto-fixed summary**: \`Design Anchor 自检：检测到 N 处绕过 @design / token 的实现，已改为使用 Button / DataTable。\`
- **Needs-confirmation summary**: \`Design Anchor 自检：有 N 处需要确认：这个原生 table 是否应该替换为 DataTable？\`
- **Never hide Design Anchor behind generic wording** such as “lint passed” or “checks passed”; name it explicitly in the AI response.

## Portal Intent Router（中英文都要识别）

当用户的请求属于「查看/修改设计系统状态」而不是直接写业务功能时，优先唤起 Portal：运行 \`npx design-anchor portal <tab>\`（等价于启动 Anchor Portal 并打开对应页面）。

| 用户意图 / User intent | 中文触发词示例 | English trigger examples | 打开 |
|---|---|---|---|
| Token / theme | 改 token、调整 token、看看 token、当前 token、修改主题、调整主题、打开主题编辑器、主题编辑器、改品牌色、改圆角、改间距、切暗色、主题设置 | change token, edit tokens, show tokens, token status, edit theme, adjust theme, open theme editor, theme editor, brand color, radius, spacing, dark mode, theme | \`npx design-anchor portal tokens\` |
| Component library | 有哪些组件、组件列表、组件库、看看组件、组件预览 | component list, available components, component library, show components, preview components | \`npx design-anchor portal components\` |
| Component spec / schema | 组件规范、组件协议、组件 schema、组件 props、映射关系、变体规范 | component spec, schema, props contract, variant mapping, component contract | \`npx design-anchor portal specs\` |
| Component style tuning | 改组件样式、调整组件、按钮样式、表格样式、组件风格 | change component style, tune component, button style, table style | \`npx design-anchor portal components\` |
| Dashboard / health | 右上角仪表盘、健康度、AI 约束状态、审计、自检 | dashboard, health, AI constraints, audit, self-check | \`npx design-anchor portal theme\` then use the top-right dashboard icon |
| Docs / help | 文档、使用说明、怎么接入、CLI 命令 | docs, documentation, how to use, setup, CLI commands | \`npx design-anchor portal docs\` |
| Preset / onboarding | 选择 preset、品牌风格、重新 onboarding、从预设开始 | preset, style preset, onboarding, brand style | \`npx design-anchor portal presets\` |

规则：如果用户说“打开/看看/调整/修改/配置/查看/show/change/edit/configure/check/list”并且对象是 token、主题、主题编辑器、组件、规范、仪表盘、健康、preset、文档，先打开 Portal；只有用户明确要求“不要打开 Portal / 直接改文件 / code only”时，才跳过 Portal。

${sceneRouting}

## 组件引用规则

1. **禁止使用原生 HTML 标签**：\`<button>\`、\`<input>\`、\`<table>\` 等，必须使用组件库组件
2. **导入路径**：**优先**使用已在业务 \`tsconfig\` / Vite 中配置的 **\`@design\`**（见项目根 \`ANCHOR_INTEGRATION.md\`）；否则从 \`@/components/anchor-ui/\` 导入
3. **禁止手写间距**：不允许 \`m-[13px]\`、\`p-[7px]\` 等任意值 Tailwind 类
4. **颜色仅用语义类**：\`bg-primary\`、\`text-muted-foreground\` 等，禁止硬编码色值

## 可用组件

${specSummary || "（运行 anchor sync 后自动生成）"}

## 组件规范（JSON）

规范文件在 \`${relLib}/src/anchor/schema/components/*.spec.json\`。在 IDE 里直接改 JSON 即可；改完后在 \`${relLib}\` 下执行 \`npm run sync:anchor\`（或 \`anchor sync .\`）生成规则镜像与 Tailwind 生成物。

## MCP 工具（若已配置 .mcp.json / .cursor/mcp.json）

按需使用：\`list_components\`、\`read_component\`、\`create_component\`、\`list_tokens\`、\`update_token\`、\`run_audit\`、\`run_sync_rules\`、\`read_schema\`、\`update_schema\`、\`get_cursorrules\`、\`read_file\`、\`write_file\`。

## AI 核心契约

详见项目根目录 **AGENTS.md**，三条硬规则：
1. UI 组件真源在 \`${relComponents}\`，\`${relLib}\` 只管 Anchor 产品控制面
2. 仅通过 Design Token 引用颜色/间距，禁止硬编码
3. 组件行为以 schema JSON 为唯一数据源
`;
}

function generateCursorRule(projectRoot, libTarget) {
  const sections = collectRuleSections(projectRoot, libTarget);
  const rulesDir = join(projectRoot, ".cursor/rules");
  mkdirSync(rulesDir, { recursive: true });

  const rule = `---
description: Design-anchor component governance rules — AI must follow these constraints
alwaysApply: true
---

${buildAnchorRuleBody(sections)}`;

  writeFileSync(join(rulesDir, "anchor.mdc"), rule);
  console.log("  ✅ .cursor/rules/anchor.mdc（Cursor）");
}

/** Claude Code CLI / Claude Desktop 读 CLAUDE.md（项目根 + 父目录）。 */
function generateClaudeMd(projectRoot, libTarget) {
  const sections = collectRuleSections(projectRoot, libTarget);
  const content = `<!--
  Design-anchor governance rules for Claude Code CLI / Claude Desktop.
  Auto-regenerated by \`anchor init\` / \`anchor sync\`. Edit
  ${relative(projectRoot, libTarget).split(sep).join("/")}/src/anchor/schema/components/*.spec.json
  then re-run sync to refresh this file.
-->

${buildAnchorRuleBody(sections)}`;
  writeFileSync(join(projectRoot, "CLAUDE.md"), content);
  console.log("  ✅ CLAUDE.md（Claude Code / Claude Desktop）");
}

/** GitHub Copilot Chat 读 .github/copilot-instructions.md。 */
function generateCopilotInstructions(projectRoot, libTarget) {
  const sections = collectRuleSections(projectRoot, libTarget);
  const dir = join(projectRoot, ".github");
  mkdirSync(dir, { recursive: true });
  const content = `<!--
  Design-anchor governance rules for GitHub Copilot Chat.
  Auto-regenerated by \`anchor init\` / \`anchor sync\`.
-->

${buildAnchorRuleBody(sections)}`;
  writeFileSync(join(dir, "copilot-instructions.md"), content);
  console.log("  ✅ .github/copilot-instructions.md（Copilot Chat）");
}

/** Claude Code / Claude Desktop / Cline / Zed 读项目根 .mcp.json。 */
function generateRootMcp(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const mcpPath = join(projectRoot, ".mcp.json");
  let existing = {};
  if (existsSync(mcpPath)) {
    try { existing = JSON.parse(readFileSync(mcpPath, "utf8")); } catch {}
  }
  const mcpServers = existing.mcpServers || {};
  mcpServers["anchor"] = {
    command: "node",
    args: [join(PKG_ROOT, "bin/anchor-mcp.mjs"), relLib],
  };
  writeFileSync(mcpPath, JSON.stringify({ mcpServers }, null, 2) + "\n");
  console.log("  ✅ .mcp.json（Claude Code / Cline / Zed / 其他 MCP 客户端）");
}

function generateAgentsMd(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const relComponents = DEFAULT_COMPONENTS_REL;
  const content = `# AGENTS.md — AI 编码边界与契约

## 目录约定（三条硬规则）

1. **UI / 组件实现真源** → \`${relComponents}/\`
   - 所有组件实现、变体、样式变更只在此处修改。
   - 业务代码通过 \`@design\` 别名或 \`@/components/anchor-ui\` 引用。
   - 禁止从 \`${relLib}\` 复制或深路径引用组件实现。

2. **Token 真源** → \`src/design-tokens/tokens.json\`
   - 项目创建 token 后，业务项目自己的 token 是唯一真源。
   - \`${relLib}/src/design-tokens/\` 仅作为初始化模板与派生算法，不作为业务运行时 token 来源。

3. **Portal / sync / kit 集成** → \`${relLib}/\` 根层（CLI、scripts、anchor-portal、schema、rules）
   - 仅用于 Anchor 产品控制面、schema 同步、Portal 适配。
   - 非组件实现代码；不要把业务页面或组件实现写进这里。

4. **上游 npm 包** → \`node_modules/design-anchor/\` **只读**
   - 通过 \`anchor upgrade\` 同步变更到 \`${relLib}/\`。
   - 禁止直接修改 \`node_modules\` 内文件。

## AI 编码契约

- **Import 来源**：优先 \`@design\`（指向 \`${relComponents}/index.ts\`）；也可使用 \`@/components/anchor-ui/<component>\`；禁止从 \`node_modules\` 或 \`${relLib}\` 深路径引用组件。
- **颜色**：仅使用 Design Token 语义类（\`bg-primary\`、\`text-muted-foreground\`），禁止硬编码色值。
- **Token 修改**：只修改 \`src/design-tokens/tokens.json\`，然后同步生成 \`src/styles/design-tokens.generated.css\`。
- **间距**：禁止任意值 Tailwind（\`m-[13px]\`），使用 schema 声明的语义 props。
- **组件规范**：以 \`${relLib}/src/anchor/schema/components/*.spec.json\` 为唯一数据源；规范中的组件路径应指向 \`@/components/anchor-ui\` 或 \`@design\`。
- **修改后**：运行 \`npm run sync:anchor\` 同步 .cursorrules 与 Tailwind 扩展。

## AI 生码链路中的 Design Anchor

- **生码开始**：只要任务涉及 UI / 主题 / 组件 / token / 页面布局，先显式输出：\`Design Anchor 预检：我会先查组件规范与 token，优先复用 @design。\`
- **写 UI 前**：先查 \`@design\` / \`${relComponents}\` 和组件 spec，优先复用已有组件与 token。
- **写 UI 中**：发现原生 \`<button>\`、\`<input>\`、\`<table>\`、硬编码颜色、任意值 Tailwind 或绕过 \`@design\` 的实现时，直接在当前生码任务里改正，并显式说明：\`Design Anchor 自动治理：已改为组件或语义 token。\`
- **写 UI 后**：运行或总结 Design Anchor 自检，把结果放在 AI 任务总结中，不把问题处理迁移到 Portal backlog。
- **最终回复**：只要改过 UI，必须包含一行 \`Design Anchor 自检\`，说明组件复用、token 合规、自动修复、待确认项与同步 / audit 状态。
- **通过示例**：\`Design Anchor 自检：复用了 8 个 @design 组件，未发现硬编码颜色，规则已同步。\`
- **自动修复示例**：\`Design Anchor 自检：检测到 2 处绕过 @design / token 的实现，已改为使用 Button / DataTable。\`
- **需要确认示例**：\`Design Anchor 自检：有 1 处需要确认：这个原生 table 是否应该替换为 DataTable？\`

## Portal 自动唤起

用户要求查看或修改 token、主题、组件库、组件规范、组件样式、治理健康度、preset 或文档时，优先运行 \`npx design-anchor portal <tab>\` 打开 Portal。中英文都要识别：
- \`tokens\`：改 token、看看 token、修改主题、调整主题、打开主题编辑器、主题编辑器、改品牌色、改圆角、theme、theme editor、design tokens。
- \`components\`：有哪些组件、组件列表、组件预览、component library。
- \`specs\`：组件规范、组件 schema、props contract、variant mapping。
- \`dashboard\`：右上角仪表盘、健康度、AI 约束状态、audit、self-check。
- \`docs\`：文档、怎么接入、CLI commands。
- \`presets\`：选择 preset、品牌风格、onboarding。
`;
  writeFileSync(join(projectRoot, "AGENTS.md"), content);
  console.log("  ✅ AGENTS.md（项目根）");
}

function generateCursorMcp(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const mcpPath = join(projectRoot, ".cursor/mcp.json");

  let existing = {};
  if (existsSync(mcpPath)) {
    try { existing = JSON.parse(readFileSync(mcpPath, "utf8")); } catch {}
  }

  const mcpServers = existing.mcpServers || {};
  mcpServers["anchor"] = {
    command: "node",
    args: [join(PKG_ROOT, "bin/anchor-mcp.mjs"), relLib],
  };

  mkdirSync(join(projectRoot, ".cursor"), { recursive: true });
  writeFileSync(mcpPath, JSON.stringify({ mcpServers }, null, 2) + "\n");
  console.log("  ✅ .cursor/mcp.json");
}

function mergeHooksJson(existing, incoming) {
  const version = existing.version ?? incoming.version ?? 1;
  const hooks = { ...(existing.hooks || {}) };
  for (const [event, arr] of Object.entries(incoming.hooks || {})) {
    const prev = [...(hooks[event] || [])];
    const seen = new Set(prev.map((h) => JSON.stringify(h)));
    for (const h of arr) {
      const key = JSON.stringify(h);
      if (!seen.has(key)) {
        prev.push(h);
        seen.add(key);
      }
    }
    hooks[event] = prev;
  }
  return { version, hooks };
}

function installCursorHooks(projectRoot) {
  const hooksSrcDir = join(PKG_ROOT, ".cursor/hooks");
  const hooksDstDir = join(projectRoot, ".cursor/hooks");
  const srcJson = join(PKG_ROOT, ".cursor/hooks.json");
  if (!existsSync(hooksSrcDir) || !existsSync(srcJson)) return;

  mkdirSync(hooksDstDir, { recursive: true });
  for (const f of readdirSync(hooksSrcDir)) {
    cpSync(join(hooksSrcDir, f), join(hooksDstDir, f), { recursive: true });
  }

  const incoming = JSON.parse(readFileSync(srcJson, "utf8"));
  const dstJson = join(projectRoot, ".cursor/hooks.json");
  if (existsSync(dstJson)) {
    const existing = JSON.parse(readFileSync(dstJson, "utf8"));
    writeFileSync(dstJson, JSON.stringify(mergeHooksJson(existing, incoming), null, 2) + "\n");
  } else {
    writeFileSync(dstJson, JSON.stringify(incoming, null, 2) + "\n");
  }
  console.log("  ✅ .cursor/hooks（afterFileEdit → anchor audit）");
}

function installSelfcheckRule(projectRoot) {
  const src = join(PKG_ROOT, ".cursor/rules/anchor-selfcheck.mdc");
  const dstDir = join(projectRoot, ".cursor/rules");
  if (!existsSync(src)) return;
  mkdirSync(dstDir, { recursive: true });
  cpSync(src, join(dstDir, "anchor-selfcheck.mdc"));
  console.log("  ✅ .cursor/rules/anchor-selfcheck.mdc");
}

/* ─── govern（轻量治理模式） ─── */

function doGovern() {
  const projectRoot = process.cwd();

  console.log(`
╔══════════════════════════════════════════╗
║       Design-anchor Govern — Governance Mode          ║
║  仅注入 AI 规则，不拷贝组件/CSS/Portal    ║
╚══════════════════════════════════════════╝
`);
  console.log(`  📂 项目根: ${projectRoot}\n`);

  // 收集 spec 概要（从 npm 包内读取）
  const specDir = join(PKG_ROOT, "src/anchor/schema/components");
  let specSummary = "";
  let specDetails = "";
  if (existsSync(specDir)) {
    const files = readdirSync(specDir).filter(f => f.endsWith(".spec.json"));
    for (const f of files) {
      try {
        const s = JSON.parse(readFileSync(join(specDir, f), "utf8"));
        specSummary += `- **${s.componentName}**: ${s.intent}\n`;
        // 收集 forbidden / corrections / examples 用于规则
        if (s.forbidden?.length) {
          specDetails += `\n### ${s.componentName} — 禁止\n`;
          for (const item of s.forbidden) {
            specDetails += `- ❌ ${item.pattern}：${item.reason}\n`;
          }
        }
        if (s.corrections?.length) {
          specDetails += `\n### ${s.componentName} — 纠正\n`;
          for (const item of s.corrections) {
            specDetails += `- ⚠️ ${item.id}：${item.wrong} → ${item.right}（${item.reason}）\n`;
          }
        }
      } catch {}
    }
  }

  // 1. 生成 .cursor/rules/anchor.mdc（治理版：no .anchor path references）
  const rulesDir = join(projectRoot, ".cursor/rules");
  mkdirSync(rulesDir, { recursive: true });

  const sceneRouting = buildSceneRouting(specDir);

  const governBody = `# Design-anchor AI Coding Governance

This project uses Design-anchor governance mode（\`anchor govern\`），AI 编码必须遵守以下规范。

## AI 生码链路中的 Design Anchor

- **生码开始**：只要任务涉及 UI / 组件 / 样式 / 主题，先显式输出：\`Design Anchor 预检：我会先查现有组件、样式 token 和设计模式。\`
- **写 UI 前**：先搜索现有组件、样式 token 和设计模式。
- **写 UI 中**：发现原生标签替代已有组件、硬编码颜色、任意值 Tailwind 或设计语言漂移时，直接在当前生码任务里修正，并显式说明：\`Design Anchor 自动治理：已改为现有组件与语义样式。\`
- **写 UI 后**：在任务总结里追加 Design Anchor 自检结果，不把问题处理迁移到 Portal backlog。
- **最终回复**：只要改过 UI，必须包含一行 \`Design Anchor 自检\`，说明组件复用、token 合规、自动修复、待确认项与 audit 状态。
- **通过示例**：\`Design Anchor 自检：复用了 N 个项目组件，未发现硬编码颜色。\`
- **自动修复示例**：\`Design Anchor 自检：检测到 N 处绕过组件/token 的实现，已改为复用现有组件与语义样式。\`
- **需要确认示例**：\`Design Anchor 自检：有 N 处需要确认：这个原生 table 是否应该替换为项目 DataTable？\`

${sceneRouting}

## 组件引用规则

1. **禁止使用原生 HTML 标签替代已有组件**：如果项目中已有 Button、Input、Table 等封装组件，禁止绕过使用原生标签
2. **禁止手写间距**：不允许 \`m-[13px]\`、\`p-[7px]\` 等任意值 Tailwind 类；使用预设的 spacing scale
3. **颜色仅用语义类**：\`bg-primary\`、\`text-muted-foreground\` 等，禁止硬编码色值（如 \`#ff6600\`、\`rgb()\`）
4. **一致的设计语言**：新增 UI 必须与现有组件的视觉风格保持一致

## 参考组件规范

The following component specs are from the Design-anchor component library，AI 应参考这些模式：

${specSummary || "（无可用规范）"}

## 详细约束

${specDetails || "（无详细约束）"}

## AI 核心契约

1. 优先复用项目中已有的 UI 组件，禁止重复造轮子
2. 仅通过 Design Token / CSS 变量 / Tailwind 语义类引用颜色和间距
3. 修改 UI 前先查阅项目中已有的组件和模式
4. 不引入与项目现有设计系统风格不一致的第三方 UI 库
`;

  const cursorGovern = `---
description: Design-anchor AI coding governance rules — for existing projects
alwaysApply: true
---

${governBody}`;
  writeFileSync(join(rulesDir, "anchor.mdc"), cursorGovern);
  console.log("  ✅ .cursor/rules/anchor.mdc（Cursor）");

  // Claude Code / Claude Desktop
  const claudeHeader = `<!--
  Design-anchor governance rules (govern mode) for Claude Code CLI / Claude Desktop.
  Auto-regenerated by \`anchor govern\`.
-->

`;
  writeFileSync(join(projectRoot, "CLAUDE.md"), claudeHeader + governBody);
  console.log("  ✅ CLAUDE.md（Claude Code / Claude Desktop）");

  // GitHub Copilot Chat
  const copilotDir = join(projectRoot, ".github");
  mkdirSync(copilotDir, { recursive: true });
  const copilotHeader = `<!--
  Design-anchor governance rules (govern mode) for GitHub Copilot Chat.
  Auto-regenerated by \`anchor govern\`.
-->

`;
  writeFileSync(join(copilotDir, "copilot-instructions.md"), copilotHeader + governBody);
  console.log("  ✅ .github/copilot-instructions.md（Copilot Chat）");

  // 2. 安装 selfcheck 规则
  const selfcheckSrc = join(PKG_ROOT, ".cursor/rules/anchor-selfcheck.mdc");
  if (existsSync(selfcheckSrc)) {
    cpSync(selfcheckSrc, join(rulesDir, "anchor-selfcheck.mdc"));
    console.log("  ✅ .cursor/rules/anchor-selfcheck.mdc（自检清单）");
  }

  // 3. 生成 AGENTS.md（治理版）
  const agentsContent = `# AGENTS.md — AI 编码边界与契约（Govern 模式）

## 治理模式说明

This project uses Design-anchor **governance mode**（govern）——仅注入 AI 编码规则，不包含独立组件库目录。
项目保持原有结构不变，AI 编码通过规则文件引导一致性。

## AI 编码契约

### 必须

- **复用现有组件**：在创建新 UI 前，搜索项目中是否已有类似组件
- **语义化样式**：使用 Tailwind 主题类或 CSS 变量，不硬编码颜色/尺寸
- **渐进增强**：新增功能应基于项目现有设计模式扩展，而非另起炉灶
- **保持一致性**：按钮、输入框、卡片等 UI 元素应与项目现有风格统一

### 禁止

- ❌ 使用原生 HTML 标签替代项目已有的封装组件
- ❌ 使用任意值 Tailwind 类（\`m-[13px]\`、\`w-[347px]\`）
- ❌ 硬编码色值（\`#fff\`、\`rgb()\`、\`hsl()\`）
- ❌ 引入与现有设计系统冲突的第三方 UI 框架
- ❌ 在业务代码中复制粘贴组件实现（应抽取为共享组件）

### 修改 UI 的流程

1. 先查阅项目中已有组件（搜索 components 目录）
2. 确认是否可以复用 / 扩展现有组件
3. 若需新建组件，遵循项目现有的命名和文件组织约定
4. 使用语义化的 Tailwind 类和 CSS 变量

### AI 任务总结

- 任务结束时追加 \`Design Anchor 自检\`，说明复用了哪些组件、是否发现并修复硬编码颜色 / 任意值 Tailwind / 原生标签替代问题。
- 能自动修的直接修；不能自动判断的，在对话中提出一个明确确认项。
`;
  writeFileSync(join(projectRoot, "AGENTS.md"), agentsContent);
  console.log("  ✅ AGENTS.md（AI 编码边界）");

  // 4. 生成 .cursorrules（简洁版，兼容非 Cursor IDE）
  const cursorrules = `# Design-anchor AI Govern Rules

You are working in a project governed by Design-anchor design rules.

## Key Constraints
- Reuse existing UI components; do not recreate what already exists
- Use semantic Tailwind classes only (no arbitrary values like m-[13px])
- Use CSS variables or theme tokens for colors (no hardcoded hex/rgb)
- Maintain visual consistency with the project's existing design language
- Search for existing components before creating new UI elements

## Forbidden Patterns
- Raw HTML tags when a project component exists (e.g. <button> when Button component exists)
- Arbitrary Tailwind values: m-[*], p-[*], w-[*], h-[*], text-[#*]
- Hardcoded colors: bg-[#...], text-[#...], border-[#...]
- Inline styles for layout/spacing/color

## Before Modifying UI
0. Start with: "Design Anchor 预检：我会先查现有组件、样式 token 和设计模式。"
1. Search the project for existing components
2. Check if the change can be achieved by extending an existing component
3. Follow established naming conventions and file structure

## After Modifying UI
- Add a short Design Anchor self-check to the task summary.
- Call out "Design Anchor 自动治理" when you safely replace raw tags, hardcoded colors, or arbitrary token-sensitive values.
- Auto-fix raw tags, hardcoded colors, and arbitrary token-sensitive values when safe.
- Ask one clear confirmation question when a component replacement cannot be decided automatically.
`;
  writeFileSync(join(projectRoot, ".cursorrules"), cursorrules);
  console.log("  ✅ .cursorrules（IDE 通用规则）");

  // 5. 配置 MCP（Cursor + Claude Code / Cline / Zed 等）
  const mcpEntry = join(PKG_ROOT, "bin", "anchor-mcp.mjs");
  if (existsSync(mcpEntry)) {
    // Cursor: .cursor/mcp.json
    const cursorMcpPath = join(projectRoot, ".cursor/mcp.json");
    let cursorMcp = {};
    if (existsSync(cursorMcpPath)) {
      try { cursorMcp = JSON.parse(readFileSync(cursorMcpPath, "utf8")); } catch {}
    }
    const cursorServers = cursorMcp.mcpServers || {};
    cursorServers["anchor"] = { command: "node", args: [mcpEntry, projectRoot] };
    mkdirSync(join(projectRoot, ".cursor"), { recursive: true });
    writeFileSync(cursorMcpPath, JSON.stringify({ mcpServers: cursorServers }, null, 2) + "\n");
    console.log("  ✅ .cursor/mcp.json（Cursor MCP）");

    // Claude Code / Cline / Zed: .mcp.json at project root
    const rootMcpPath = join(projectRoot, ".mcp.json");
    let rootMcp = {};
    if (existsSync(rootMcpPath)) {
      try { rootMcp = JSON.parse(readFileSync(rootMcpPath, "utf8")); } catch {}
    }
    const rootServers = rootMcp.mcpServers || {};
    rootServers["anchor"] = { command: "node", args: [mcpEntry, projectRoot] };
    writeFileSync(rootMcpPath, JSON.stringify({ mcpServers: rootServers }, null, 2) + "\n");
    console.log("  ✅ .mcp.json（Claude Code / Cline / Zed MCP）");
  }

  console.log(`
✅ 治理模式初始化完成！

生成的 AI 规则文件：
  • CLAUDE.md                          — Claude Code / Claude Desktop
  • .cursor/rules/anchor.mdc           — Cursor（alwaysApply）
  • .cursor/rules/anchor-selfcheck.mdc — 改完代码后的自检清单
  • .github/copilot-instructions.md    — GitHub Copilot Chat
  • AGENTS.md                          — 通用 AI 编码边界
  • .cursorrules                       — IDE 通用兜底
  • .mcp.json + .cursor/mcp.json       — MCP Server

与 init 模式的区别：
  • 不拷贝组件源码、CSS、Portal
  • 不创建 .anchor/ 目录
  • 不修改 package.json 或安装依赖
  • 仅通过规则文件约束 AI 行为

重新打开 IDE 后规则生效。
`);
}

/* ─── theme（从 Design Prompt 提取 Token） ─── */

function extractTokensFromPrompt(text) {
  const seed = {};
  const seedDark = {};
  const fixedAliases = {};
  const customSeeds = {};
  const sources = [];

  const hexRe = /#[0-9a-fA-F]{6}\b/g;
  const lines = text.split("\n");

  // ── Phase 0: Detect if prompt is primarily dark mode ──
  const darkSignals = (text.match(/\bdark\s*mode\b/gi) || []).length
    + (text.match(/\bnear[- ]?black/gi) || []).length
    + (text.match(/\bdark\s*theme\b/gi) || []).length
    + (text.match(/deep\s*space/gi) || []).length;
  const lightSignals = (text.match(/\blight\s*mode\b/gi) || []).length
    + (text.match(/\boff[- ]?white\b/gi) || []).length
    + (text.match(/\blight\s*theme\b/gi) || []).length;
  const isDarkPrompt = darkSignals > lightSignals;

  // ── Phase 1: Parse markdown table rows ──
  // Matches rows like: | `token-name` | `#hex` | description |
  // or: | `token-name` | #hex | description |
  const tableTokens = [];
  for (const line of lines) {
    if (!line.includes("|") || !hexRe.test(line)) continue;
    hexRe.lastIndex = 0;
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const tokenCell = cells[0].replace(/`/g, "").toLowerCase().trim();
    const allHexes = [];
    for (const cell of cells) {
      const m = cell.match(hexRe);
      if (m) allHexes.push(...m);
    }
    if (allHexes.length === 0) continue;
    const descCell = cells.slice(2).join(" ").toLowerCase();
    tableTokens.push({ token: tokenCell, hex: allHexes[0], desc: descCell, line: line.trim().substring(0, 80) });
  }

  // Map table tokens to seed fields
  const tableRules = [
    { match: (t) => /^(accent|primary|brand|cta)$/.test(t) || /primary.*(action|interactive|color|button|accent)/.test(t.toLowerCase() + " " + (tableTokens.find(x => x.token === t)?.desc || "")), field: "colorPrimary" },
    { match: (t, d) => /success|positive/.test(t + " " + d), field: "colorSuccess" },
    { match: (t, d) => /warning|caution/.test(t + " " + d), field: "colorWarning" },
    { match: (t, d) => /error|danger|destructive/.test(t + " " + d), field: "colorError" },
    { match: (t, d) => /^info$/.test(t) || /informational/.test(d), field: "colorInfo" },
    { match: (t, d) => /^link$/.test(t), field: "colorLink" },
    { match: (t, d) => /background|bg[- ]?base|canvas/.test(t) && !/elevated|deep|hover/.test(t), field: "colorBgBase" },
    { match: (t, d) => /foreground(?!.*muted|.*subtle)|primary.*text|text[- ]?base|ink/.test(t) && !/muted|subtle|secondary/.test(t), field: "colorTextBase" },
  ];

  for (const row of tableTokens) {
    for (const rule of tableRules) {
      if (rule.match(row.token, row.desc)) {
        const target = isDarkPrompt ? seedDark : seed;
        const prefix = isDarkPrompt ? "seedDark" : "seed";
        if (!target[rule.field]) {
          target[rule.field] = row.hex;
          sources.push({ field: `${prefix}.${rule.field}`, value: row.hex, from: row.line });
        }
        break;
      }
    }
  }

  // ── Phase 2: Contextual hex scanning for non-table text ──
  const colorRoles = [
    { keys: ["primary color", "primary action", "brand color", "accent color", "cta color", "signature color", "interactive color"], field: "colorPrimary" },
    { keys: ["success", "positive"], field: "colorSuccess" },
    { keys: ["warning", "caution"], field: "colorWarning" },
    { keys: ["error color", "error red", "danger", "destructive"], field: "colorError" },
    { keys: ["info blue", "info color"], field: "colorInfo" },
    { keys: ["link color"], field: "colorLink" },
    { keys: ["page canvas", "page background", "bg base", "background base", "canvas white"], field: "colorBgBase" },
    { keys: ["primary text", "ink black", "text base", "body text color", "text color"], field: "colorTextBase" },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("|") && line.split("|").length > 3) continue; // skip table rows (already parsed)
    const hexMatches = line.match(hexRe);
    if (!hexMatches) continue;
    const ctx = line.toLowerCase();

    for (const hex of hexMatches) {
      const target = isDarkPrompt ? seedDark : seed;
      const prefix = isDarkPrompt ? "seedDark" : "seed";
      for (const role of colorRoles) {
        if (role.keys.some(k => ctx.includes(k))) {
          if (!target[role.field]) {
            target[role.field] = hex;
            sources.push({ field: `${prefix}.${role.field}`, value: hex, from: line.trim().substring(0, 60) });
          }
          break;
        }
      }
    }
  }

  // If dark prompt found bg/text but no primary, scan for accent-like references
  const primaryTarget = isDarkPrompt ? seedDark : seed;
  if (!primaryTarget.colorPrimary) {
    for (const line of lines) {
      const low = line.toLowerCase();
      if (low.includes("|") && low.split("|").length > 3) continue;
      if (/(?:accent|brand|primary|main\s+color|signature)\b/.test(low)) {
        const m = line.match(hexRe);
        if (m) {
          const prefix = isDarkPrompt ? "seedDark" : "seed";
          primaryTarget.colorPrimary = m[0];
          sources.push({ field: `${prefix}.colorPrimary`, value: m[0], from: line.trim().substring(0, 60) });
          break;
        }
      }
    }
  }

  // ── Phase 3: Font family (line-by-line to avoid cross-line matching) ──
  // Allow markdown bold markers ** and whitespace between label and backtick
  const fontLinePatterns = [
    /font\s*stack[:\s*]*`([^`]+)`/i,
    /(?:ui|body)\s[^`]*font[^`]*`([^`]+)`/i,
    /font[- ]?family[:\s*]*`([^`]+)`/i,
    /font[- ]?family[:\s]*["']([^"'\n]+(?:,\s*[^"'\n]+)*)/i,
  ];
  for (const line of lines) {
    if (seed.fontFamily) break;
    for (const pat of fontLinePatterns) {
      const m = line.match(pat);
      if (m) {
        const raw = m[1].trim();
        if (raw.length > 2 && raw.length < 200 && raw.includes(",")) {
          seed.fontFamily = raw;
          sources.push({ field: "seed.fontFamily", value: raw.substring(0, 50), from: line.trim().substring(0, 60) });
          break;
        }
      }
    }
  }

  // ── Phase 4: Font size (body text only) ──
  // Look for table rows containing "Body" + a size, or explicit "body.*Npx"
  for (const line of lines) {
    if (!seed.fontSize && /\bbody\b/i.test(line)) {
      // Table row: | Body Text | `base` → `lg` | ... | Normal (400) |
      const sizeMatch = line.match(/`?(?:text-)?base`?\s*(?:→|to|\|)/i) || line.match(/\b(1[4-8])\s*px\b/i);
      if (sizeMatch && sizeMatch[1]) {
        const sz = parseInt(sizeMatch[1], 10);
        if (sz >= 13 && sz <= 20) {
          seed.fontSize = sz;
          sources.push({ field: "seed.fontSize", value: `${sz}px`, from: line.trim().substring(0, 60) });
        }
      }
    }
  }
  // Fallback: explicit "body font-size: Npx" or "base font size Npx"
  if (!seed.fontSize) {
    const m = text.match(/(?:body|base)\s+(?:font[- ]?size|size)[:\s]*(\d{1,2})\s*px/i);
    if (m) {
      const sz = parseInt(m[1], 10);
      if (sz >= 12 && sz <= 20) {
        seed.fontSize = sz;
        sources.push({ field: "seed.fontSize", value: `${sz}px`, from: m[0].substring(0, 60) });
      }
    }
  }
  // Fallback: "text-sm to text-base" means ~14px
  if (!seed.fontSize) {
    const m = text.match(/\bbody\b[^|]*\btext-(sm|base|lg)\b/i);
    if (m) {
      const sizeMap = { sm: 14, base: 16, lg: 18 };
      const last = m[0].match(/text-(sm|base|lg)/gi);
      if (last) {
        const key = last[last.length - 1].replace("text-", "").toLowerCase();
        seed.fontSize = sizeMap[key] || 14;
        sources.push({ field: "seed.fontSize", value: `${seed.fontSize}px`, from: `Tailwind class: ${last[last.length - 1]}` });
      }
    }
  }

  // ── Phase 5: Font weights ──
  // Only match explicitly labeled "medium" weight (not "normal" which is 400)
  const weightMediumMatch = text.match(/\bmedium\b[^.\n]*?weight[:\s]*(\d{3})/i)
    || text.match(/weight[:\s]*(\d{3})[^.\n]*?\bmedium\b/i)
    || text.match(/\bMedium\s*\((\d{3})\)/);
  if (weightMediumMatch) {
    const w = parseInt(weightMediumMatch[1], 10);
    if (w >= 400 && w <= 600) {
      fixedAliases.fontWeightMedium = w;
      sources.push({ field: "fixedAliases.fontWeightMedium", value: w, from: weightMediumMatch[0].substring(0, 60) });
    }
  }

  const weightSemiboldMatch = text.match(/\b(?:semibold|semi-bold)\b[^.\n]*?weight[:\s]*(\d{3})/i)
    || text.match(/weight[:\s]*(\d{3})[^.\n]*?\b(?:semibold|semi-bold)\b/i)
    || text.match(/\bSemibold\s*\((\d{3})\)/);
  if (weightSemiboldMatch) {
    const w = parseInt(weightSemiboldMatch[1], 10);
    if (w >= 500 && w <= 700) {
      fixedAliases.fontWeightSemibold = w;
      sources.push({ field: "fixedAliases.fontWeightSemibold", value: w, from: weightSemiboldMatch[0].substring(0, 60) });
    }
  }

  // ── Phase 6: Border radius ──
  // Standard: border-radius: 8px
  const radiusMatch = text.match(/(?:border[- ]?radius|corner[- ]?radius)[:\s]*(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\s*px/i);
  if (radiusMatch) {
    seed.borderRadius = parseInt(radiusMatch[1], 10);
    sources.push({ field: "seed.borderRadius", value: `${seed.borderRadius}px`, from: radiusMatch[0].substring(0, 60) });
  }
  // Fallback: "`rounded-xl` (12px)" or "rounded-lg (8px)" in Buttons/Cards context
  if (!seed.borderRadius) {
    const radii = [];
    const rPat = /rounded-(?:sm|md|lg|xl|2xl|3xl)`?\s*\((\d{1,2})\s*px\)/gi;
    let rm;
    while ((rm = rPat.exec(text)) !== null) {
      radii.push(parseInt(rm[1], 10));
    }
    if (radii.length > 0) {
      // Use the most common or median value
      radii.sort((a, b) => a - b);
      seed.borderRadius = radii[Math.floor(radii.length / 2)];
      sources.push({ field: "seed.borderRadius", value: `${seed.borderRadius}px`, from: `median of ${radii.join(",")}px values` });
    }
  }

  // ── Phase 7: Spacing ──
  const spacingMatch = text.match(/(?:base\s+unit|spacing\s+unit|size\s+unit)[:\s]*(\d{1,2})\s*px/i);
  if (spacingMatch) {
    seed.sizeUnit = parseInt(spacingMatch[1], 10);
    sources.push({ field: "seed.sizeUnit", value: `${seed.sizeUnit}px`, from: spacingMatch[0].substring(0, 60) });
  }

  // ── Phase 8: Custom tier/product colors (strict) ──
  // Only match explicit named product tiers, not generic "accent" mentions
  const tierPattern = /(?:tier|product\s*line|brand\s*tier)\b[^#\n]*?(#[0-9a-fA-F]{6})/gi;
  let tierMatch;
  let tierIndex = 1;
  while ((tierMatch = tierPattern.exec(text)) !== null && tierIndex <= 5) {
    const key = `chart${tierIndex}`;
    if (!customSeeds[key]) {
      customSeeds[key] = tierMatch[1];
      sources.push({ field: `customSeeds.${key}`, value: tierMatch[1], from: tierMatch[0].substring(0, 60) });
      tierIndex++;
    }
  }

  return { seed, seedDark, fixedAliases, customSeeds, sources };
}

function doTheme(promptFile) {
  if (!promptFile) {
    console.error("❌ 请指定 Design Prompt 文件路径\n");
    console.log("  用法: anchor theme <prompt-file.md>\n");
    console.log("  示例: anchor theme airbnb-design.md");
    process.exit(1);
  }

  const promptPath = resolve(process.cwd(), promptFile);
  if (!existsSync(promptPath)) {
    console.error(`❌ 文件不存在: ${promptPath}`);
    process.exit(1);
  }

  const promptText = readFileSync(promptPath, "utf8");

  console.log(`
╔══════════════════════════════════════════╗
║      Design-anchor Theme — Theme Extraction Mode        ║
║  从 Design Prompt 提取 Token 注入流水线   ║
╚══════════════════════════════════════════╝
`);
  console.log(`  📎 读取 Design Prompt: ${promptFile} (${promptText.length.toLocaleString()} 字)\n`);

  // 1. 提取 token
  const extracted = extractTokensFromPrompt(promptText);

  if (!extracted.sources.length) {
    console.log("  ⚠️  未能从 prompt 中提取到任何 token 值。");
    console.log("  请确保 prompt 中包含带 #hex 色值的颜色描述、font-size、border-radius 等数值信息。\n");
    process.exit(1);
  }

  console.log("  🎨 提取到的 Token：");
  for (const s of extracted.sources) {
    console.log(`     ${s.field.padEnd(30)} ${String(s.value).padEnd(12)} (from "${s.from}")`);
  }
  console.log("");

  // 2. 找到 tokens.json 并合并
  const projectRoot = process.cwd();
  const anchorDir = join(projectRoot, DEFAULT_ANCHOR_DIR);
  ensureProjectTokenSource(projectRoot, anchorDir);
  const tokensPath = projectTokenPaths(anchorDir).tokensPath;

  if (!existsSync(tokensPath)) {
    console.log("  ⚠️  未找到 tokens.json，请先运行 anchor init 或 anchor start\n");
    console.log("  将提取结果输出为 JSON 供手动合并：\n");
    console.log(JSON.stringify({ seed: extracted.seed, seedDark: extracted.seedDark, fixedAliases: extracted.fixedAliases }, null, 2));
    process.exit(1);
  }

  const proposed = {
    seed: extracted.seed,
    seedDark: extracted.seedDark,
    customSeeds: extracted.customSeeds,
    fixedAliases: extracted.fixedAliases,
  };
  const applyResult = applyTokenExtraction(tokensPath, proposed, { syncCwd: anchorDir });
  console.log(`  ✅ tokens.json 已更新（${applyResult.mergedCount} 个值合并）`);
  if (applyResult.syncOk) {
    console.log("  ✅ design-tokens.generated.css 已重新生成");
  } else {
    console.log(`  ⚠️  CSS 生成失败（可手动运行 npm run sync:tokens）${applyResult.syncError ? ": " + applyResult.syncError.split("\n")[0] : ""}`);
  }

  // 4. 生成风格分工规则
  const rulesDir = join(projectRoot, ".cursor/rules");
  mkdirSync(rulesDir, { recursive: true });

  const themeRule = `---
description: Design Prompt 风格分工 — AI 必须遵守的风格与组件边界
alwaysApply: true
---

# 风格 × 组件分工

## 风格来源（Design Prompt）

本项目的视觉风格基于用户提供的 Design Prompt（见 design-prompt.md）。
AI 在实现页面时应参考该文件的：
- 视觉氛围与品牌调性描述
- 特定的阴影、渐变、动画细节
- 布局原则与响应式断点
- Do's and Don'ts 中的视觉规则

## Component Source (Design-anchor)

All UI components must use the Design-anchor component library（见 anchor.mdc 中的场景→组件速查表）。
Token 值（颜色、间距、圆角、字重）已从 prompt 提取写入 tokens.json，
通过 Tailwind 语义类（\`bg-primary\`, \`text-destructive\`, \`rounded-md\` 等）引用。

## 已提取的 Token 映射

${extracted.sources.map(s => `- \`${s.field}\` = \`${s.value}\``).join("\n")}

## 禁止

- ❌ 从 Design Prompt 中手抄 hex 色值到代码（必须用 Tailwind token 类）
- ❌ 从 Design Prompt 中手抄 px 间距到代码（必须用 spacing scale）
- ❌ Ignoring Design-anchor components而按 prompt 描述从零构建组件
- ❌ 在代码中写 \`style={{ color: '#ff385c' }}\` 等内联样式

## 正确做法

- ✅ 用 \`bg-primary\` 代替 \`bg-[#ff385c]\`
- ✅ 用 \`text-foreground\` 代替 \`text-[#222222]\`
- ✅ 用 \`rounded-md\` 代替 \`rounded-[14px]\`
- ✅ Using Design-anchor Button 组件代替按 prompt 手写按钮
`;

  writeFileSync(join(rulesDir, "anchor-theme.mdc"), themeRule);
  console.log("  ✅ .cursor/rules/anchor-theme.mdc 已生成");

  // 5. 保存原始 prompt
  const promptDst = existsSync(anchorDir)
    ? join(anchorDir, "design-prompt.md")
    : join(projectRoot, "design-prompt.md");
  writeFileSync(promptDst, promptText);
  console.log(`  ✅ ${relative(projectRoot, promptDst)} 已保存`);

  console.log(`
✅ 主题提取完成！

下一步：
  • npx design-anchor dev    — 在 Anchor Portal 中预览新主题
  • 打开 Cursor，AI 将使用提取后的 token + Design-anchor components
  • 视觉氛围细节参考 design-prompt.md
`);
}

/* ─── screenshot（打印 AI prompt + 引导，不调任何 LLM；AI 自己用 MCP 写 tokens.json） ─── */

function findTokensPath() {
  const projectRoot = process.cwd();
  const anchorDir = join(projectRoot, DEFAULT_ANCHOR_DIR);
  const paths = resolveTokenPaths(anchorDir, { requireExisting: true });
  return {
    tokensPath: existsSync(paths.tokensPath) ? paths.tokensPath : null,
    projectRoot,
  };
}

function doScreenshot(imageArg) {
  const { tokensPath, projectRoot } = findTokensPath();
  const tokensRel = tokensPath ? relative(projectRoot, tokensPath) : null;

  console.log(`
${ANSI.bold}📷 Design-anchor — Screenshot → Token${ANSI.reset}
${ANSI.gray}用你自己的 AI 工具读图，AI 通过 MCP 直接改 tokens.json${ANSI.reset}
`);

  if (tokensRel) {
    console.log(`  ${ANSI.gray}tokens.json:${ANSI.reset} ${tokensRel}`);
  } else {
    console.log(`  ${ANSI.yellow}⚠ 未找到 tokens.json — 请先在项目根目录运行此命令${ANSI.reset}`);
  }
  if (imageArg) {
    console.log(`  ${ANSI.gray}截图:${ANSI.reset} ${imageArg}`);
  }
  console.log("");

  console.log(`${ANSI.bold}操作步骤${ANSI.reset}\n`);
  console.log(`  ${ANSI.cyan}1.${ANSI.reset} 打开你的 AI 工具（Cursor / Claude Code / Copilot / ChatGPT / …）`);
  console.log(`     ${ANSI.gray}确保它已加载本项目的 .mcp.json（Cursor / Claude Code 默认会加载）${ANSI.reset}`);
  console.log(`  ${ANSI.cyan}2.${ANSI.reset} 把截图拖进对话`);
  console.log(`  ${ANSI.cyan}3.${ANSI.reset} 复制下面这段 prompt 一起发过去`);
  console.log(`  ${ANSI.cyan}4.${ANSI.reset} AI 完成后，回到 Portal 点 ${ANSI.bold}Reload tokens${ANSI.reset}（或刷新页面）\n`);

  const divider = `${ANSI.gray}${"─".repeat(64)}${ANSI.reset}`;
  console.log(divider);
  console.log(SCREENSHOT_PROMPT);
  console.log(divider);
  console.log("");
  console.log(`${ANSI.gray}提示：截图越精简、越聚焦关键区域（按钮 / 卡片 / 文字），识别越稳。${ANSI.reset}`);
  console.log("");
}

/* ─── upgrade ─── */

function doUpgrade(targetArg) {
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);
  const projectRoot = resolve(target, "..");

  if (!existsSync(join(target, "package.json"))) {
    console.error(`❌ 目标目录不存在，请先运行: anchor init`);
    process.exit(1);
  }

  const parentPkg = readPkgJson(PKG_ROOT);
  const kitVersion = parentPkg.version || "0.0.0";
  const oldManifest = readManifest(target);

  console.log(`\n⬆️  升级 kit → ${target}`);
  console.log(`   新版本: ${kitVersion}${oldManifest ? ` (旧版本: ${oldManifest.kitVersion})` : " (无旧 manifest)"}\n`);

  ensureProjectComponentSource(projectRoot, target);
  ensureProjectSupportSource(projectRoot);
  const kitFiles = collectKitFiles(target, projectRoot);
  const oldFiles = oldManifest?.files ?? {};
  const stats = { added: 0, updated: 0, skipped: 0, unchanged: 0 };
  const newFiles = {};

  for (const entry of kitFiles) {
    const rel = entry.key;
    const localDst = entry.dst;
    const kitContent = managedFileContent(entry);
    const kitHash = contentHash(kitContent);
    const oldEntry = oldFiles[rel];

    if (!existsSync(localDst)) {
      writeManagedFile(entry);
      newFiles[rel] = { kitHash, status: "new" };
      stats.added++;
      console.log(`  ➕ 新增: ${rel}`);
      continue;
    }

    const localHash = fileHash(localDst);

    if ((oldEntry && localHash === oldEntry.kitHash) || (!oldEntry && localHash === kitHash)) {
      writeManagedFile(entry);
      newFiles[rel] = { kitHash, status: "unchanged" };
      if (oldEntry && kitHash !== oldEntry.kitHash) {
        stats.updated++;
        console.log(`  🔄 已更新: ${rel}`);
      } else {
        stats.unchanged++;
      }
      continue;
    }

    newFiles[rel] = { kitHash: oldEntry?.kitHash ?? localHash, status: "modified" };
    stats.skipped++;
    console.log(`  ⏭️  跳过（已修改）: ${rel}`);
  }

  const manifest = {
    kitPackage: "design-anchor",
    kitVersion,
    syncedAt: new Date().toISOString(),
    referencePolicy: REFERENCE_POLICY,
    files: newFiles,
  };
  writeManifest(target, manifest);
  writeKitStatus(target, manifest);

  // 重新生成 index.ts 以包含新增组件
  generateIndex(target);
  writeAnchorTsconfig(target);

  // 老项目升级后也要跟随新的 token 真源策略：
  // 项目根 src/design-tokens/tokens.json 是运行时唯一真源，.anchor 只保留模板/算法/Portal。
  ensureProjectTokenSource(projectRoot, target);
  ensureProjectTokenCss(projectRoot, target);
  patchGlobalsCss(projectRoot, target);

  console.log(`\n✅ 升级完成`);
  console.log(`   新增: ${stats.added}  更新: ${stats.updated}  跳过: ${stats.skipped}  不变: ${stats.unchanged}\n`);
  if (stats.skipped > 0) {
    console.log("   ⚠️  跳过的文件为用户已修改内容，不会被覆盖。\n      如需强制更新，请手动从 kit 拷贝或删除本地文件后重新 upgrade。\n");
  }
}

/* ─── start（设计师一键启动） ─── */

function doStart(targetArg) {
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);

  doInit(targetArg);
  const projectRoot = resolve(target, "..");
  const parentPkg = readPkgJson(PKG_ROOT);

  installProjectDependenciesIfNeeded(projectRoot, parentPkg);

  if (!existsSync(join(target, "node_modules"))) {
    console.log("\n  📥 安装 Anchor Portal 工具链（首次启动，约 1-2 分钟）…\n");
    try {
      execSync("npm install --loglevel=error", { cwd: target, stdio: "inherit" });
    } catch {
      console.error("❌ Anchor Portal 工具链安装失败");
      process.exit(1);
    }
  }

  doDev(targetArg);
}

/* ─── dev ─── */

/** Stale Vite caches occasionally produce 404s on /@fs assets after dependency upgrades. */
function clearPortalCache(target) {
  const dirs = [
    join("node_modules", ".vite"),
    join("node_modules", ".vite-anchor-portal"),
    join("node_modules", ".vite-storybook-anchor"), // legacy
    join("node_modules", ".cache", "storybook"), // legacy
  ];
  for (const rel of dirs) {
    const p = join(target, rel);
    if (!existsSync(p)) continue;
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function waitForPort(port, host, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    function tryConnect() {
      if (Date.now() > deadline) {
        reject(new Error(`端口 ${port} 超时未就绪`));
        return;
      }
      const sock = createConnection({ port, host }, () => {
        sock.destroy();
        resolve();
      });
      sock.on("error", () => {
        setTimeout(tryConnect, 500);
      });
    }

    tryConnect();
  });
}

function openUrl(url) {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  spawn(cmd, [url], { shell: true, stdio: "ignore", detached: true }).unref();
}

function normalizePortalRoute(routeArg) {
  if (!routeArg) return PORTAL_PATH;
  const key = String(routeArg).replace(/^[-]+/, "").trim();
  if (!key) return PORTAL_PATH;
  if (key.startsWith("/#") || key.startsWith("#")) return key.startsWith("/") ? key : `/${key}`;
  return PORTAL_ROUTE_MAP[key] || PORTAL_ROUTE_MAP[key.toLowerCase()] || PORTAL_PATH;
}

function splitPortalArgs(args) {
  let targetArg = null;
  let routeArg = null;
  for (const arg of args) {
    if (!arg) continue;
    const normalized = String(arg).replace(/^[-]+/, "");
    const isRoute = normalized.startsWith("#")
      || normalized.startsWith("/#")
      || PORTAL_ROUTE_MAP[normalized]
      || PORTAL_ROUTE_MAP[normalized.toLowerCase()];
    if (isRoute && !routeArg) routeArg = normalized;
    else if (!targetArg) targetArg = arg;
  }
  return { targetArg, routeArg };
}

function doPortal(args) {
  const { targetArg, routeArg } = splitPortalArgs(args);
  doDev(targetArg || DEFAULT_ANCHOR_DIR, routeArg);
}

function doDev(targetArg, routeArg) {
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);

  const portalConfig = join(target, "src/anchor-portal/vite.config.ts");
  if (!existsSync(portalConfig)) {
    console.error(`❌ 未找到 anchor-portal 配置，请先运行: anchor init ${targetArg || DEFAULT_ANCHOR_DIR}`);
    process.exit(1);
  }
  const projectRoot = resolve(target, "..");
  ensureProjectTokenSource(projectRoot, target);
  ensureProjectTokenCss(projectRoot, target);
  patchGlobalsCss(projectRoot, target);
  assertProjectDependenciesInstalled(projectRoot, readPkgJson(PKG_ROOT));

  const port = DEFAULT_PORT;
  const portalPath = normalizePortalRoute(routeArg);
  const portalUrl = `http://localhost:${port}${portalPath}`;

  console.log(`
╔══════════════════════════════════════════╗
║         Design-anchor Design Portal          ║
║     AI 组件治理平台 · 设计师工作台        ║
╚══════════════════════════════════════════╝
`);
  console.log(`  📂 Anchor 控制面: ${target}`);
  console.log(`  🧩 组件源码: ${join(projectRoot, DEFAULT_COMPONENTS_REL)}`);
  console.log(`  🌐 地址:   http://localhost:${port}`);
  console.log(`  🎨 Portal: ${portalUrl}`);
  console.log(`\n  启动中…（首次编译约 5–10 秒）\n`);

  clearPortalCache(target);

  const viteCli = join(target, "node_modules", ".bin", "vite");
  if (!existsSync(viteCli)) {
    console.error(`❌ 未找到 Vite，请在目录下执行: cd "${target}" && npm install`);
    process.exit(1);
  }

  const child = spawn(
    process.execPath,
    [viteCli, "--config", "src/anchor-portal/vite.config.ts", "--port", String(port), "--strictPort", "false"],
    {
      cwd: target,
      stdio: "inherit",
      env: { ...process.env, ANCHOR_TOKEN_ROOT: projectRoot },
    },
  );

  waitForPort(port, "127.0.0.1", 90_000)
    .then(() => {
      console.log(`  ✅ 就绪！正在打开浏览器…\n`);
      openUrl(portalUrl);
    })
    .catch((err) => {
      console.warn(`  ⚠️  ${err.message}`);
      console.warn(`  请手动打开: ${portalUrl}\n`);
    });

  child.on("exit", (code) => process.exit(code ?? 0));
}

/* ─── mcp ─── */

function doMcp(targetArg) {
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);
  const projectRoot = resolve(target, "..");
  ensureProjectTokenSource(projectRoot, target);

  if (!existsSync(projectTokenPaths(target).tokensPath)) {
    console.error(`❌ 未找到 tokens.json，请先运行: anchor init ${targetArg || DEFAULT_ANCHOR_DIR}`);
    process.exit(1);
  }

  console.log(`\n🔌 启动 MCP Server → ${target}\n`);

  const mcpEntry = join(PKG_ROOT, "bin", "anchor-mcp.mjs");
  if (!existsSync(mcpEntry)) {
    console.error("❌ MCP Server 尚未实现，即将支持");
    process.exit(1);
  }

  const child = spawn("node", [mcpEntry, target], {
    stdio: "inherit",
    env: { ...process.env, ANCHOR_TOKEN_ROOT: projectRoot },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

/* ─── sync ─── */

function doSync(targetArg) {
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);

  if (!existsSync(join(target, "src/anchor/schema/components"))) {
    console.error(`❌ 未找到 schema 目录，请先运行: anchor init ${targetArg || DEFAULT_ANCHOR_DIR}`);
    process.exit(1);
  }
  const projectRoot = resolve(target, "..");
  ensureProjectTokenSource(projectRoot, target);

  console.log(`\n🔄 同步 schema → rules + tailwind → ${target}\n`);

  const syncScript = join(PKG_ROOT, "scripts/sync-from-schema.mjs");
  const localSync = join(target, "scripts/sync-from-schema.mjs");
  const script = existsSync(localSync) ? localSync : syncScript;

  try {
    execSync(`node "${script}"`, { cwd: target, stdio: "inherit" });

    execSync(`node "${join(existsSync(join(target, "scripts/emit-design-tokens-css.mjs")) ? target : PKG_ROOT, "scripts/emit-design-tokens-css.mjs")}"`, {
      cwd: target,
      stdio: "inherit",
      env: { ...process.env, ANCHOR_TOKEN_ROOT: projectRoot },
    });

    console.log("\n✅ 同步完成：.cursorrules + Tailwind 扩展 + 规则镜像 + CSS 变量 已更新\n");
  } catch (e) {
    console.error(`\n❌ 同步失败: ${e.message}\n`);
    process.exit(1);
  }
}

/* ─── audit ─── */

function shellQuote(value) {
  return `"${String(value).replace(/(["\\$`])/g, "\\$1")}"`;
}

function splitAuditArgs(auditArgs) {
  const args = Array.isArray(auditArgs) ? auditArgs : [auditArgs].filter(Boolean);
  let targetArg = null;
  const passArgs = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--scope" || arg === "--max-issues") {
      passArgs.push(arg);
      if (args[i + 1] != null) {
        passArgs.push(args[i + 1]);
        i += 1;
      }
      continue;
    }
    if (arg.startsWith("-")) {
      passArgs.push(arg);
      continue;
    }
    targetArg = arg;
  }

  return { targetArg, passArgs };
}

function doAudit(auditArgs) {
  const { targetArg, passArgs } = splitAuditArgs(auditArgs);
  const target = resolve(process.cwd(), targetArg || DEFAULT_ANCHOR_DIR);

  if (!existsSync(join(target, "src/anchor"))) {
    console.error(`❌ ❌ Directory not found，请先运行: anchor init ${targetArg || DEFAULT_ANCHOR_DIR}`);
    process.exit(1);
  }

  console.log(`\n🔍 合规审计 → ${target}\n`);

  const auditScript = join(PKG_ROOT, "scripts/anchor-audit.mjs");
  const localAudit = join(target, "scripts/anchor-audit.mjs");
  const script = existsSync(localAudit) ? localAudit : auditScript;

  try {
    const extraArgs = passArgs.map(shellQuote).join(" ");
    execSync(`node ${shellQuote(script)}${extraArgs ? ` ${extraArgs}` : ""}`, { cwd: target, stdio: "inherit" });
  } catch (e) {
    process.exit(e.status ?? 1);
  }
}
