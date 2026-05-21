declare module "vite-plugin-schema-api" {
  import type { PluginOption } from "vite";
  export function schemaApiPlugin(repoRoot: string): PluginOption;
}

declare module "*/vite-plugin-schema-api.mjs" {
  import type { PluginOption } from "vite";
  export function schemaApiPlugin(repoRoot: string): PluginOption;
}

declare module "culori";

declare module "*?raw" {
  const content: string;
  export default content;
}
