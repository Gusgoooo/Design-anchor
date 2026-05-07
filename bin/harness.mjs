#!/usr/bin/env node
import { resolve, join, relative, sep } from "node:path";
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createConnection } from "node:net";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");

const [, , cmd, ...rest] = process.argv;

const PORTAL_PATH = "/?path=/docs/designtoken--docs";
const DEFAULT_PORT = 6006;

const HELP = `
harness — 组件库管理工具

用法:
  harness start [目标目录]    一键启动（init + install + 打开 Portal）— 设计师推荐
  harness init  [目标目录]    在项目中初始化组件库（默认 ./harness-ui）
  harness dev   [目标目录]    启动 Storybook 并自动打开 Portal 页面
  harness mcp   [目标目录]    启动 MCP Server（供 Cursor Agent 使用）
  harness sync  [目标目录]    同步 schema → Tailwind + .cursorrules + 规则镜像
  harness audit [目标目录]    运行合规审计（检测禁止标签 + 任意值 Tailwind）
  harness help                显示帮助
`.trim();

switch (cmd) {
  case "start":
    doStart(rest[0]);
    break;
  case "init":
    doInit(rest[0]);
    break;
  case "dev":
    doDev(rest[0]);
    break;
  case "mcp":
    doMcp(rest[0]);
    break;
  case "sync":
    doSync(rest[0]);
    break;
  case "audit":
    doAudit(rest[0]);
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

/* ─── init ─── */

function doInit(targetArg) {
  const target = resolve(process.cwd(), targetArg || "harness-ui");
  console.log(`\n📦 初始化组件库到 ${target}\n`);

  if (existsSync(join(target, "package.json"))) {
    console.log("⚠️  目标目录已存在 package.json，跳过 scaffold（使用 harness dev 启动）");
    return;
  }

  mkdirSync(target, { recursive: true });

  const toCopy = [
    "src/components",
    "src/design-tokens",
    "src/styles",
    "src/lib",
    ".storybook",
    "vite-plugin-schema-api.mjs",
    "tsconfig.json",
    "tailwind.config.ts",
  ];

  for (const rel of toCopy) {
    const src = join(PKG_ROOT, rel);
    const dst = join(target, rel);
    if (!existsSync(src)) continue;
    cpSync(src, dst, { recursive: true });
    console.log(`  ✅ ${rel}`);
  }

  // 如果有 harness schema 目录也拷贝
  const schemaDir = join(PKG_ROOT, "src/harness");
  if (existsSync(schemaDir)) {
    cpSync(schemaDir, join(target, "src/harness"), { recursive: true });
    console.log("  ✅ src/harness");
  }

  // 如果有 design-portal 也拷贝
  const portalDir = join(PKG_ROOT, "src/design-portal");
  if (existsSync(portalDir)) {
    cpSync(portalDir, join(target, "src/design-portal"), { recursive: true });
    console.log("  ✅ src/design-portal");
  }

  // 拷贝 scripts
  const scriptsDir = join(PKG_ROOT, "scripts");
  if (existsSync(scriptsDir)) {
    cpSync(scriptsDir, join(target, "scripts"), { recursive: true });
    console.log("  ✅ scripts");
  }

  // 生成 package.json
  const parentPkg = readPkgJson(PKG_ROOT);
  const pkg = {
    name: "harness-ui",
    version: "0.1.0",
    private: true,
    type: "module",
    main: "src/components/index.ts",
    scripts: {
      "sync:tokens": parentPkg.scripts?.["sync:tokens"] || "node scripts/emit-design-tokens-css.mjs",
      "sync:harness": parentPkg.scripts?.["sync:harness"] || "npm run sync:tokens && node scripts/sync-from-schema.mjs",
      "harness:audit": parentPkg.scripts?.["harness:audit"] || "node scripts/harness-audit.mjs",
      storybook: "storybook dev -p 6006",
      "build-storybook": "storybook build",
      typecheck: "tsc --noEmit",
    },
    dependencies: parentPkg.dependencies || {},
    devDependencies: parentPkg.devDependencies || {},
  };
  writeFileSync(join(target, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  console.log("  ✅ package.json");

  // 生成组件入口 index.ts
  generateIndex(target);

  // 生成 Cursor 集成文件（写到用户项目根目录）
  const projectRoot = resolve(target, "..");
  generateCursorRule(projectRoot, target);
  generateCursorMcp(projectRoot, target);
  installCursorHooks(projectRoot);
  installSelfcheckRule(projectRoot);

  console.log("\n📦 scaffold 完成！\n");
  console.log("后续步骤：");
  console.log(`  cd ${targetArg || "harness-ui"}`);
  console.log("  npm install");
  console.log("  npx harness dev .");
  console.log("");
  console.log("🤖 Cursor 集成已自动配置：");
  console.log("  • .cursor/rules/harness.mdc       — 组件库约束（alwaysApply）");
  console.log("  • .cursor/rules/harness-selfcheck.mdc — 改完代码后的自检清单");
  console.log("  • .cursor/mcp.json                — MCP Server");
  console.log("  • .cursor/hooks.json              — 保存 .tsx 后自动跑 harness audit");
  console.log("  重新打开 Cursor 后 Hooks 与规则生效。\n");
}

function readPkgJson(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  } catch {
    return {};
  }
}

function generateIndex(target) {
  const compsDir = join(target, "src/components");
  if (!existsSync(compsDir)) return;

  const lines = [
    '// Auto-generated — 组件库统一入口',
    '// 使用: import { Button, Badge, ... } from "./harness-ui"',
    '',
  ];

  // starter 组件
  const starterDir = join(compsDir, "starter");
  if (existsSync(starterDir)) {
    const files = readdirSyncSafe(starterDir).filter(f => f.endsWith(".tsx") && !f.includes(".stories."));
    for (const f of files) {
      const mod = f.replace(/\.tsx$/, "");
      lines.push(`export * from "./src/components/starter/${mod}";`);
    }
  }

  // business 组件
  const bizDir = join(compsDir, "business");
  if (existsSync(bizDir)) {
    const files = readdirSyncSafe(bizDir).filter(f => f.endsWith(".tsx") && !f.includes(".stories.") && !f.includes("kitchen-sink"));
    for (const f of files) {
      const mod = f.replace(/\.tsx$/, "");
      lines.push(`export * from "./src/components/business/${mod}";`);
    }
  }

  writeFileSync(join(target, "index.ts"), lines.join("\n") + "\n");
  console.log("  ✅ index.ts（组件统一入口）");
}

function readdirSyncSafe(dir) {
  try { return readdirSync(dir); }
  catch { return []; }
}

/* ─── Cursor 集成 ─── */

function generateCursorRule(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const rulesDir = join(projectRoot, ".cursor/rules");
  mkdirSync(rulesDir, { recursive: true });

  const specDir = join(libTarget, "src/harness/schema/components");
  let specSummary = "";
  if (existsSync(specDir)) {
    const files = readdirSync(specDir).filter(f => f.endsWith(".spec.json"));
    for (const f of files) {
      try {
        const s = JSON.parse(readFileSync(join(specDir, f), "utf8"));
        specSummary += `- **${s.componentName}**: ${s.intent}\n`;
      } catch {}
    }
  }

  const rule = `---
description: Harness 组件库规范 — AI 必须遵守的组件使用约束
alwaysApply: true
---

# Harness 组件库规范

本项目使用 Harness 组件库（位于 \`${relLib}\`），所有 UI 开发必须遵守以下规范。

## 组件引用规则

1. **禁止使用原生 HTML 标签**：\`<button>\`、\`<input>\`、\`<table>\` 等，必须使用业务组件
2. **导入路径**：从 \`${relLib}\` 或 \`${relLib}/src/components/business/\` 导入
3. **禁止手写间距**：不允许 \`m-[13px]\`、\`p-[7px]\` 等任意值 Tailwind 类
4. **颜色仅用语义类**：\`bg-primary\`、\`text-muted-foreground\` 等，禁止硬编码色值

## 可用组件

${specSummary || "（运行 harness sync 后自动生成）"}

## MCP 工具

本项目配置了 Harness MCP Server，你可以通过以下工具操作组件库：

- \`list_components\` — 列出所有组件
- \`read_component\` — 读取组件源码
- \`create_component\` — 创建新组件
- \`list_schemas\` — 列出组件规范
- \`read_schema\` — 读取组件规范详情
- \`update_schema\` — 更新规范并同步 .cursorrules
- \`list_tokens\` — 列出 design tokens
- \`update_token\` — 修改 token 值
- \`run_audit\` — 运行合规审计
- \`sync_rules\` — 同步治理规则

## 常用指令示例

用户说「创建一个 Select 组件」→ 调用 \`create_component\` 工具
用户说「修改主题色」→ 调用 \`update_token\` 工具
用户说「检查代码合规性」→ 调用 \`run_audit\` 工具
`;

  writeFileSync(join(rulesDir, "harness.mdc"), rule);
  console.log("  ✅ .cursor/rules/harness.mdc");
}

function generateCursorMcp(projectRoot, libTarget) {
  const relLib = "./" + relative(projectRoot, libTarget).split(sep).join("/");
  const mcpPath = join(projectRoot, ".cursor/mcp.json");

  let existing = {};
  if (existsSync(mcpPath)) {
    try { existing = JSON.parse(readFileSync(mcpPath, "utf8")); } catch {}
  }

  const mcpServers = existing.mcpServers || {};
  mcpServers["harness"] = {
    command: "node",
    args: [join(PKG_ROOT, "bin/harness-mcp.mjs"), relLib],
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
  console.log("  ✅ .cursor/hooks（afterFileEdit → harness audit）");
}

function installSelfcheckRule(projectRoot) {
  const src = join(PKG_ROOT, ".cursor/rules/harness-selfcheck.mdc");
  const dstDir = join(projectRoot, ".cursor/rules");
  if (!existsSync(src)) return;
  mkdirSync(dstDir, { recursive: true });
  cpSync(src, join(dstDir, "harness-selfcheck.mdc"));
  console.log("  ✅ .cursor/rules/harness-selfcheck.mdc");
}

/* ─── start（设计师一键启动） ─── */

function doStart(targetArg) {
  const target = resolve(process.cwd(), targetArg || "harness-ui");

  doInit(targetArg);

  if (!existsSync(join(target, "node_modules"))) {
    console.log("\n  📥 安装依赖（首次启动，约 1-2 分钟）…\n");
    try {
      execSync("npm install --loglevel=error", { cwd: target, stdio: "inherit" });
    } catch {
      console.error("❌ 依赖安装失败");
      process.exit(1);
    }
  }

  doDev(targetArg);
}

/* ─── dev ─── */

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

function doDev(targetArg) {
  const target = resolve(process.cwd(), targetArg || "harness-ui");

  if (!existsSync(join(target, ".storybook"))) {
    console.error(`❌ 未找到配置，请先运行: harness init ${targetArg || ""}`);
    process.exit(1);
  }

  const port = DEFAULT_PORT;
  const portalUrl = `http://localhost:${port}${PORTAL_PATH}`;

  console.log(`
╔══════════════════════════════════════════╗
║         HarnessUI Design Portal          ║
║     AI 组件治理平台 · 设计师工作台        ║
╚══════════════════════════════════════════╝
`);
  console.log(`  📂 组件库: ${target}`);
  console.log(`  🌐 地址:   http://localhost:${port}`);
  console.log(`  🎨 Portal: ${portalUrl}`);
  console.log(`\n  启动中…\n`);

  const child = spawn("npx", [
    "storybook", "dev",
    "-p", String(port),
    "--no-open",
    "--disable-telemetry",
    "--quiet",
  ], {
    cwd: target,
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: "1" },
  });

  child.stdout.on("data", (buf) => {
    const line = buf.toString();
    if (/error|ERR!|failed/i.test(line)) {
      process.stderr.write(line);
    }
  });
  child.stderr.on("data", (buf) => {
    const line = buf.toString();
    if (/error|ERR!|failed|WARN/i.test(line) && !/storybook/i.test(line)) {
      process.stderr.write(line);
    }
  });

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
  const target = resolve(process.cwd(), targetArg || "harness-ui");

  if (!existsSync(join(target, "src/design-tokens/tokens.json"))) {
    console.error(`❌ 未找到 tokens.json，请先运行: harness init ${targetArg || ""}`);
    process.exit(1);
  }

  console.log(`\n🔌 启动 MCP Server → ${target}\n`);

  const mcpEntry = join(PKG_ROOT, "bin", "harness-mcp.mjs");
  if (!existsSync(mcpEntry)) {
    console.error("❌ MCP Server 尚未实现，即将支持");
    process.exit(1);
  }

  const child = spawn("node", [mcpEntry, target], {
    stdio: "inherit",
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

/* ─── sync ─── */

function doSync(targetArg) {
  const target = resolve(process.cwd(), targetArg || "harness-ui");

  if (!existsSync(join(target, "src/harness/schema/components"))) {
    console.error(`❌ 未找到 schema 目录，请先运行: harness init ${targetArg || ""}`);
    process.exit(1);
  }

  console.log(`\n🔄 同步 schema → rules + tailwind → ${target}\n`);

  const syncScript = join(PKG_ROOT, "scripts/sync-from-schema.mjs");
  const localSync = join(target, "scripts/sync-from-schema.mjs");
  const script = existsSync(localSync) ? localSync : syncScript;

  try {
    execSync(`node "${script}"`, { cwd: target, stdio: "inherit" });

    execSync(`node "${join(existsSync(join(target, "scripts/emit-design-tokens-css.mjs")) ? target : PKG_ROOT, "scripts/emit-design-tokens-css.mjs")}"`, {
      cwd: target,
      stdio: "inherit",
    });

    console.log("\n✅ 同步完成：.cursorrules + Tailwind 扩展 + 规则镜像 + CSS 变量 已更新\n");
  } catch (e) {
    console.error(`\n❌ 同步失败: ${e.message}\n`);
    process.exit(1);
  }
}

/* ─── audit ─── */

function doAudit(targetArg) {
  const target = resolve(process.cwd(), targetArg || "harness-ui");

  if (!existsSync(join(target, "src/harness"))) {
    console.error(`❌ 未找到 harness 目录，请先运行: harness init ${targetArg || ""}`);
    process.exit(1);
  }

  console.log(`\n🔍 合规审计 → ${target}\n`);

  const auditScript = join(PKG_ROOT, "scripts/harness-audit.mjs");
  const localAudit = join(target, "scripts/harness-audit.mjs");
  const script = existsSync(localAudit) ? localAudit : auditScript;

  try {
    execSync(`node "${script}"`, { cwd: target, stdio: "inherit" });
  } catch (e) {
    process.exit(e.status ?? 1);
  }
}
