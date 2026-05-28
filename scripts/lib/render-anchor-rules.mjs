export function patternToString(p) {
  return typeof p.pattern === "string" ? p.pattern : String(p.pattern);
}

function normalizePrimitiveEntry(p) {
  if (typeof p === "string") return { symbol: p.trim(), displayName: null };
  if (p && typeof p === "object" && typeof p.symbol === "string") {
    const symbol = p.symbol.trim();
    const displayName =
      typeof p.displayName === "string" && p.displayName.trim() ? p.displayName.trim() : null;
    return { symbol, displayName };
  }
  return { symbol: "", displayName: null };
}

function normalizeRuleText(value) {
  return String(value ?? "")
    .replaceAll("@/components/base", "@/components/anchor-ui")
    .replaceAll("src/components/base", "src/components/anchor-ui")
    .replaceAll(".anchor/src/components", "src/components/anchor-ui")
    .replace(/[ \t]+$/gm, "");
}

/** Render wraps.primitives as a readable fragment for .cursorrules */
function formatPrimitivesForRules(prims) {
  if (!Array.isArray(prims) || prims.length === 0) return "(none listed)";
  const bits = prims
    .map(normalizePrimitiveEntry)
    .filter((x) => x.symbol)
    .map(({ symbol, displayName }) =>
      displayName && displayName !== symbol
        ? `\`${symbol}\` (display name: ${displayName})`
        : `\`${symbol}\``,
    );
  return bits.length ? bits.join(", ") : "(none listed)";
}

/** @param {any[]} specs @param {any} [decorativeLibs] @param {string | null} [activePresetStyle] */
export function renderCursorrules(specs, decorativeLibs, activePresetStyle = null) {
  const forbidden = specs.flatMap((s) => [
    ...(s.forbidden ?? []),
    ...Object.values(s.storyAnchor ?? {}).flatMap((frag) =>
      frag && typeof frag === "object" ? frag.forbidden ?? [] : [],
    ),
  ]);
  const refs = [
    ...new Set(
      specs.flatMap((s) => [
        ...(s.referencePriority ?? []),
        ...Object.values(s.storyAnchor ?? {}).flatMap((frag) =>
          frag && typeof frag === "object" ? frag.referencePriority ?? [] : [],
        ),
      ]).map(normalizeRuleText),
    ),
  ];
  const corrections = specs.flatMap((s) => [
    ...(s.corrections ?? []),
    ...Object.values(s.storyAnchor ?? {}).flatMap((frag) =>
      frag && typeof frag === "object" ? frag.corrections ?? [] : [],
    ),
  ]);

  const lines = [];
  lines.push(
    "# Design-anchor Spec — auto-generated, do not edit manually (after modifying `*.spec.json`, run npm run sync:anchor or npm run generate:rules)",
  );
  lines.push("");
  lines.push("## Core Contracts (AI must follow)");
  lines.push("");
  lines.push("1. **Use Design Tokens first**: colors, spacing, border-radius, type, etc. must reference token semantic classes whenever an equal token exists (e.g. `bg-primary`, `text-muted-foreground`); no hard-coded color values.");
  lines.push("2. **Map explicit values to equal tokens first**: when a user requests a concrete numeric design value (e.g. `16px` radius, `24px` spacing, `14px` type, `1px` border), first check the token scale and use the class / CSS variable with the same computed value (e.g. `rounded-lg`, `p-6`, `text-sm`, `border-[var(--line-width)]`). Do not snap to the nearest token. Use an arbitrary value such as `rounded-[13px]` only when no equal token exists, and prefer adding a token for reusable brand values.");
  lines.push("3. **Components first**: page development must use Spec-declared business components; no native HTML tag substitutes.");
  lines.push("4. **Single source of truth**: component behavior follows `src/anchor/schema/components/*.spec.json`; do not infer API from memory.");
  lines.push("");
  lines.push("## Portal Intent Router (Chinese/English)");
  lines.push("");
  lines.push("When the user asks to inspect or change design-system state, open Anchor Portal first instead of editing files blindly. Run `npx design-anchor portal <tab>`.");
  lines.push("");
  lines.push("| User intent | Chinese trigger examples | English trigger examples | Open |");
  lines.push("|---|---|---|---|");
  lines.push("| Token / theme | 改 token、调整 token、看看 token、当前 token、改品牌色、改圆角、改间距、切暗色、主题设置 | change token, edit tokens, show tokens, token status, brand color, radius, spacing, dark mode, theme | `npx design-anchor portal tokens` |");
  lines.push("| Component library | 有哪些组件、组件列表、组件库、看看组件、组件预览 | component list, available components, component library, show components, preview components | `npx design-anchor portal components` |");
  lines.push("| Component spec / schema | 组件规范、组件协议、组件 schema、组件 props、映射关系、变体规范 | component spec, schema, props contract, variant mapping, component contract | `npx design-anchor portal specs` |");
  lines.push("| Component style tuning | 改组件样式、调整组件、按钮样式、表格样式、组件风格 | change component style, tune component, button style, table style | `npx design-anchor portal components` |");
  lines.push("| Governance / health | 治理、健康度、组件使用情况、使用统计、审计、漂移检查 | governance, health, component usage, audit, drift check, compliance | `npx design-anchor portal govern` |");
  lines.push("| Docs / help | 文档、使用说明、怎么接入、CLI 命令 | docs, documentation, how to use, setup, CLI commands | `npx design-anchor portal docs` |");
  lines.push("| Preset / onboarding | 选择 preset、品牌风格、重新 onboarding、从预设开始 | preset, style preset, onboarding, brand style | `npx design-anchor portal presets` |");
  lines.push("");
  lines.push("If the request contains open/show/check/list/change/edit/configure/查看/看看/打开/调整/修改/配置 plus token/theme/component/spec/governance/preset/docs terms, open Portal. Skip this only when the user explicitly says not to open Portal or asks for code-only file edits.");
  lines.push("");
  if (activePresetStyle) {
    lines.push("## Active Preset Style (lightweight B2B layer)");
    lines.push("");
    lines.push("Use this style guidance only after the core contracts above are satisfied. It should influence page rhythm, hierarchy, density, surface treatment, and decorative restraint, not component APIs or token values.");
    lines.push("");
    lines.push(activePresetStyle.trim().replace(/^# /, "### "));
    lines.push("");
  }
  lines.push("## Import Priority");
  lines.push("- **Primary path**: each component uses its `referencePriority[0]` as the default import; do not switch between multiple paths arbitrarily.");
  lines.push("- Below are all paths that appear across registered components (first entry per spec is the primary path; others are fallbacks):");
  if (refs.length === 0) {
    lines.push("  - (not configured)");
  } else {
    refs.forEach((r) => lines.push(`  - ${normalizeRuleText(r)}`));
  }
  lines.push("");
  lines.push("## Forbidden (native HTML)");
  if (forbidden.length === 0) {
    lines.push("- (no forbidden items declared in current schema)");
  } else {
    forbidden.forEach((f) => {
      lines.push(`- Do not use <${f.htmlTag}> — ${normalizeRuleText(f.reason)}; use instead: ${normalizeRuleText(f.useInstead)}`);
    });
  }
  lines.push("");
  lines.push("## Style Lock (blocklist approach)");
  lines.push("- Do not add arbitrary-value spacing classes (e.g. `m-[13px]`, `p-[7px]`) to tables/buttons in business pages.");
  lines.push("- Do not override the following semantics via className (declared in Design-anchor styleLock):");
  specs.forEach((s) => {
    lines.push(`### ${s.componentName} (${s.id})`);
    (s.styleLock?.blacklist ?? []).forEach((b) => {
      lines.push(`- ${b.description} — pattern: \`${patternToString(b)}\``);
    });
    const sh = s.storyAnchor && typeof s.storyAnchor === "object" ? s.storyAnchor : null;
    if (sh) {
      for (const [sid, frag] of Object.entries(sh)) {
        const bl = frag?.styleLock?.blacklist ?? [];
        if (bl.length === 0) continue;
        lines.push(`  - **Variant \`${sid}\` additional blocklist**:`);
        for (const b of bl) {
          lines.push(`    - ${b.description} — pattern: \`${patternToString(b)}\``);
        }
      }
    }
  });
  lines.push("");
  lines.push("## Component Intent & Spec");
  specs.forEach((s) => {
    lines.push(`### ${s.componentName}`);
    lines.push(`- **Upstream module**: \`${normalizeRuleText(s.wraps?.module ?? "(not configured)")}\``);
    lines.push(`- **Sub-components (Spec)**: ${formatPrimitivesForRules(s.wraps?.primitives)}`);
    lines.push(`- **Intent**: ${normalizeRuleText(s.intent)}`);
    lines.push(`- **Spec directive**: ${normalizeRuleText(s.aiPrompt)}`);
    const ex = s.examples ?? [];
    if (ex.length > 0) {
      lines.push("- **Few-shot examples** (prefer mimicking structure & imports):");
      for (const item of ex) {
        lines.push(`  - **${item.title}**${item.description ? ` — ${item.description}` : ""}`);
        const sn = normalizeRuleText(item.snippet).trim();
        if (sn) {
          lines.push("  ```tsx");
          lines.push(sn.split("\n").map((ln) => `  ${ln}`).join("\n"));
          lines.push("  ```");
        }
      }
    }
    const sh = s.storyAnchor && typeof s.storyAnchor === "object" ? s.storyAnchor : null;
    if (sh && Object.keys(sh).length > 0) {
      lines.push("- **Storybook variant overrides** (corresponding to specific Stories in the sidebar):");
      for (const [sid, frag] of Object.entries(sh)) {
        if (!frag || typeof frag !== "object") continue;
        lines.push(`  - **\`${sid}\`**`);
        if (frag.intent) lines.push(`    - Intent: ${normalizeRuleText(frag.intent)}`);
        if (frag.aiPrompt) lines.push(`    - Spec directive: ${normalizeRuleText(frag.aiPrompt)}`);
        if (frag.wraps && (frag.wraps.module || (frag.wraps.primitives && frag.wraps.primitives.length > 0))) {
          lines.push(`    - **Upstream / sub-components (variant override)**`);
          if (frag.wraps.module) lines.push(`      - Module: \`${normalizeRuleText(frag.wraps.module)}\``);
          if (frag.wraps.primitives?.length) {
            lines.push(`      - Sub-components: ${formatPrimitivesForRules(frag.wraps.primitives)}`);
          }
        }
        const vex = frag.examples ?? [];
        if (vex.length > 0) {
          for (const item of vex) {
            lines.push(`    - Example **${item.title}**${item.description ? ` — ${item.description}` : ""}`);
            const sn = normalizeRuleText(item.snippet).trim();
            if (sn) {
              lines.push("      ```tsx");
              lines.push(sn.split("\n").map((ln) => `      ${ln}`).join("\n"));
              lines.push("      ```");
            }
          }
        }
      }
    }
  });
  lines.push("");
  lines.push("## Correction Directives");
  if (corrections.length === 0) {
    lines.push("- (none)");
  } else {
    corrections.forEach((c) => {
      lines.push(`- **${c.id}**: if ${normalizeRuleText(c.violation)} → ${normalizeRuleText(c.fixPrompt)}`);
    });
  }
  lines.push("");

  if (decorativeLibs && Array.isArray(decorativeLibs.libraries) && decorativeLibs.libraries.length > 0) {
    lines.push("## Decorative/Animation Component Libraries (page embellishments)");
    lines.push("");
    lines.push("The following third-party component libraries can be used as visual embellishments. Core interactions still use Design-anchor components (`@design` or `@/components/anchor-ui/*`); decorative components are for non-functional visual enhancement only.");
    lines.push("");
    const g = decorativeLibs.usageGuidelines;
    if (g) {
      lines.push("**Usage guidelines**:");
      if (g.when) lines.push(`- When to use: ${normalizeRuleText(g.when)}`);
      if (g.howMany) lines.push(`- Quantity control: ${normalizeRuleText(g.howMany)}`);
      if (g.priority) lines.push(`- Priority: ${normalizeRuleText(g.priority)}`);
      if (g.tokens) lines.push(`- Color constraints: ${normalizeRuleText(g.tokens)}`);
      lines.push("");
    }
    for (const lib of decorativeLibs.libraries) {
      lines.push(`### ${lib.name}`);
      lines.push(`- Docs: ${lib.url}`);
      lines.push(`- Install: \`${lib.install}\``);
      lines.push(`- Component directory: ${lib.outputDir}`);
      if (lib.dependencies?.length) lines.push(`- Runtime dependencies: ${lib.dependencies.join(", ")}`);
      if (lib.categories && typeof lib.categories === "object") {
        lines.push("- Available components:");
        for (const [cat, items] of Object.entries(lib.categories)) {
          lines.push(`  - **${cat}**: ${items.join(", ")}`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/** Markdown mirror (for Code Review / non-Cursor tools) */
/** @param {any[]} specs @param {any} [decorativeLibs] @param {string | null} [activePresetStyle] */
export function renderAnchorMarkdown(specs, decorativeLibs, activePresetStyle = null) {
  return `# Design-anchor Rules Mirror\n\nIdentical to root \`.cursorrules\` (generated by \`npm run sync:anchor\`); do not edit manually.\n\n${renderCursorrules(specs, decorativeLibs, activePresetStyle)}`;
}
