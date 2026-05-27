import { isColorCssValue } from "./color-token-utils";

export type TokenValueKind = "color" | "length" | "generic";

const LENGTH_RE = /^-?[\d.]+\s*(rem|em|px|%|vh|vw|vmin|vmax|ch|ex|cap|ic|lh|rlh|dvh|dvw|svh|svw|cqw|cqh)$/;

export function detectTokenValueKind(value: string): TokenValueKind {
  if (isColorCssValue(value)) return "color";
  if (LENGTH_RE.test(value.trim())) return "length";
  return "generic";
}

export function parseCssLength(value: string): { num: number; unit: string } | null {
  const trimmed = value.trim();
  const m = trimmed.match(/^(-?[\d.]+)\s*(rem|em|px|%|vh|vw|vmin|vmax|ch|ex|cap|ic|lh|rlh|dvh|dvw|svh|svw|cqw|cqh)?$/);
  if (!m) return null;
  const num = Number.parseFloat(m[1]);
  if (!Number.isFinite(num)) return null;
  return { num, unit: m[2] ?? "" };
}

export function formatCssLength(num: number, unit: string): string {
  const rounded = Math.round(num * 1000) / 1000;
  return `${rounded}${unit}`;
}
