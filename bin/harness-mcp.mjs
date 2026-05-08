#!/usr/bin/env node
/**
 * Harness MCP Server — 通过 stdio JSON-RPC 暴露组件库操作工具给 Cursor Agent
 *
 * 工具列表:
 *   list_components    列出所有组件
 *   read_component     读取组件源码
 *   create_component   创建新组件（生成 tsx + stories）
 *   list_tokens        列出所有 design tokens
 *   update_token       修改某个 token 的值
 *   read_file          读取组件库中任意文件
 *   write_file         写入组件库中任意文件
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");

const LIB_ROOT = resolve(process.argv[2] || ".harness");

if (!existsSync(LIB_ROOT)) {
  process.stderr.write(`错误: 目录 ${LIB_ROOT} 不存在\n`);
  process.exit(1);
}

const TOOLS = [
  {
    name: "list_components",
    description: "列出组件库中所有组件名称和文件路径",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_component",
    description: "读取指定组件的源码",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "组件文件名（如 button.tsx）" } },
      required: ["name"],
    },
  },
  {
    name: "create_component",
    description: "创建一个新的组件文件和对应的 stories 文件",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "组件名（PascalCase，如 Select）" },
        code: { type: "string", description: "组件 TSX 源码" },
        stories: { type: "string", description: "Stories 文件源码（可选）" },
      },
      required: ["name", "code"],
    },
  },
  {
    name: "list_tokens",
    description: "列出 tokens.json 中所有 design token 的 id、分类和当前值",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_token",
    description: "修改指定 token 的 light 或 dark 值",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "token id（如 primary, radius）" },
        field: { type: "string", enum: ["light", "dark"], description: "要修改的字段" },
        value: { type: "string", description: "新值" },
      },
      required: ["id", "field", "value"],
    },
  },
  {
    name: "read_file",
    description: "读取组件库中的任意文件",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "相对于组件库根目录的文件路径" } },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "写入组件库中的文件（会自动创建目录）",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "相对于组件库根目录的文件路径" },
        content: { type: "string", description: "文件内容" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_schemas",
    description: "列出所有组件规范 (ComponentSpec)：id、名称、意图、状态",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_schema",
    description: "读取指定组件规范 spec.json 的完整内容",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "spec id（如 business-data-table）或文件名（如 data-table.spec.json）" } },
      required: ["id"],
    },
  },
  {
    name: "update_schema",
    description: "更新指定组件规范 spec.json 的内容并自动触发 sync（更新 .cursorrules / Tailwind）",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "spec 文件名（如 button.spec.json）" },
        content: { type: "string", description: "完整的 JSON 内容" },
      },
      required: ["filename", "content"],
    },
  },
  {
    name: "run_audit",
    description: "运行合规审计 (harness-audit)：检测禁止的 HTML 标签和任意值 Tailwind 类",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "sync_rules",
    description: "触发 sync:harness 全量同步：spec → Tailwind 扩展 + .cursorrules + 规则镜像",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_cursorrules",
    description: "读取当前生成的 .cursorrules 内容（AI 约束文档）",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

/* ─── Tool handlers ─── */

function listComponents() {
  const result = [];
  for (const sub of ["starter", "business"]) {
    const dir = join(LIB_ROOT, "src/components", sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".tsx") && !f.includes(".stories.")) {
        result.push({ name: f.replace(/\.tsx$/, ""), path: `src/components/${sub}/${f}`, category: sub });
      }
    }
  }
  return result;
}

function readComponent(name) {
  for (const sub of ["starter", "business"]) {
    const file = join(LIB_ROOT, "src/components", sub, name.endsWith(".tsx") ? name : `${name}.tsx`);
    if (existsSync(file)) return readFileSync(file, "utf8");
  }
  throw new Error(`组件 ${name} 不存在`);
}

function createComponent(name, code, stories) {
  const dir = join(LIB_ROOT, "src/components/starter");
  mkdirSync(dir, { recursive: true });
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  writeFileSync(join(dir, `${lower}.tsx`), code);
  if (stories) {
    writeFileSync(join(dir, `${name}.stories.tsx`), stories);
  }
  return { created: [`src/components/starter/${lower}.tsx`, stories ? `src/components/starter/${name}.stories.tsx` : null].filter(Boolean) };
}

function listTokens() {
  const tokensPath = join(LIB_ROOT, "src/design-tokens/tokens.json");
  const doc = JSON.parse(readFileSync(tokensPath, "utf8"));
  return (doc.tokens || []).map((t) => ({
    id: t.id, category: t.category, light: t.light, dark: t.dark,
  }));
}

function updateToken(id, field, value) {
  const tokensPath = join(LIB_ROOT, "src/design-tokens/tokens.json");
  const doc = JSON.parse(readFileSync(tokensPath, "utf8"));
  const token = (doc.tokens || []).find((t) => t.id === id);
  if (!token) throw new Error(`token ${id} 不存在`);
  token[field] = value;
  writeFileSync(tokensPath, JSON.stringify(doc, null, 2) + "\n");
  return { id, field, value, ok: true };
}

function readFile(relPath) {
  const abs = resolve(LIB_ROOT, relPath);
  if (!abs.startsWith(LIB_ROOT)) throw new Error("路径越界");
  return readFileSync(abs, "utf8");
}

function writeFile(relPath, content) {
  const abs = resolve(LIB_ROOT, relPath);
  if (!abs.startsWith(LIB_ROOT)) throw new Error("路径越界");
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, content);
  return { path: relPath, ok: true };
}

/* ─── Schema governance handlers ─── */

function listSchemas() {
  const specDir = join(LIB_ROOT, "src/harness/schema/components");
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
  const specDir = join(LIB_ROOT, "src/harness/schema/components");
  if (!existsSync(specDir)) throw new Error("schema 目录不存在");
  const files = readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
  for (const f of files) {
    const content = readFileSync(join(specDir, f), "utf8");
    const spec = JSON.parse(content);
    if (spec.id === idOrFilename || f === idOrFilename) return content;
  }
  throw new Error(`未找到 spec: ${idOrFilename}`);
}

function updateSchema(filename, content) {
  if (!/^[\w.-]+\.spec\.json$/.test(filename)) throw new Error("文件名格式不合法");
  const specDir = join(LIB_ROOT, "src/harness/schema/components");
  mkdirSync(specDir, { recursive: true });
  const abs = join(specDir, filename);
  JSON.parse(content);
  writeFileSync(abs, JSON.stringify(JSON.parse(content), null, 2) + "\n");
  const syncResult = runSyncRules();
  return { filename, ok: true, sync: syncResult };
}

function runAudit() {
  const auditScript = join(PKG_ROOT, "scripts/harness-audit.mjs");
  if (!existsSync(auditScript)) {
    const localAudit = join(LIB_ROOT, "scripts/harness-audit.mjs");
    if (!existsSync(localAudit)) throw new Error("harness-audit.mjs 不存在");
    try {
      const output = execSync(`node "${localAudit}"`, { cwd: LIB_ROOT, encoding: "utf8", timeout: 30000 });
      return { passed: true, output };
    } catch (e) {
      return { passed: false, output: e.stdout || e.stderr || e.message };
    }
  }
  try {
    const output = execSync(`node "${auditScript}"`, { cwd: LIB_ROOT, encoding: "utf8", timeout: 30000 });
    return { passed: true, output };
  } catch (e) {
    return { passed: false, output: e.stdout || e.stderr || e.message };
  }
}

function runSyncRules() {
  const syncScript = join(PKG_ROOT, "scripts/sync-from-schema.mjs");
  if (!existsSync(syncScript)) {
    try {
      execSync("npm run sync:harness", { cwd: LIB_ROOT, encoding: "utf8", timeout: 30000 });
      return "sync 完成";
    } catch (e) {
      return `sync 失败: ${e.message}`;
    }
  }
  try {
    const output = execSync(`node "${syncScript}"`, { cwd: LIB_ROOT, encoding: "utf8", timeout: 30000 });
    return output.trim();
  } catch (e) {
    return `sync 失败: ${e.stdout || e.stderr || e.message}`;
  }
}

function getCursorrules() {
  const p = join(LIB_ROOT, ".cursorrules");
  if (!existsSync(p)) throw new Error(".cursorrules 不存在，请先运行 sync_rules");
  return readFileSync(p, "utf8");
}

function handleToolCall(name, args) {
  switch (name) {
    case "list_components": return listComponents();
    case "read_component": return readComponent(args.name);
    case "create_component": return createComponent(args.name, args.code, args.stories);
    case "list_tokens": return listTokens();
    case "update_token": return updateToken(args.id, args.field, args.value);
    case "read_file": return readFile(args.path);
    case "write_file": return writeFile(args.path, args.content);
    case "list_schemas": return listSchemas();
    case "read_schema": return readSchema(args.id);
    case "update_schema": return updateSchema(args.filename, args.content);
    case "run_audit": return runAudit();
    case "sync_rules": return runSyncRules();
    case "get_cursorrules": return getCursorrules();
    default: throw new Error(`未知工具: ${name}`);
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
      serverInfo: { name: "harness-mcp", version: "0.1.0" },
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
        content: [{ type: "text", text: `错误: ${e.message}` }],
        isError: true,
      }));
    }
  }

  if (id != null) {
    send(makeError(id, -32601, `Method not found: ${method}`));
  }
}

/* ─── 启动 ─── */

process.stderr.write(`🔌 Harness MCP Server 已启动 → ${LIB_ROOT}\n`);

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
      process.stderr.write(`解析错误: ${e.message}\n`);
    }
  }
});
