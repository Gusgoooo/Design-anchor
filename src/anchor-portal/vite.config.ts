import path from "node:path";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { schemaApiPlugin } from "../../vite-plugin-schema-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const consumerRoot = path.basename(repoRoot) === ".anchor" ? path.dirname(repoRoot) : repoRoot;
const require = createRequire(import.meta.url);
const consumerComponentsDir = path.resolve(consumerRoot, "src/components/anchor-ui");
const fallbackComponentsDir = path.resolve(repoRoot, "src/components/base");
const componentDir = existsSync(consumerComponentsDir) ? consumerComponentsDir : fallbackComponentsDir;
const consumerLibDir = path.resolve(consumerRoot, "src/lib");
const consumerHooksDir = path.resolve(consumerRoot, "src/hooks");

function packageRoot(pkg: string) {
  return path.dirname(require.resolve(`${pkg}/package.json`, { paths: [consumerRoot, repoRoot] }));
}

const reactRoot = packageRoot("react");
const reactDomRoot = packageRoot("react-dom");

export default defineConfig({
  root: __dirname,
  plugins: [tailwindcss(), react(), schemaApiPlugin(repoRoot)],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^@design$/, replacement: path.join(componentDir, "index.ts") },
      { find: /^@design\/(.*)$/, replacement: path.join(componentDir, "$1") },
      { find: "@/components/anchor-ui", replacement: componentDir },
      { find: "@/components/base", replacement: componentDir },
      { find: "@/lib", replacement: existsSync(consumerLibDir) ? consumerLibDir : path.resolve(repoRoot, "src/lib") },
      { find: "@/hooks", replacement: existsSync(consumerHooksDir) ? consumerHooksDir : path.resolve(repoRoot, "src/hooks") },
      { find: "@/anchor-portal", replacement: path.resolve(repoRoot, "src/anchor-portal") },
      { find: "@/design-tokens", replacement: path.resolve(repoRoot, "src/design-tokens") },
      { find: "@/anchor", replacement: path.resolve(repoRoot, "src/anchor") },
      { find: "@", replacement: path.resolve(repoRoot, "src") },
      { find: "react/jsx-runtime", replacement: path.join(reactRoot, "jsx-runtime.js") },
      { find: "react/jsx-dev-runtime", replacement: path.join(reactRoot, "jsx-dev-runtime.js") },
      { find: "react-dom", replacement: reactDomRoot },
      { find: "react", replacement: reactRoot },
    ],
  },
  server: {
    host: true,
    port: 6006,
    strictPort: false,
    fs: { allow: [repoRoot, consumerRoot] },
  },
  cacheDir: path.resolve(repoRoot, "node_modules/.vite-anchor-portal"),
});
