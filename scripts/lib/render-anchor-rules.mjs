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

/** @param {any[]} specs @param {any} [decorativeLibs] */
export function renderCursorrules(specs, decorativeLibs) {
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
      ]),
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
  lines.push("1. **Use Design Tokens only**: colors, spacing, border-radius, etc. must reference token semantic classes (e.g. `bg-primary`, `text-muted-foreground`); no hard-coded color values or arbitrary-value Tailwind.");
  lines.push("2. **Components first**: page development must use Spec-declared business components; no native HTML tag substitutes.");
  lines.push("3. **Single source of truth**: component behavior follows `src/anchor/schema/components/*.spec.json`; do not infer API from memory.");
  lines.push("");
  lines.push("## Import Priority");
  lines.push("- **Primary path**: each component uses its `referencePriority[0]` as the default import; do not switch between multiple paths arbitrarily.");
  lines.push("- Below are all paths that appear across registered components (first entry per spec is the primary path; others are fallbacks):");
  if (refs.length === 0) {
    lines.push("  - (not configured)");
  } else {
    refs.forEach((r) => lines.push(`  - ${r}`));
  }
  lines.push("");
  lines.push("## Forbidden (native HTML)");
  if (forbidden.length === 0) {
    lines.push("- (no forbidden items declared in current schema)");
  } else {
    forbidden.forEach((f) => {
      lines.push(`- Do not use <${f.htmlTag}> — ${f.reason}; use instead: ${f.useInstead}`);
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
    lines.push(`- **Upstream module**: \`${s.wraps?.module ?? "(not configured)"}\``);
    lines.push(`- **Sub-components (Spec)**: ${formatPrimitivesForRules(s.wraps?.primitives)}`);
    lines.push(`- **Intent**: ${s.intent}`);
    lines.push(`- **Spec directive**: ${s.aiPrompt}`);
    const ex = s.examples ?? [];
    if (ex.length > 0) {
      lines.push("- **Few-shot examples** (prefer mimicking structure & imports):");
      for (const item of ex) {
        lines.push(`  - **${item.title}**${item.description ? ` — ${item.description}` : ""}`);
        const sn = String(item.snippet ?? "").trim();
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
        if (frag.intent) lines.push(`    - Intent: ${frag.intent}`);
        if (frag.aiPrompt) lines.push(`    - Spec directive: ${frag.aiPrompt}`);
        if (frag.wraps && (frag.wraps.module || (frag.wraps.primitives && frag.wraps.primitives.length > 0))) {
          lines.push(`    - **Upstream / sub-components (variant override)**`);
          if (frag.wraps.module) lines.push(`      - Module: \`${frag.wraps.module}\``);
          if (frag.wraps.primitives?.length) {
            lines.push(`      - Sub-components: ${formatPrimitivesForRules(frag.wraps.primitives)}`);
          }
        }
        const vex = frag.examples ?? [];
        if (vex.length > 0) {
          for (const item of vex) {
            lines.push(`    - Example **${item.title}**${item.description ? ` — ${item.description}` : ""}`);
            const sn = String(item.snippet ?? "").trim();
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
      lines.push(`- **${c.id}**: if ${c.violation} → ${c.fixPrompt}`);
    });
  }
  lines.push("");

  if (decorativeLibs && Array.isArray(decorativeLibs.libraries) && decorativeLibs.libraries.length > 0) {
    lines.push("## Decorative/Animation Component Libraries (page embellishments)");
    lines.push("");
    lines.push("The following third-party component libraries can be used as visual embellishments. Core interactions still use `@/components/starter/*`; decorative components are for non-functional visual enhancement only.");
    lines.push("");
    const g = decorativeLibs.usageGuidelines;
    if (g) {
      lines.push("**Usage guidelines**:");
      if (g.when) lines.push(`- When to use: ${g.when}`);
      if (g.howMany) lines.push(`- Quantity control: ${g.howMany}`);
      if (g.priority) lines.push(`- Priority: ${g.priority}`);
      if (g.tokens) lines.push(`- Color constraints: ${g.tokens}`);
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
/** @param {any[]} specs @param {any} [decorativeLibs] */
export function renderAnchorMarkdown(specs, decorativeLibs) {
  return `# Design-anchor Rules Mirror\n\nIdentical to root \`.cursorrules\` (generated by \`npm run sync:anchor\`); do not edit manually.\n\n${renderCursorrules(specs, decorativeLibs)}`;
}
