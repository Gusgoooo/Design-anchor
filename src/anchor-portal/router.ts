import * as React from "react";

export type Route =
  | { kind: "docs" }
  | { kind: "onboarding" }
  | { kind: "designtoken" }
  | { kind: "components" }
  | { kind: "story"; storyId: string };

/** Which top-nav tab is highlighted for a given route. */
export type TopTab = "designtoken" | "components";

export function tabForRoute(r: Route): TopTab | null {
  switch (r.kind) {
    case "docs":
    case "onboarding":
      return null;
    case "designtoken":
      return "designtoken";
    case "components":
    case "story":
      return "components";
  }
}

const STORY_PREFIX = "/story/";

export function parseHash(hash: string = window.location.hash): Route {
  const trimmed = hash.replace(/^#/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path === "/onboarding" || path === "/setup") return { kind: "onboarding" };
  if (path === "/" || path === "") return { kind: "designtoken" };
  if (path === "/docs") return { kind: "docs" };
  if (path === "/_designtoken" || path === "/designtoken" || path === "/theme") return { kind: "designtoken" };
  if (path === "/_govern" || path === "/govern" || path === "/health") return { kind: "designtoken" };
  if (path === "/_patterns" || path === "/patterns") return { kind: "designtoken" };
  if (path === "/components" || path === "/library") return { kind: "components" };
  if (path.startsWith(STORY_PREFIX)) {
    return { kind: "story", storyId: path.slice(STORY_PREFIX.length) };
  }
  return { kind: "designtoken" };
}

export function serializeRoute(r: Route): string {
  switch (r.kind) {
    case "docs":
      return "#/docs";
    case "onboarding":
      return "#/onboarding";
    case "designtoken":
      return "#/theme";
    case "components":
      return "#/library";
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
