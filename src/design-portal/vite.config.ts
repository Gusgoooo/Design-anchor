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
});
