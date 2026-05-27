#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeedToMap } from "../src/design-tokens/seed-to-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tokenPath = path.join(root, "src/design-tokens/tokens.json");
const cssPath = path.join(root, "src/styles/design-tokens.generated.css");

const errors = [];

const REQUIRED_SEEDS = [
  ["colorPrimary", "color"],
  ["colorSuccess", "color"],
  ["colorWarning", "color"],
  ["colorError", "color"],
  ["colorInfo", "color"],
  ["colorBgBase", "color"],
  ["colorTextBase", "color"],
  ["fontSize", "number"],
  ["borderRadius", "number"],
  ["sizeUnit", "number"],
];

const REQUIRED_CUSTOM_SEEDS = [
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "chart1Dark",
  "chart2Dark",
  "chart3Dark",
  "chart4Dark",
  "chart5Dark",
];

const SEMANTIC_COLORS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];

const REQUIRED_MAP_TOKENS = [
  ...SEMANTIC_COLORS,
  "color-primary",
  "color-primary-bg",
  "color-primary-hover",
  "color-primary-active",
  "color-success",
  "color-warning",
  "color-error",
  "color-info",
  "color-link",
  "color-text",
  "color-text-secondary",
  "color-bg-base",
  "color-bg-layout",
  "color-bg-container",
  "color-border",
  "border-radius-xs",
  "border-radius-sm",
  "border-radius",
  "border-radius-lg",
  "border-radius-xl",
  "spacing-0",
  "spacing-px",
  "spacing-0.5",
  "spacing-1",
  "spacing-2",
  "spacing-4",
  "spacing-7",
  "spacing-9",
  "spacing-11",
  "spacing-96",
  "padding-4",
  "margin-4",
  "font-size-sm",
  "font-size",
  "font-size-lg",
  "font-size-heading-2",
  "line-height",
  "opacity-disabled",
  "opacity-muted",
  "elevation-sm",
  "elevation",
  "elevation-md",
  "elevation-lg",
  "ring-width",
  "motion-duration-fast",
  "motion-duration-mid",
  "_anchor-radius-xs",
  "_anchor-radius-sm",
  "_anchor-radius-md",
  "_anchor-radius-lg",
  "_anchor-font-size-sm",
  "_anchor-font-size-base",
  "_anchor-transition-duration-fast",
  "__sizeUnit",
];

const REQUIRED_THEME_VARS = [
  ...SEMANTIC_COLORS.map((name) => `--color-${name}`),
  "--radius-xs",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--shadow-sm",
  "--shadow",
  "--shadow-md",
  "--shadow-lg",
  "--spacing",
  "--spacing-0",
  "--spacing-px",
  "--spacing-0\\.5",
  "--spacing-1",
  "--spacing-4",
  "--spacing-9",
  "--font-size-xs",
  "--font-size-sm",
  "--font-size-base",
  "--font-size-lg",
  "--font-size-xl",
  "--font-size-2xl",
  "--font-size-3xl",
  "--opacity-disabled",
  "--transition-duration-fast",
  "--transition-duration-mid",
];

function addError(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) addError(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function isNumberLike(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string" || value.trim() === "") return false;
  return Number.isFinite(parseFloat(value));
}

function cssHas(css, varName) {
  return new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`).test(css);
}

function deriveLight(doc) {
  return deriveSeedToMap(doc.seed, {
    dark: false,
    customSeeds: doc.customSeeds ?? {},
    fixedAliases: doc.fixedAliases ?? {},
  });
}

function deriveDark(doc) {
  return deriveSeedToMap({ ...doc.seed, ...(doc.seedDark ?? {}) }, {
    dark: true,
    customSeeds: doc.customSeeds ?? {},
    fixedAliases: doc.fixedAliases ?? {},
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextColor(current, fallback) {
  return current === fallback ? "#7c3aed" : fallback;
}

function numberSeedPlus(value, delta) {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n + delta : delta;
}

function assertChanged(label, before, after, keys) {
  const changed = keys.filter((key) => before[key] !== after[key]);
  if (changed.length === 0) {
    addError(`${label}: expected at least one mapped token to change (${keys.join(", ")})`);
  }
}

function assertUnchanged(label, before, after, keys) {
  const changed = keys.filter((key) => before[key] !== after[key]);
  if (changed.length > 0) {
    addError(`${label}: expected fixed tokens to stay stable, changed: ${changed.join(", ")}`);
  }
}

function validateSeedDocument(doc) {
  assert(doc.version === 2, "tokens.json must use version: 2 seed contract");
  assert(doc.seed && typeof doc.seed === "object", "tokens.json must contain seed object");
  assert(doc.seedDark && typeof doc.seedDark === "object", "tokens.json must contain seedDark object");
  assert(doc.customSeeds && typeof doc.customSeeds === "object", "tokens.json must contain customSeeds object");
  assert(doc.mapOverrides && typeof doc.mapOverrides === "object", "tokens.json must contain mapOverrides object");
  assert(doc.mapOverrides?.light && typeof doc.mapOverrides.light === "object", "mapOverrides.light must exist");
  assert(doc.mapOverrides?.dark && typeof doc.mapOverrides.dark === "object", "mapOverrides.dark must exist");

  for (const [key, kind] of REQUIRED_SEEDS) {
    const value = doc.seed?.[key];
    assert(value !== undefined, `seed.${key} is required`);
    if (kind === "color") assert(isHexColor(value), `seed.${key} must be #RRGGBB`);
    if (kind === "number") assert(isNumberLike(value), `seed.${key} must be number-like`);
  }

  for (const key of REQUIRED_CUSTOM_SEEDS) {
    const value = doc.customSeeds?.[key];
    assert(isHexColor(value), `customSeeds.${key} must be #RRGGBB`);
  }
}

function validateMaps(doc) {
  const light = { ...deriveLight(doc), ...(doc.mapOverrides?.light ?? {}) };
  const dark = { ...deriveDark(doc), ...(doc.mapOverrides?.dark ?? {}) };

  for (const token of REQUIRED_MAP_TOKENS) {
    assert(light[token] !== undefined && light[token] !== "", `light map missing ${token}`);
    assert(dark[token] !== undefined && dark[token] !== "", `dark map missing ${token}`);
  }

  return { light, dark };
}

function validateCss(css) {
  for (const varName of REQUIRED_THEME_VARS) {
    assert(cssHas(css, varName), `generated CSS @theme missing ${varName}`);
  }
  for (const varName of [
    "--background",
    "--foreground",
    "--primary",
    "--ring",
    "--chart-1",
    "--_anchor-radius-xs",
    "--_anchor-radius-md",
    "--_anchor-font-size-sm",
    "--_anchor-transition-duration-fast",
  ]) {
    assert(cssHas(css, varName), `generated CSS root/dark missing ${varName}`);
  }
}

function validateSensitivity(doc, baselineLight, baselineDark) {
  const mutations = [
    {
      label: "seed.colorPrimary",
      apply: (next) => { next.seed.colorPrimary = nextColor(next.seed.colorPrimary, "#1677ff"); },
      branch: "light",
      keys: ["primary", "ring", "sidebar-primary", "color-primary"],
    },
    {
      label: "seed.colorSuccess",
      apply: (next) => { next.seed.colorSuccess = nextColor(next.seed.colorSuccess, "#22c55e"); },
      branch: "light",
      keys: ["color-success", "color-success-bg", "color-success-text"],
    },
    {
      label: "seed.colorWarning",
      apply: (next) => { next.seed.colorWarning = nextColor(next.seed.colorWarning, "#eab308"); },
      branch: "light",
      keys: ["color-warning", "color-warning-bg", "color-warning-text"],
    },
    {
      label: "seed.colorError",
      apply: (next) => { next.seed.colorError = nextColor(next.seed.colorError, "#f97316"); },
      branch: "light",
      keys: ["destructive", "color-error", "color-error-bg"],
    },
    {
      label: "seed.colorInfo",
      apply: (next) => { next.seed.colorInfo = nextColor(next.seed.colorInfo, "#0ea5e9"); },
      branch: "light",
      keys: ["color-info", "color-link", "color-info-bg"],
    },
    {
      label: "seed.colorBgBase",
      apply: (next) => { next.seed.colorBgBase = nextColor(next.seed.colorBgBase, "#f8fafc"); },
      branch: "light",
      keys: ["background", "card", "muted", "color-bg-base"],
    },
    {
      label: "seed.colorTextBase",
      apply: (next) => { next.seed.colorTextBase = nextColor(next.seed.colorTextBase, "#111827"); },
      branch: "light",
      keys: ["foreground", "muted-foreground", "color-text"],
    },
    {
      label: "seed.fontSize",
      apply: (next) => { next.seed.fontSize = numberSeedPlus(next.seed.fontSize, 2); },
      branch: "light",
      keys: ["font-size", "font-size-lg", "_anchor-font-size-sm", "_anchor-font-size-base"],
    },
    {
      label: "seed.borderRadius",
      apply: (next) => { next.seed.borderRadius = numberSeedPlus(next.seed.borderRadius, 4); },
      branch: "light",
      keys: ["border-radius-xs", "border-radius", "border-radius-lg", "_anchor-radius-xs", "_anchor-radius-md"],
    },
    {
      label: "seed.sizeUnit",
      apply: (next) => { next.seed.sizeUnit = numberSeedPlus(next.seed.sizeUnit, 2); },
      branch: "light",
      keys: ["spacing-1", "spacing-4", "spacing-9", "padding-4", "__sizeUnit"],
    },
    {
      label: "customSeeds.chart1",
      apply: (next) => { next.customSeeds.chart1 = nextColor(next.customSeeds.chart1, "#06b6d4"); },
      branch: "light",
      keys: ["chart-1"],
    },
    {
      label: "seedDark.colorPrimary",
      apply: (next) => { next.seedDark.colorPrimary = nextColor(next.seedDark.colorPrimary, "#a855f7"); },
      branch: "dark",
      keys: ["primary", "ring", "sidebar-primary", "color-primary"],
    },
  ];

  for (const mutation of mutations) {
    const next = clone(doc);
    mutation.apply(next);
    const after = mutation.branch === "dark" ? deriveDark(next) : deriveLight(next);
    const before = mutation.branch === "dark" ? baselineDark : baselineLight;
    assertChanged(mutation.label, before, after, mutation.keys);
  }

  const fixedNext = clone(doc);
  fixedNext.seed.colorPrimary = nextColor(fixedNext.seed.colorPrimary, "#1677ff");
  const fixedAfter = deriveLight(fixedNext);
  assertUnchanged("seed.colorPrimary fixed-token boundary", baselineLight, fixedAfter, [
    "spacing-4",
    "font-size",
    "border-radius",
    "motion-duration-fast",
  ]);
}

const doc = readJson(tokenPath);
const css = fs.readFileSync(cssPath, "utf8");

validateSeedDocument(doc);
const { light, dark } = validateMaps(doc);
validateCss(css);
validateSensitivity(doc, light, dark);

if (errors.length) {
  console.error("token contract check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `token contract passed (${REQUIRED_SEEDS.length} seeds, ${REQUIRED_CUSTOM_SEEDS.length} custom seeds, ${REQUIRED_MAP_TOKENS.length} map tokens, ${REQUIRED_THEME_VARS.length} theme vars)`,
);
