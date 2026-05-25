#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const repoRoot = process.cwd();
const errors = [];

function fileExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function resolveSourceModule(absBase) {
  const candidates = [
    absBase,
    `${absBase}.ts`,
    `${absBase}.tsx`,
    `${absBase}.js`,
    `${absBase}.jsx`,
    path.join(absBase, "index.ts"),
    path.join(absBase, "index.tsx"),
  ];
  return candidates.find(fileExists) ?? null;
}

function resolveModuleSpecifier(fromFile, moduleSpecifier) {
  if (!moduleSpecifier.startsWith(".")) return null;
  return resolveSourceModule(path.resolve(path.dirname(fromFile), moduleSpecifier));
}

function addBindingName(exports, node) {
  if (ts.isIdentifier(node.name)) exports.add(node.name.text);
}

function collectExports(absFile, seen = new Set()) {
  const resolved = resolveSourceModule(absFile) ?? absFile;
  if (!fileExists(resolved) || seen.has(resolved)) return new Set();
  seen.add(resolved);

  const text = fs.readFileSync(resolved, "utf8");
  const source = ts.createSourceFile(resolved, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const exports = new Set();

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? statement.moduleSpecifier.text
        : null;
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) exports.add(element.name.text);
      } else if (moduleSpecifier) {
        const target = resolveModuleSpecifier(resolved, moduleSpecifier);
        if (target) {
          for (const name of collectExports(target, seen)) exports.add(name);
        }
      }
      continue;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement)) {
      if (statement.name) exports.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exports.add(declaration.name.text);
      }
    }
  }

  return exports;
}

function resolveAnchorModule(modulePath) {
  if (modulePath.startsWith("@/")) {
    return resolveSourceModule(path.join(repoRoot, "src", modulePath.slice(2)));
  }
  if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
    return resolveSourceModule(path.resolve(repoRoot, modulePath));
  }
  return null;
}

function checkSpecExports() {
  const specDir = path.join(repoRoot, "src/anchor/schema/components");
  const baseIndex = path.join(repoRoot, "src/components/base/index.ts");
  const baseExports = collectExports(baseIndex);
  const files = fs.existsSync(specDir)
    ? fs.readdirSync(specDir).filter((file) => file.endsWith(".spec.json")).sort()
    : [];

  let checked = 0;
  for (const file of files) {
    const specPath = path.join(specDir, file);
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    const name = spec.componentName;
    const modulePath = spec.wraps?.module;
    if (!name || !modulePath) continue;
    checked += 1;
    const moduleFile = resolveAnchorModule(modulePath);
    if (!moduleFile) {
      errors.push(`${file}: wraps.module cannot be resolved: ${modulePath}`);
      continue;
    }
    const directExports = collectExports(moduleFile);
    if (!directExports.has(name)) {
      errors.push(`${file}: ${modulePath} does not export ${name}`);
    }
    if (!baseExports.has(name)) {
      errors.push(`${file}: src/components/base/index.ts does not export ${name}`);
    }
  }
  return checked;
}

function checkMcpToolNames() {
  const mcpPath = path.join(repoRoot, "bin/anchor-mcp.mjs");
  if (!fileExists(mcpPath)) return 0;
  const text = fs.readFileSync(mcpPath, "utf8");
  const toolBlock = text.slice(text.indexOf("const TOOLS = ["), text.indexOf("];", text.indexOf("const TOOLS = [")));
  const names = [...toolBlock.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (!names.includes("run_sync_rules")) errors.push("bin/anchor-mcp.mjs: TOOLS must expose run_sync_rules");
  if (names.includes("sync_rules")) errors.push("bin/anchor-mcp.mjs: TOOLS should not expose legacy sync_rules");
  return names.length;
}

const specCount = checkSpecExports();
const toolCount = checkMcpToolNames();

if (errors.length) {
  console.error("anchor consistency check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`anchor consistency passed (${specCount} specs, ${toolCount} MCP tools)`);
