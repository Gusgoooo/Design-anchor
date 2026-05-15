/** Whether the value is a CSS color literal editable in the OKLCH editor */
export function isColorCssValue(s: string): boolean {
  const t = s.trim().toLowerCase();
  return (
    t.startsWith("oklch(") ||
    t.startsWith("#") ||
    t.startsWith("rgb(") ||
    t.startsWith("rgba(") ||
    t.startsWith("hsl(") ||
    t.startsWith("hsla(")
  );
}

export function isColorTokenRow(light: string, dark: string): boolean {
  return isColorCssValue(light) && isColorCssValue(dark);
}
