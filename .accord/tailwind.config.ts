import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { accordSafelist, accordTailwindExtend } from "./tailwind.accord.generated";

const extend: Record<string, Record<string, string>> = {};
if (Object.keys(accordTailwindExtend.spacing).length) {
  extend.spacing = { ...accordTailwindExtend.spacing };
}
if (Object.keys(accordTailwindExtend.colors).length) {
  extend.colors = { ...accordTailwindExtend.colors };
}
if (Object.keys(accordTailwindExtend.borderRadius).length) {
  extend.borderRadius = { ...accordTailwindExtend.borderRadius };
}

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/design-portal/**/*.{html,ts,tsx}",
    "./src/accord/schema/**/*.json",
    "./.storybook/**/*.{ts,tsx}",
  ],
  safelist: accordSafelist,
  theme: {
    extend,
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
