#!/usr/bin/env node
/**
 * One-shot: semantic spacing utilities (…-xs, …-base, …-xxxs) → Tailwind numeric scale.
 * Does not touch text-sm, rounded-md, max-w-sm, shadow-sm, etc.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SEM_TO_NUM = {
  xxxs: "0.5",
  xxs: "1",
  xs: "2",
  sm: "3",
  base: "4",
  md: "5",
  lg: "6",
  xl: "8",
};

/** 不包含 min-w/max-w/min-h/max-h，避免误伤 `max-w-sm` 等布局类名。 */
const POS_PREFIXES = [
  "p", "px", "py", "pt", "pb", "pl", "pr",
  "m", "mx", "my", "mt", "mb", "ml", "mr",
  "gap", "gap-x", "gap-y",
  "space-x", "space-y",
  "inset", "inset-x", "inset-y",
  "top", "right", "bottom", "left",
  "scroll-mt", "scroll-mb", "scroll-ml", "scroll-mr", "scroll-mx", "scroll-my",
  "w", "h", "size",
  "translate-x", "translate-y",
];

const NEG_PREFIXES = ["-m", "-mx", "-my", "-mt", "-mb", "-ml", "-mr"];

function migrateSource(code) {
  let out = code;
  const semantics = Object.keys(SEM_TO_NUM);
  for (const sem of semantics) {
    const num = SEM_TO_NUM[sem];
    for (const pre of POS_PREFIXES) {
      const re = new RegExp(`(?<![\\w-])${escapeRe(pre)}-${escapeRe(sem)}(?![\\w.-])`, "g");
      out = out.replace(re, `${pre}-${num}`);
    }
    for (const pre of NEG_PREFIXES) {
      const re = new RegExp(`(?<![\\w-])${escapeRe(pre)}-${escapeRe(sem)}(?![\\w.-])`, "g");
      out = out.replace(re, `${pre}-${num}`);
    }
  }
  return out;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith(".")) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|jsx|js|css|mdx)$/.test(name.name)) acc.push(p);
  }
}

const targets = [];
walk(path.join(root, "src"), targets);

let changed = 0;
for (const file of targets) {
  const before = fs.readFileSync(file, "utf8");
  const after = migrateSource(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
    console.log(path.relative(root, file));
  }
}
console.log(`Done. ${changed} files updated.`);
