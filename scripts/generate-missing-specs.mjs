#!/usr/bin/env node
/**
 * Batch-generate initial spec.json for base components that lack one.
 * Run: node scripts/generate-missing-specs.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const BASE_DIR = "src/components/base";
const SPEC_DIR = "src/anchor/schema/components";

const SKIP_FILES = ["ComponentGallery.tsx", "kitchen-sink-data-table.tsx", "composite-data-table.tsx"];

// Category assignment based on component nature
const CATEGORY_MAP = {
  "accordion": "disclosure",
  "alert-dialog": "overlay",
  "aspect-ratio": "layout",
  "breadcrumb": "navigation",
  "button-group": "layout",
  "calendar": "input",
  "carousel": "layout",
  "collapsible": "disclosure",
  "command": "input",
  "context-menu": "overlay",
  "drawer": "overlay",
  "empty": "feedback",
  "field": "form",
  "hover-card": "overlay",
  "input-group": "input",
  "input-otp": "input",
  "item": "layout",
  "kbd": "typography",
  "menubar": "navigation",
  "navigation-menu": "navigation",
  "pagination": "navigation",
  "resizable": "layout",
  "sheet": "overlay",
  "sidebar": "navigation",
  "sonner": "feedback",
  "spinner": "feedback",
  "table": "data-display",
  "toggle": "input",
  "toggle-group": "input",
};

// Intent descriptions
const INTENT_MAP = {
  "accordion": "Collapsible content panel group for FAQ, settings sections, and other expand-on-demand scenarios.",
  "alert-dialog": "Blocking confirmation dialog for irreversible actions (delete, submit); requires explicit response before proceeding.",
  "aspect-ratio": "Fixed aspect-ratio container for images, videos, maps, and other media that must preserve proportions.",
  "breadcrumb": "Hierarchical breadcrumb navigation showing the current page's position in the site structure with back-navigation.",
  "button-group": "Button grouping container that visually combines related action buttons (e.g. toolbar, segmented control).",
  "calendar": "Date-picker calendar panel serving as the core rendering layer for date range selectors.",
  "carousel": "Carousel/slider container for horizontally scrollable product images, banners, or card lists.",
  "collapsible": "Single collapsible region, lighter than Accordion — for standalone show/hide-more scenarios.",
  "command": "Command palette (like VS Code Ctrl+K / Spotlight) for global search and quick-action entry.",
  "context-menu": "Right-click context menu providing contextual actions for selected content.",
  "drawer": "Bottom/side drawer panel for mobile action sheets or auxiliary content.",
  "empty": "Empty state placeholder displayed when a list or page has no data, with guidance copy and actions.",
  "field": "Form field container unifying label + input + description + error layout and accessibility bindings.",
  "hover-card": "Hover card showing additional preview info (e.g. user profile, link preview) on mouse hover.",
  "input-group": "Input group container merging prefix/suffix (icon, text, button) visually with the input.",
  "input-otp": "One-time password input (OTP/verification code) with fixed-digit segmented fields.",
  "item": "List item layout component providing a standard row structure: icon/media + text + action buttons.",
  "kbd": "Keyboard shortcut label displaying key combinations (e.g. Ctrl+S) with proper styling.",
  "menubar": "Menu bar (desktop app-style top menu) with multiple dropdown menus side by side.",
  "navigation-menu": "Top navigation menu supporting simple link lists or complex dropdown panel structures.",
  "pagination": "Pagination navigation providing page number jumps and prev/next controls.",
  "resizable": "Drag-resizable panel group for IDE-style multi-panel layouts.",
  "sheet": "Slide-out panel (like a mobile drawer but supports all four directions) for settings or detail views.",
  "sidebar": "App sidebar skeleton with header/content/footer/menu for a complete navigation layout.",
  "sonner": "Toast notifications (via sonner library) for lightweight action feedback (success/failure/info).",
  "spinner": "Loading spinner indicator for in-button, regional, or full-screen loading states.",
  "table": "Data table base layer providing semantic HTML wrappers (table/thead/tbody/tr/th/td) with consistent styling.",
  "toggle": "Toggle button (pressed/released state) for enabling/disabling features or switching view modes.",
  "toggle-group": "Toggle button group — a set of mutually exclusive or multi-select toggles (e.g. view modes: list/grid/kanban).",
};

// Blacklist templates by category
const BLACKLIST_TEMPLATES = {
  overlay: [
    { description: "Do not override z-index/positioning", pattern: "^(z-|fixed|absolute|inset)" },
    { description: "Do not override animations (controlled internally)", pattern: "^(animate-|transition-|duration-)" },
  ],
  input: [
    { description: "Do not override focus ring styles", pattern: "^(ring-|outline-)" },
    { description: "Do not override height (controlled by size)", pattern: "^h-" },
  ],
  navigation: [
    { description: "Do not override layout structure", pattern: "^(flex|grid|gap-|items-|justify-)" },
  ],
  layout: [
    { description: "Do not override overflow/positioning", pattern: "^(overflow|position|relative|absolute)" },
  ],
  feedback: [
    { description: "Do not override animations", pattern: "^(animate-|transition-)" },
  ],
  disclosure: [
    { description: "Do not override transition animations", pattern: "^(transition-|duration-|data-)" },
  ],
  typography: [
    { description: "Do not override font family", pattern: "^(font-family|font-mono|font-sans)" },
  ],
  "data-display": [
    { description: "Do not override table structure", pattern: "^(border-collapse|table-)" },
  ],
  form: [
    { description: "Do not override layout structure", pattern: "^(flex|grid|gap-)" },
  ],
};

function extractExports(source) {
  const exports = [];
  // Match: export { Foo, Bar }
  const reExportBrace = /export\s*\{([^}]+)\}/g;
  let m;
  while ((m = reExportBrace.exec(source))) {
    for (const part of m[1].split(",")) {
      const sym = part.trim().split(/\s+as\s+/).pop().trim();
      if (sym && /^[A-Z]/.test(sym)) exports.push(sym);
    }
  }
  // Match: export const Foo = ... / export function Foo / export const Foo:
  const reExportDecl = /export\s+(?:const|function|class)\s+([A-Z]\w+)/g;
  while ((m = reExportDecl.exec(source))) {
    if (!exports.includes(m[1])) exports.push(m[1]);
  }
  // Match: displayName assignments for forwardRef pattern
  const reDisplayName = /(\w+)\.displayName\s*=\s*["'](\w+)["']/g;
  while ((m = reDisplayName.exec(source))) {
    if (!exports.includes(m[1]) && /^[A-Z]/.test(m[1])) exports.push(m[1]);
  }
  return exports;
}

function extractBaselineTokens(source) {
  // Extract first cn() call's static classes as baseline
  const reCn = /className=\{cn\(\s*["'`]([^"'`]+)["'`]/g;
  const tokens = new Set();
  let m;
  while ((m = reCn.exec(source))) {
    for (const cls of m[1].split(/\s+/)) {
      // Skip variant-prefixed, arbitrary values, and very specific ones
      if (!cls || cls.includes("[") || cls.includes(":") || cls.includes("/")) continue;
      tokens.add(cls);
    }
    break; // only first cn() for root element
  }
  return [...tokens].slice(0, 12); // cap at 12 tokens
}

function extractVariantProps(source) {
  // Look for cva variants
  const props = [];
  const cvaMatch = source.match(/cva\([^)]*\{[\s\S]*?variants:\s*\{([\s\S]*?)\}\s*,?\s*defaultVariants/);
  if (cvaMatch) {
    const variantsBlock = cvaMatch[1];
    const variantNames = [...variantsBlock.matchAll(/(\w+):\s*\{/g)].map(m => m[1]);
    for (const name of variantNames) {
      const variantRe = new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\}`, "m");
      const block = variantsBlock.match(variantRe);
      if (!block) continue;
      const options = [...block[1].matchAll(/(\w+):\s*["'`]([^"'`]*)["'`]/g)];
      if (options.length > 0) {
        const enumMap = {};
        const typeValues = [];
        for (const [, key, classes] of options) {
          enumMap[key] = classes.split(/\s+/).filter(Boolean);
          typeValues.push(`"${key}"`);
        }
        props.push({
          name,
          description: `${name} variant`,
          type: typeValues.join(" | "),
          required: false,
          defaultValue: options[0]?.[1] || "default",
          enumMap,
        });
      }
    }
  }
  return props;
}

function kebabToPascal(str) {
  return str.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function generateSpec(componentId, source) {
  const category = CATEGORY_MAP[componentId] || "ui";
  const intent = INTENT_MAP[componentId] || "";
  const primitives = extractExports(source);
  const baselineTokens = extractBaselineTokens(source);
  const variantProps = extractVariantProps(source);
  const blacklist = BLACKLIST_TEMPLATES[category] || [];
  const componentName = kebabToPascal(componentId);

  const spec = {
    id: componentId,
    componentName,
    version: "1.0.0",
    intent,
    wraps: {
      module: `@/components/anchor-ui/${componentId}`,
      primitives: primitives.length > 0 ? primitives : [componentName],
    },
    requiredProps: [
      {
        name: "children",
        description: "Child content",
        type: "React.ReactNode",
        required: true,
      },
    ],
    optionalProps: variantProps.length > 0 ? variantProps : undefined,
    styleLock: {
      baselineTokens,
      blacklist,
    },
    aiPrompt: `Import ${componentName} from @design/${componentId}; ${intent ? intent.split(".")[0] + "." : ""}`,
    meta: {
      tags: [componentId, category],
      category,
      status: "stable",
    },
  };

  // Remove undefined fields
  if (!spec.optionalProps) delete spec.optionalProps;

  return spec;
}

// Main
const existingSpecs = new Set(
  readdirSync(SPEC_DIR)
    .filter(f => f.endsWith(".spec.json"))
    .map(f => f.replace(".spec.json", ""))
);

const componentFiles = readdirSync(BASE_DIR)
  .filter(f => f.endsWith(".tsx") && !f.includes(".stories.") && !SKIP_FILES.includes(f));

let generated = 0;
for (const file of componentFiles) {
  const id = basename(file, ".tsx").toLowerCase() === basename(file, ".tsx")
    ? basename(file, ".tsx")
    : basename(file, ".tsx").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

  // Skip if spec already exists
  if (existingSpecs.has(id)) continue;
  // Skip DataTable (already has data-table spec)
  if (id === "datatable" || id === "data-table") continue;

  const source = readFileSync(join(BASE_DIR, file), "utf8");
  const spec = generateSpec(id, source);
  const outPath = join(SPEC_DIR, `${id}.spec.json`);
  writeFileSync(outPath, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Generated: ${id}.spec.json (${spec.wraps.primitives.length} primitives)`);
  generated++;
}

console.log(`\nDone: ${generated} specs generated.`);
