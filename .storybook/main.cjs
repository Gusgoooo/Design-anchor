const path = require("node:path");

const repoRoot = path.join(__dirname, "..");

/** @type {import('@storybook/react-vite').StorybookConfig} */
module.exports = {
  /** 仅收录业务/组件与文档 MDX，不包含 harness 目录 */
  stories: ["../src/**/*.mdx", "../src/components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  /**
   * 默认 `react-docgen` 对 TS forwardRef / 组合组件 props 提取不完整 → Controls 为空。
   * 使用 TypeScript 版 docgen 才能稳定生成 Controls（性能略慢可接受）。
   */
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  docs: {
    autodocs: "tag",
  },
  core: {
    disableWhatsNewNotifications: true,
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import("vite");
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    const { schemaApiPlugin } = await import(path.join(repoRoot, "vite-plugin-schema-api.mjs"));
    return mergeConfig(viteConfig, {
      /**
       * 与仓库内其它 Vite/Storybook 实例默认共用 `node_modules/.vite` 时，易出现依赖预构建缓存串台，
       * 表现为预览 iframe 动态 import 报 “Failed to fetch dynamically imported module”。
       */
      cacheDir: path.join(repoRoot, "node_modules/.vite-storybook-harness"),
      plugins: [tailwindcss(), schemaApiPlugin(repoRoot)],
      resolve: {
        alias: {
          "@": path.join(repoRoot, "src"),
        },
      },
      server: {
        /** 仅监听 127.0.0.1 时，部分环境下通过 localhost / IPv6 访问会导致模块 URL 拉取失败 */
        host: true,
        strictPort: true,
        fs: {
          allow: [repoRoot],
        },
      },
    });
  },
};
