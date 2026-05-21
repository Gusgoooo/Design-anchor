import * as React from "react";

export type Route =
  | { kind: "welcome" }
  | { kind: "story"; storyId: string }
  | { kind: "designtoken" }
  | { kind: "patterns" };

const STORY_PREFIX = "/story/";

export function parseHash(hash: string = window.location.hash): Route {
  const trimmed = hash.replace(/^#/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path === "/" || path === "") return { kind: "welcome" };
  if (path === "/_designtoken") return { kind: "designtoken" };
  if (path === "/_patterns") return { kind: "patterns" };
  if (path.startsWith(STORY_PREFIX)) {
    return { kind: "story", storyId: path.slice(STORY_PREFIX.length) };
  }
  return { kind: "welcome" };
}

export function serializeRoute(r: Route): string {
  switch (r.kind) {
    case "designtoken":
      return "#/_designtoken";
    case "patterns":
      return "#/_patterns";
    case "story":
      return `#${STORY_PREFIX}${r.storyId}`;
    default:
      return "#/";
  }
}

export function navigateTo(r: Route) {
  const next = serializeRoute(r);
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
}

export function useRoute(): Route {
  const get = React.useCallback(() => parseHash(), []);
  const [route, setRoute] = React.useState<Route>(get);
  React.useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}
