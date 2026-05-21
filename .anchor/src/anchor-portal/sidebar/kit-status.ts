import * as React from "react";

export type KitStatusEntry = {
  status: "new" | "modified" | "unchanged";
  file?: string;
};

export type KitStatusData = {
  kitVersion?: string;
  syncedAt?: string;
  dotColors?: { new?: string; modified?: string };
  components?: Record<string, KitStatusEntry>;
};

const EMPTY: KitStatusData = { components: {} };

let cache: KitStatusData | null = null;
let inflight: Promise<KitStatusData> | null = null;

function fetchOnce(): Promise<KitStatusData> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/api/kit-status", { cache: "no-store" })
    .then(async (r) => (r.ok ? ((await r.json()) as KitStatusData) : EMPTY))
    .catch(() => EMPTY)
    .then((d) => {
      cache = d ?? EMPTY;
      inflight = null;
      return cache;
    });
  return inflight;
}

export function useKitStatus(): KitStatusData | null {
  const [data, setData] = React.useState<KitStatusData | null>(cache);
  React.useEffect(() => {
    if (data) return;
    let alive = true;
    fetchOnce().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [data]);
  return data;
}

/** Resolve a component display name to a status, with case-insensitive fallback */
export function getComponentStatus(
  kit: KitStatusData | null,
  componentName: string,
): KitStatusEntry["status"] | null {
  if (!kit?.components) return null;
  const direct = kit.components[componentName];
  if (direct) return direct.status;
  const lower = componentName.toLowerCase();
  for (const [k, v] of Object.entries(kit.components)) {
    if (k.toLowerCase() === lower) return v.status;
  }
  return null;
}

export function dotColorFor(kit: KitStatusData | null, status: "new" | "modified"): string {
  const palette = kit?.dotColors ?? {};
  if (status === "new") return palette.new ?? "#3b82f6";
  return palette.modified ?? "#f59e0b";
}
