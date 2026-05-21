#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

if (process.env.CI || process.env.ANCHOR_SKIP_POSTINSTALL) {
  console.log("\n📦 design-anchor installed. Run `npx anchor start` to initialize.\n");
  process.exit(0);
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const bin = resolve(__dirname, "anchor.mjs");

const child = spawn(process.execPath, [bin, "start"], {
  stdio: "inherit",
  cwd: process.env.INIT_CWD || process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 0));
