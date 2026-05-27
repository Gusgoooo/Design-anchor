import type { Bilingual } from "../i18n/LocaleProvider";

export type TokenPatch = {
  seed: Record<string, string | number>;
  seedDark?: Record<string, string | number>;
  customSeeds?: Record<string, string>;
};

export type OnboardingPreset = {
  id: string;
  name: string;
  tagline: Bilingual;
  bestFor: Bilingual;
  tone: Bilingual;
  tokenPatch: TokenPatch;
  preferredTheme?: "light" | "dark";
  previewImage?: string;
  preview: {
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    primary: string;
    accent: string;
    border: string;
    chart1: string;
    chart2: string;
    chart3: string;
  };
};

export const ONBOARDING_PRESETS: OnboardingPreset[] = [
  {
    id: "linear",
    name: "Linear",
    tagline: { en: "Compact product cockpit", zh: "紧凑型产品工作台" },
    bestFor: { en: "Existing B2B dashboards, task systems, DevTools", zh: "已有 B 端 dashboard、任务系统、DevTools" },
    tone: { en: "Sharp, quiet, high-frequency", zh: "锐利、克制、高频使用" },
    preferredTheme: "dark",
    previewImage: new URL("./assets/presets/linear-dark.png", import.meta.url).href,
    tokenPatch: {
      seed: {
        colorPrimary: "#5e6ad2",
        colorSuccess: "#26b893",
        colorWarning: "#e6b86a",
        colorError: "#eb5757",
        colorInfo: "#5e6ad2",
        colorBgBase: "#fbfbfd",
        colorTextBase: "#0f1115",
        fontSize: 14,
        borderRadius: 4,
        sizeUnit: 3,
      },
      seedDark: {
        colorPrimary: "#7170ff",
        colorBgBase: "#0e0e10",
        colorTextBase: "#f4f4f5",
      },
      customSeeds: {
        chart1: "#5e6ad2",
        chart2: "#26b893",
        chart3: "#e6b86a",
        chart4: "#eb5757",
        chart5: "#a48fff",
      },
    },
    preview: {
      background: "#fbfbfd",
      surface: "#ffffff",
      foreground: "#0f1115",
      muted: "#8a8f98",
      primary: "#5e6ad2",
      accent: "#7170ff",
      border: "#d9dbe7",
      chart1: "#5e6ad2",
      chart2: "#26b893",
      chart3: "#e6b86a",
    },
  },
  {
    id: "stripe",
    name: "Stripe",
    tagline: { en: "Trust-heavy SaaS", zh: "高信任商务 SaaS" },
    bestFor: { en: "Finance, billing, API platforms, account portals", zh: "金融、账单、API 平台、客户门户" },
    tone: { en: "Polished, generous, credible", zh: "精致、宽松、可信" },
    previewImage: new URL("./assets/presets/stripe.png", import.meta.url).href,
    tokenPatch: {
      seed: {
        colorPrimary: "#635bff",
        colorSuccess: "#0e9f6e",
        colorWarning: "#ff8f00",
        colorError: "#df1b41",
        colorInfo: "#635bff",
        colorBgBase: "#ffffff",
        colorTextBase: "#1a1f36",
        fontSize: 15,
        borderRadius: 10,
        sizeUnit: 5,
      },
      seedDark: {
        colorPrimary: "#8c83ff",
        colorBgBase: "#0a0a23",
        colorTextBase: "#f4f5fa",
      },
      customSeeds: {
        chart1: "#635bff",
        chart2: "#0e9f6e",
        chart3: "#ff8f00",
        chart4: "#df1b41",
        chart5: "#a48fff",
      },
    },
    preview: {
      background: "#ffffff",
      surface: "#f6f9fc",
      foreground: "#1a1f36",
      muted: "#697386",
      primary: "#635bff",
      accent: "#8c83ff",
      border: "#d8dee9",
      chart1: "#635bff",
      chart2: "#0e9f6e",
      chart3: "#ff8f00",
    },
  },
  {
    id: "saas-style-01",
    name: "SaaS",
    tagline: { en: "Modern SaaS launchpad", zh: "现代 SaaS 起步风格" },
    bestFor: { en: "PLG SaaS, onboarding, analytics dashboards", zh: "PLG SaaS、onboarding、分析看板" },
    tone: { en: "Clean, confident, product-led", zh: "干净、自信、产品驱动" },
    previewImage: new URL("./assets/presets/saas-style-01.png", import.meta.url).href,
    tokenPatch: {
      seed: {
        colorPrimary: "#0052ff",
        colorSuccess: "#0e9f6e",
        colorWarning: "#f59e0b",
        colorError: "#ef4444",
        colorInfo: "#4d7cff",
        colorBgBase: "#fafafa",
        colorTextBase: "#0f172a",
        fontSize: 14,
        borderRadius: 12,
        sizeUnit: 4,
      },
      seedDark: {
        colorPrimary: "#4d7cff",
        colorInfo: "#7da0ff",
        colorBgBase: "#0f172a",
        colorTextBase: "#f8fafc",
      },
      customSeeds: {
        chart1: "#0052ff",
        chart2: "#4d7cff",
        chart3: "#0e9f6e",
        chart4: "#f59e0b",
        chart5: "#8b5cf6",
      },
    },
    preview: {
      background: "#fafafa",
      surface: "#ffffff",
      foreground: "#0f172a",
      muted: "#64748b",
      primary: "#0052ff",
      accent: "#4d7cff",
      border: "#e2e8f0",
      chart1: "#0052ff",
      chart2: "#4d7cff",
      chart3: "#0e9f6e",
    },
  },
  {
    id: "google-style",
    name: "Google Style",
    tagline: { en: "Friendly platform UI", zh: "友好平台型 UI" },
    bestFor: { en: "Settings, CRM, support, education, ops tools", zh: "设置中心、CRM、客服、教育、运营工具" },
    tone: { en: "Soft, rounded, familiar", zh: "柔和、圆润、易上手" },
    previewImage: new URL("./assets/presets/google-style.png", import.meta.url).href,
    tokenPatch: {
      seed: {
        colorPrimary: "#6750a4",
        colorSuccess: "#188038",
        colorWarning: "#f9ab00",
        colorError: "#b3261e",
        colorInfo: "#1a73e8",
        colorBgBase: "#fffbfe",
        colorTextBase: "#1c1b1f",
        fontSize: 14,
        borderRadius: 24,
        sizeUnit: 5,
      },
      seedDark: {
        colorPrimary: "#d0bcff",
        colorInfo: "#a8c7fa",
        colorBgBase: "#1c1b1f",
        colorTextBase: "#e6e1e5",
      },
      customSeeds: {
        chart1: "#6750a4",
        chart2: "#1a73e8",
        chart3: "#188038",
        chart4: "#f9ab00",
        chart5: "#b3261e",
      },
    },
    preview: {
      background: "#fffbfe",
      surface: "#f3edf7",
      foreground: "#1c1b1f",
      muted: "#49454f",
      primary: "#6750a4",
      accent: "#7d5260",
      border: "#cac4d0",
      chart1: "#6750a4",
      chart2: "#1a73e8",
      chart3: "#188038",
    },
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    tagline: { en: "Calm AI workspace", zh: "安静暗色 AI 工作台" },
    bestFor: { en: "AI products, focused workspaces, premium dev tools", zh: "AI 产品、专注工作台、高级开发者工具" },
    tone: { en: "Nocturnal, warm, focused", zh: "夜间感、温暖、专注" },
    preferredTheme: "dark",
    previewImage: new URL("./assets/presets/minimal-dark.png", import.meta.url).href,
    tokenPatch: {
      seed: {
        colorPrimary: "#f59e0b",
        colorSuccess: "#22c55e",
        colorWarning: "#f59e0b",
        colorError: "#ef4444",
        colorInfo: "#71717a",
        colorBgBase: "#0a0a0f",
        colorTextBase: "#fafafa",
        fontSize: 15,
        borderRadius: 12,
        sizeUnit: 5,
      },
      seedDark: {
        colorPrimary: "#fbbf24",
        colorInfo: "#a1a1aa",
        colorBgBase: "#0a0a0f",
        colorTextBase: "#fafafa",
      },
      customSeeds: {
        chart1: "#f59e0b",
        chart2: "#71717a",
        chart3: "#22c55e",
        chart4: "#a855f7",
        chart5: "#38bdf8",
      },
    },
    preview: {
      background: "#0a0a0f",
      surface: "#1a1a24",
      foreground: "#fafafa",
      muted: "#71717a",
      primary: "#f59e0b",
      accent: "#fbbf24",
      border: "#2a2a36",
      chart1: "#f59e0b",
      chart2: "#71717a",
      chart3: "#22c55e",
    },
  },
  {
    id: "hud-dark-style",
    name: "HUD Dark",
    tagline: { en: "Command center", zh: "暗色指挥舱" },
    bestFor: { en: "Security, monitoring, trading, executive dashboards", zh: "安全、监控、交易、高管驾驶舱" },
    tone: { en: "High-signal, premium, controlled", zh: "高信号、高级、强控制感" },
    preferredTheme: "dark",
    previewImage: new URL("./assets/presets/hud-dark.png", import.meta.url).href,
    tokenPatch: {
      seed: {
        colorPrimary: "#d4af37",
        colorSuccess: "#3fbf8f",
        colorWarning: "#f2c94c",
        colorError: "#ff5c5c",
        colorInfo: "#1e3d59",
        colorBgBase: "#0a0a0a",
        colorTextBase: "#f2f0e4",
        fontSize: 14,
        borderRadius: 2,
        sizeUnit: 4,
      },
      seedDark: {
        colorPrimary: "#f2c94c",
        colorInfo: "#3a5f7d",
        colorBgBase: "#050505",
        colorTextBase: "#f7f3df",
      },
      customSeeds: {
        chart1: "#d4af37",
        chart2: "#1e3d59",
        chart3: "#3fbf8f",
        chart4: "#f2c94c",
        chart5: "#ff5c5c",
      },
    },
    preview: {
      background: "#0a0a0a",
      surface: "#141414",
      foreground: "#f2f0e4",
      muted: "#888888",
      primary: "#d4af37",
      accent: "#1e3d59",
      border: "#403515",
      chart1: "#d4af37",
      chart2: "#1e3d59",
      chart3: "#3fbf8f",
    },
  },
];

export function findOnboardingPreset(id: string): OnboardingPreset {
  return ONBOARDING_PRESETS.find((preset) => preset.id === id) ?? ONBOARDING_PRESETS[0]!;
}
