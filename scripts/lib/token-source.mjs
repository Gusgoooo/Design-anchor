import fs from "node:fs";
import path from "node:path";

export const TOKEN_REL = "src/design-tokens/tokens.json";
export const GENERATED_CSS_REL = "src/styles/design-tokens.generated.css";
export const SPACING_SCALE_REL = "src/design-tokens/spacing-scale.generated.json";

export function consumerRootFor(anchorRoot = process.cwd()) {
  const root = path.resolve(anchorRoot);
  return path.basename(root) === ".anchor" ? path.dirname(root) : root;
}

export function projectTokenRootFor(anchorRoot = process.cwd()) {
  const envRoot = process.env.ANCHOR_TOKEN_ROOT ? path.resolve(process.env.ANCHOR_TOKEN_ROOT) : null;
  return envRoot || consumerRootFor(anchorRoot);
}

export function legacyTokenCandidates(anchorRoot = process.cwd()) {
  const root = path.resolve(anchorRoot);
  const projectRoot = projectTokenRootFor(root);
  return [
    path.join(projectRoot, ".harness"),
    root,
  ];
}

export function resolveTokenRoot(anchorRoot = process.cwd(), { requireExisting = true } = {}) {
  const projectRoot = projectTokenRootFor(anchorRoot);
  const projectTokenPath = path.join(projectRoot, TOKEN_REL);
  if (!requireExisting || fs.existsSync(projectTokenPath)) {
    return { root: projectRoot, kind: "project" };
  }

  for (const candidate of legacyTokenCandidates(anchorRoot)) {
    const tokensPath = path.join(candidate, TOKEN_REL);
    if (fs.existsSync(tokensPath)) {
      return {
        root: candidate,
        kind: path.basename(candidate) === ".harness" ? "legacy-harness" : "anchor-fallback",
      };
    }
  }

  return { root: projectRoot, kind: "project" };
}

export function resolveTokenPaths(anchorRoot = process.cwd(), opts = {}) {
  const source = resolveTokenRoot(anchorRoot, opts);
  return {
    ...source,
    tokensPath: path.join(source.root, TOKEN_REL),
    cssPath: path.join(source.root, GENERATED_CSS_REL),
    spacingPath: path.join(source.root, SPACING_SCALE_REL),
  };
}

export function projectTokenPaths(anchorRoot = process.cwd()) {
  const root = projectTokenRootFor(anchorRoot);
  return {
    root,
    kind: "project",
    tokensPath: path.join(root, TOKEN_REL),
    cssPath: path.join(root, GENERATED_CSS_REL),
    spacingPath: path.join(root, SPACING_SCALE_REL),
  };
}
