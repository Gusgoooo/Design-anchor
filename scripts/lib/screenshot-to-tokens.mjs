/**
 * Token-extraction shared lib.
 *
 * After the v2 redesign, Design-anchor no longer calls vision APIs directly —
 * users delegate extraction to their own AI tool (Cursor / Claude Code / etc.)
 * which writes tokens via the MCP server. This module shrunk to one helper:
 * `applyTokenExtraction`, used by `anchor theme` (text-prompt extraction) and
 * any future flow that needs to merge a partial token doc into tokens.json
 * and re-run sync:tokens.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * Merge `proposed` into the tokens.json on disk and run sync:tokens.
 *
 * @param {string} tokensPath        Absolute path to tokens.json.
 * @param {object} proposed          { seed, seedDark, customSeeds, fixedAliases }.
 * @param {object} [opts]
 * @param {string[]} [opts.acceptFields]  Optional whitelist of "section.key" paths to apply.
 *                                        If omitted, all proposed fields are applied.
 * @param {string} [opts.syncCwd]    cwd for `npm run sync:tokens`. Defaults to dirname of tokensPath/../.. .
 * @returns {{ mergedCount: number, applied: Array<{path,value}>, syncOk: boolean, syncError: string|null }}
 */
export function applyTokenExtraction(tokensPath, proposed, opts = {}) {
  if (!existsSync(tokensPath)) {
    throw new Error(`tokens.json not found at ${tokensPath}`);
  }
  const accept = opts.acceptFields ? new Set(opts.acceptFields) : null;
  const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
  const applied = [];

  for (const section of ["seed", "seedDark", "customSeeds", "fixedAliases"]) {
    const incoming = proposed?.[section] ?? {};
    for (const [k, v] of Object.entries(incoming)) {
      if (v == null) continue;
      const path = `${section}.${k}`;
      if (accept && !accept.has(path)) continue;
      if (!tokens[section]) tokens[section] = {};
      tokens[section][k] = v;
      applied.push({ path, value: v });
    }
  }

  writeFileSync(tokensPath, JSON.stringify(tokens, null, 2) + "\n");

  // Run sync:tokens from the tokens.json's package root.
  // Layout: <root>/src/design-tokens/tokens.json → cwd is <root>.
  const cwd = opts.syncCwd ?? tokensPath.replace(/\/src\/design-tokens\/tokens\.json$/, "");
  let syncOk = true;
  let syncError = null;
  try {
    execSync("npm run sync:tokens", { cwd, stdio: "pipe", encoding: "utf8" });
  } catch (e) {
    syncOk = false;
    syncError = e.stderr?.toString() || e.stdout?.toString() || e.message;
  }

  return { mergedCount: applied.length, applied, syncOk, syncError };
}
