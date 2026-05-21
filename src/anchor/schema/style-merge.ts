import type { StyleLock, StyleLockRule } from "./types";

function ruleToRegex(rule: StyleLockRule): RegExp {
  return typeof rule.pattern === "string" ? new RegExp(rule.pattern) : rule.pattern;
}

/**
 * Strips blacklisted tokens from user className before calling tailwind-merge.
 * This prevents "locked" spacing/border/brand-color from being injected via consumer className.
 */
export function stripLockedClasses(userClassName: string | undefined, lock: StyleLock): string {
  if (!userClassName?.trim()) return "";
  const tokens = userClassName.trim().split(/\s+/);
  const blacklist = lock.blacklist.map(ruleToRegex);
  return tokens.filter((t) => !blacklist.some((re) => re.test(t))).join(" ");
}
