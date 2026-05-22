import * as React from "react";

export type Route =
  | { kind: "docs" }
  | { kind: "designtoken" }
  | { kind: "components" }
  | { kind: "story"; storyId: string }
  | { kind: "patterns" };

/** Which top-nav tab is highlighted for a given route. */
export type TopTab = "docs" | "designtoken" | "components";

export function tabForRoute(r: Route): TopTab {
  switch (r.kind) {
    case "docs":
      return "docs";
    case "designtoken":
      return "designtoken";
    case "components":
    case "story":
    case "patterns":
      return "components";
  }
}

const STORY_PREFIX = "/story/";

export function parseHash(hash: string = window.location.hash): Route {
  const trimmed = hash.replace(/^#/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path === "/" || path === "" || path === "/docs") return { kind: "docs" };
  if (path === "/_designtoken" || path === "/designtoken") return { kind: "designtoken" };
  if (path === "/_patterns" || path === "/patterns") return { kind: "patterns" };
  if (path === "/components") return { kind: "components" };
  if (path.startsWith(STORY_PREFIX)) {
    return { kind: "story", storyId: path.slice(STORY_PREFIX.length) };
  }
  return { kind: "docs" };
}

export function serializeRoute(r: Route): string {
  switch (r.kind) {
    case "docs":
      return "#/docs";
    case "designtoken":
      return "#/_designtoken";
    case "components":
      return "#/components";
    case "patterns":
      return "#/_patterns";
    case "story":
      return `#${STORY_PREFIX}${r.storyId}`;
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
