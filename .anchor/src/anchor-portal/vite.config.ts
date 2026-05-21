import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { schemaApiPlugin } from "../../vite-plugin-schema-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  root: __dirname,
  plugins: [tailwindcss(), react(), schemaApiPlugin(repoRoot)],
  resolve: {
    alias: {
      "@": path.resolve(repoRoot, "src"),
    },
  },
  server: {
    host: true,
    port: 6006,
    strictPort: false,
    fs: { allow: [repoRoot] },
  },
  cacheDir: path.resolve(repoRoot, "node_modules/.vite-anchor-portal"),
});
