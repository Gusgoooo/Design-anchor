import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { anchorSafelist, anchorTailwindExtend } from "./tailwind.anchor.generated";

const extend: Record<string, Record<string, string>> = {};
if (Object.keys(anchorTailwindExtend.spacing).length) {
  extend.spacing = { ...anchorTailwindExtend.spacing };
}
if (Object.keys(anchorTailwindExtend.colors).length) {
  extend.colors = { ...anchorTailwindExtend.colors };
}
if (Object.keys(anchorTailwindExtend.borderRadius).length) {
  extend.borderRadius = { ...anchorTailwindExtend.borderRadius };
}

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/anchor/schema/**/*.json",
  ],
  safelist: anchorSafelist,
  theme: {
    extend,
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
