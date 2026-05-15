#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

if (process.env.CI || process.env.ACCORD_SKIP_POSTINSTALL) {
  console.log("\n📦 design-accord installed. Run `npx accord start` to initialize.\n");
  process.exit(0);
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const bin = resolve(__dirname, "accord.mjs");

const child = spawn(process.execPath, [bin, "start"], {
  stdio: "inherit",
  cwd: process.env.INIT_CWD || process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 0));
