export function deriveSeedToMap(
  seed: Record<string, string | number>,
  options?: {
    dark?: boolean;
    customSeeds?: Record<string, string>;
    fixedAliases?: Record<string, string | number>;
  },
): Record<string, string | number>;
