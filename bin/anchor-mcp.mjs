#!/usr/bin/env node
/**
 * Design-anchor MCP Server — Exposes Design-anchor operations to AI agents via stdio JSON-RPC
 *
 * Tools:
 *   list_components    List all components
 *   read_component     Read component source code
 *   create_component   Create a new component (generates tsx + demo)
 *   list_tokens        List all design tokens
 *   update_token       Modify a token value
 *   read_file          Read a file in the Anchor control plane or visible component source
 *   write_file         Write a file in the Anchor control plane or visible component source
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { basename, join, resolve, relative, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { projectTokenPaths } from "../scripts/lib/token-source.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");

const LIB_ROOT = resolve(process.argv[2] || ".anchor");
const PROJECT_ROOT = basename(LIB_ROOT) === ".anchor" ? resolve(LIB_ROOT, "..") : LIB_ROOT;
const TOKEN_PATHS = projectTokenPaths(LIB_ROOT);
const COMPONENTS_REL = "src/components/anchor-ui";
const FALLBACK_COMPONENTS_REL = "src/components/base";
const DEMOS_REL = "src/anchor/component-demos/base";
const COMPONENT_IMPORT_BASE = "@design";

if (!existsSync(LIB_ROOT)) {
  process.stderr.write(`Error: directory ${LIB_ROOT} does not exist\n`);
  process.exit(1);
}

const TOOLS = [
  {
    name: "list_components",
    description: "List all component names and file paths in the visible component source",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_component",
    description: "Read the source code of a specified component",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Component filename (e.g. button.tsx)" } },
      required: ["name"],
    },
  },
  {
    name: "create_component",
    description: "Create a new component file and its corresponding demo file",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Component name (PascalCase, e.g. Select)" },
        code: { type: "string", description: "Component TSX source code" },
        demo: { type: "string", description: "Demo file source code (optional)" },
        stories: { type: "string", description: "Deprecated alias for demo source code" },
      },
      required: ["name", "code"],
    },
  },
  {
    name: "list_tokens",
    description: "List all design token ids, categories, and current values in tokens.json",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_token",
    description: "Modify a seed token value in tokens.json. light maps to seed, dark maps to seedDark.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "seed token id (e.g. colorPrimary, borderRadius, sizeUnit)" },
        field: {
          type: "string",
          enum: ["seed", "seedDark", "light", "dark", "customSeeds"],
          description: "Field to modify. Use light/seed for normal seed values and dark/seedDark for dark seed values.",
        },
        value: { type: "string", description: "New value" },
      },
      required: ["id", "field", "value"],
    },
  },
  {
    name: "read_file",
    description: "Read a file in the Anchor control plane or visible component source",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "File path relative to .anchor or the project root" } },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write a file in the Anchor control plane or visible component source (directories are created automatically)",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to .anchor or the project root" },
        content: { type: "string", description: "File content" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_schemas",
    description: "List all component specs (ComponentSpec): id, name, intent, status",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_schema",
    description: "Read the full content of a specified component spec.json",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "spec id (e.g. business-data-table) or filename (e.g. data-table.spec.json)" } },
      required: ["id"],
    },
  },
  {
    name: "update_schema",
    description: "Update the content of a specified component spec.json and auto-trigger sync (updates .cursorrules / Tailwind)",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "spec filename (e.g. button.spec.json)" },
        content: { type: "string", description: "Complete JSON content" },
      },
      required: ["filename", "content"],
    },
  },
  {
    name: "run_audit",
    description: "Run compliance audit (anchor-audit): detect forbidden HTML tags and arbitrary-value Tailwind classes",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "run_sync_rules",
    description: "Trigger sync:anchor full sync: spec -> Tailwind extensions + .cursorrules + rule mirror",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_cursorrules",
    description: "Read the current generated .cursorrules content (AI constraint document)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

/* ─── Tool handlers ─── */

function componentDir() {
  const visible = join(PROJECT_ROOT, COMPONENTS_REL);
  if (existsSync(visible)) return { dir: visible, root: PROJECT_ROOT, rel: COMPONENTS_REL };
  return { dir: join(LIB_ROOT, FALLBACK_COMPONENTS_REL), root: LIB_ROOT, rel: FALLBACK_COMPONENTS_REL };
}

function demoDir() {
  const preferred = join(LIB_ROOT, DEMOS_REL);
  if (existsSync(preferred) || basename(LIB_ROOT) === ".anchor") {
    return { dir: preferred, rel: DEMOS_REL };
  }
  return { dir: join(LIB_ROOT, FALLBACK_COMPONENTS_REL), rel: FALLBACK_COMPONENTS_REL };
}

function toKebabName(name) {
  return String(name)
    .replace(/\.[tj]sx?$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

function toPascalName(name) {
  return String(name)
    .replace(/\.[tj]sx?$/, "")
    .replace(/(^|[-_\s])(\w)/g, (_m, _sep, c) => c.toUpperCase());
}

function rewriteComponentImports(source) {
  return String(source)
    .replaceAll("@/components/base", "@/components/anchor-ui")
    .replaceAll("src/components/base", COMPONENTS_REL);
}

function defaultDemoSource(name, fileName) {
  const pascal = toPascalName(name);
  const kebab = fileName.replace(/\.tsx$/, "");
  return [
    `import type { Meta, StoryObj } from "@/anchor-portal/argTypes-types";`,
    `import { storyAnchorCompliance } from "@/design-tokens/story-preview-shell";`,
    `import { autoClassControls } from "@/design-tokens/tw-class-audit";`,
    `import componentSrc from "${COMPONENT_IMPORT_BASE}/${kebab}.tsx?raw";`,
    `import { ${pascal} } from "${COMPONENT_IMPORT_BASE}/${kebab}";`,
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
}

function listComponents() {
  const result = [];
  const source = componentDir();
  const dir = source.dir;
  if (!existsSync(dir)) return result;
  walkFiles(dir, (file) => {
    const rel = relative(dir, file).split(/[\\/]/).join("/");
    if (!rel.endsWith(".tsx")) return;
    if (rel.includes(".demo.") || rel.includes(".stories.")) return;
    result.push({ name: rel.replace(/\.tsx$/, ""), path: `${source.rel}/${rel}` });
  });
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function walkFiles(dir, cb) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, cb);
    else cb(p);
  }
}

function readComponent(name) {
  const baseDir = componentDir().dir;
  const file = resolve(baseDir, name.endsWith(".tsx") ? name : `${name}.tsx`);
  assertInside(baseDir, file);
  if (existsSync(file)) return readFileSync(file, "utf8");
  throw new Error(`Component ${name} does not exist`);
}

function createComponent(name, code, demo) {
  const source = componentDir();
  const dir = source.dir;
  mkdirSync(dir, { recursive: true });
  const fileBase = toKebabName(name);
  const pascal = toPascalName(name);
  const componentPath = join(dir, `${fileBase}.tsx`);
  writeFileSync(componentPath, rewriteComponentImports(code));

  const demos = demoDir();
  mkdirSync(demos.dir, { recursive: true });
  const demoPath = join(demos.dir, `${pascal}.demo.tsx`);
  writeFileSync(demoPath, demo ? rewriteComponentImports(demo) : defaultDemoSource(name, `${fileBase}.tsx`));

  return {
    created: [
      relative(source.root, componentPath).split(/[\\/]/).join("/"),
      relative(LIB_ROOT, demoPath).split(/[\\/]/).join("/"),
    ],
  };
}

function listTokens() {
  const tokensPath = TOKEN_PATHS.tokensPath;
  const doc = JSON.parse(readFileSync(tokensPath, "utf8"));
  if (doc.seed && typeof doc.seed === "object") {
    const ids = new Set([
      ...Object.keys(doc.seed || {}),
      ...Object.keys(doc.seedDark || {}),
      ...Object.keys(doc.customSeeds || {}),
    ]);
    const tokens = [...ids].sort().map((id) => ({
      id,
      category: id in (doc.customSeeds || {}) ? "customSeeds" : "seed",
      seed: doc.seed?.[id],
      seedDark: doc.seedDark?.[id],
      customSeed: doc.customSeeds?.[id],
    }));
    return {
      version: doc.version ?? 2,
      tokens,
      mapOverrides: doc.mapOverrides ?? {},
    };
  }
  return {
    version: doc.version ?? 1,
    tokens: (doc.tokens || []).map((t) => ({
      id: t.id,
      category: t.category,
      light: t.light,
      dark: t.dark,
    })),
  };
}

function updateToken(id, field, value) {
  const tokensPath = TOKEN_PATHS.tokensPath;
  const doc = JSON.parse(readFileSync(tokensPath, "utf8"));
  if (doc.seed && typeof doc.seed === "object") {
    const section = normalizeTokenField(field);
    if (!["seed", "seedDark", "customSeeds"].includes(section)) {
      throw new Error(`Unsupported token field for v2 tokens: ${field}`);
    }
    if (!doc[section] || typeof doc[section] !== "object") doc[section] = {};
    if (section !== "customSeeds" && !(id in doc.seed) && !(id in (doc.seedDark || {}))) {
      throw new Error(`seed token ${id} does not exist`);
    }
    doc[section][id] = value;
    writeFileSync(tokensPath, JSON.stringify(doc, null, 2) + "\n");
    const sync = runTokenSync();
    return { id, field: section, value, ok: true, sync };
  }
  const token = (doc.tokens || []).find((t) => t.id === id);
  if (!token) throw new Error(`token ${id} does not exist`);
  token[field] = value;
  writeFileSync(tokensPath, JSON.stringify(doc, null, 2) + "\n");
  return { id, field, value, ok: true };
}

function normalizeTokenField(field) {
  if (field === "light") return "seed";
  if (field === "dark") return "seedDark";
  return field || "seed";
}

function runTokenSync() {
  try {
    const output = execSync("npm run sync:tokens", {
      cwd: LIB_ROOT,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, ANCHOR_TOKEN_ROOT: TOKEN_PATHS.root },
    });
    return output.trim();
  } catch (e) {
    return `sync:tokens failed: ${e.stdout || e.stderr || e.message}`;
  }
}

function resolveManagedPath(relPath) {
  const requested = String(relPath || "");
  const rel = requested.replace(/\\/g, "/").replace(/^\.\//, "");
  const candidates = [];
  if (rel.startsWith(`${COMPONENTS_REL}/`) || rel === COMPONENTS_REL) {
    candidates.push({ root: PROJECT_ROOT, abs: resolve(PROJECT_ROOT, rel) });
  }
  if (rel.startsWith("src/design-tokens/") || rel.startsWith("src/styles/")) {
    candidates.push({ root: PROJECT_ROOT, abs: resolve(PROJECT_ROOT, rel) });
  }
  candidates.push({ root: LIB_ROOT, abs: resolve(LIB_ROOT, requested) });
  const picked = candidates[0];
  assertInside(picked.root, picked.abs);
  return picked;
}

function readFile(relPath) {
  const { abs } = resolveManagedPath(relPath);
  return readFileSync(abs, "utf8");
}

function writeFile(relPath, content) {
  const { abs } = resolveManagedPath(relPath);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, content);
  return { path: relPath, ok: true };
}

function assertInside(root, absPath) {
  const rel = relative(root, absPath);
  if (rel === ".." || rel.startsWith("../") || rel.startsWith("..\\")) {
    throw new Error("Path traversal out of bounds");
  }
}

/* ─── Schema governance handlers ─── */

function listSchemas() {
  const specDir = join(LIB_ROOT, "src/anchor/schema/components");
  if (!existsSync(specDir)) return [];
  return readdirSync(specDir)
    .filter((f) => f.endsWith(".spec.json"))
    .map((f) => {
      const spec = JSON.parse(readFileSync(join(specDir, f), "utf8"));
      return {
        filename: f,
        id: spec.id,
        componentName: spec.componentName,
        intent: spec.intent,
        status: spec.meta?.status ?? "unknown",
        category: spec.meta?.category ?? "other",
      };
    });
}

function readSchema(idOrFilename) {
  const specDir = join(LIB_ROOT, "src/anchor/schema/components");
  if (!existsSync(specDir)) throw new Error("schema directory does not exist");
  const files = readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
  for (const f of files) {
    const content = readFileSync(join(specDir, f), "utf8");
    const spec = JSON.parse(content);
    if (spec.id === idOrFilename || f === idOrFilename) return content;
  }
  throw new Error(`Spec not found: ${idOrFilename}`);
}

function updateSchema(filename, content) {
  if (!/^[\w.-]+\.spec\.json$/.test(filename)) throw new Error("Invalid filename format");
  const specDir = join(LIB_ROOT, "src/anchor/schema/components");
  mkdirSync(specDir, { recursive: true });
  const abs = join(specDir, filename);
  JSON.parse(content);
  writeFileSync(abs, JSON.stringify(JSON.parse(content), null, 2) + "\n");
  const syncResult = runSyncRules();
  return { filename, ok: true, sync: syncResult };
}

function runAudit() {
  const auditScript = join(PKG_ROOT, "scripts/anchor-audit.mjs");
  if (!existsSync(auditScript)) {
    const localAudit = join(LIB_ROOT, "scripts/anchor-audit.mjs");
    if (!existsSync(localAudit)) throw new Error("anchor-audit.mjs does not exist");
    try {
      const output = execSync(`node "${localAudit}"`, {
        cwd: LIB_ROOT,
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, ANCHOR_TOKEN_ROOT: TOKEN_PATHS.root },
      });
      return { passed: true, output };
    } catch (e) {
      return { passed: false, output: e.stdout || e.stderr || e.message };
    }
  }
  try {
    const output = execSync(`node "${auditScript}"`, {
      cwd: LIB_ROOT,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, ANCHOR_TOKEN_ROOT: TOKEN_PATHS.root },
    });
    return { passed: true, output };
  } catch (e) {
    return { passed: false, output: e.stdout || e.stderr || e.message };
  }
}

function runSyncRules() {
  try {
    const output = execSync("npm run sync:anchor", {
      cwd: LIB_ROOT,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, ANCHOR_TOKEN_ROOT: TOKEN_PATHS.root },
    });
    return output.trim();
  } catch (e) {
    const syncScript = join(PKG_ROOT, "scripts/sync-from-schema.mjs");
    if (!existsSync(syncScript)) return `sync failed: ${e.stdout || e.stderr || e.message}`;
    try {
      const output = execSync(`node "${syncScript}"`, {
        cwd: LIB_ROOT,
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, ANCHOR_TOKEN_ROOT: TOKEN_PATHS.root },
      });
      return output.trim();
    } catch (fallbackError) {
      return `sync failed: ${fallbackError.stdout || fallbackError.stderr || fallbackError.message}`;
    }
  }
}

function getCursorrules() {
  const p = join(LIB_ROOT, ".cursorrules");
  if (!existsSync(p)) throw new Error(".cursorrules does not exist, please run run_sync_rules first");
  return readFileSync(p, "utf8");
}


function handleToolCall(name, args) {
  switch (name) {
    case "list_components": return listComponents();
    case "read_component": return readComponent(args.name);
    case "create_component": return createComponent(args.name, args.code, args.demo ?? args.stories);
    case "list_tokens": return listTokens();
    case "update_token": return updateToken(args.id, args.field, args.value);
    case "read_file": return readFile(args.path);
    case "write_file": return writeFile(args.path, args.content);
    case "list_schemas": return listSchemas();
    case "read_schema": return readSchema(args.id);
    case "update_schema": return updateSchema(args.filename, args.content);
    case "run_audit": return runAudit();
    case "run_sync_rules":
    case "sync_rules":
      return runSyncRules();
    case "get_cursorrules": return getCursorrules();
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

/* ─── JSON-RPC over stdio ─── */

function send(obj) {
  const json = JSON.stringify(obj);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function makeResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function makeError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  if (method === "initialize") {
    return send(makeResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "anchor-mcp", version: "0.1.0" },
    }));
  }

  if (method === "notifications/initialized") return;

  if (method === "tools/list") {
    return send(makeResponse(id, { tools: TOOLS }));
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      const result = handleToolCall(name, args || {});
      const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      return send(makeResponse(id, {
        content: [{ type: "text", text }],
      }));
    } catch (e) {
      return send(makeResponse(id, {
        content: [{ type: "text", text: `Error: ${e.message}` }],
        isError: true,
      }));
    }
  }

  if (id != null) {
    send(makeError(id, -32601, `Method not found: ${method}`));
  }
}

/* ─── Startup ─── */

process.stderr.write(`🔌 Design-anchor MCP Server started → ${LIB_ROOT}\n`);

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;
    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) { buffer = buffer.slice(headerEnd + 4); continue; }
    const len = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break;
    const body = buffer.slice(bodyStart, bodyStart + len);
    buffer = buffer.slice(bodyStart + len);
    try {
      handleMessage(JSON.parse(body));
    } catch (e) {
      process.stderr.write(`Parse error: ${e.message}\n`);
    }
  }
});
