import * as React from "react";
import { DarkModeProvider } from "./theme/DarkModeProvider";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { useRoute } from "./router";
import { TopNav } from "./TopNav";

const DocsRoute = React.lazy(() => import("./docs/DocsRoute").then((m) => ({ default: m.DocsRoute })));
const DesignTokenRoute = React.lazy(() => import("./docs/DesignTokenRoute").then((m) => ({ default: m.DesignTokenRoute })));
const ComponentsRoute = React.lazy(() => import("./workbench/ComponentsRoute").then((m) => ({ default: m.ComponentsRoute })));

export default function App() {
  return (
    <LocaleProvider>
      <DarkModeProvider>
        <AppShell />
      </DarkModeProvider>
    </LocaleProvider>
  );
}

function AppShell() {
  const route = useRoute();
  const currentStoryId = route.kind === "story" ? route.storyId : null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <main className="min-h-0 flex-1">
        <React.Suspense fallback={<RouteFallback />}>
          {route.kind === "docs" ? (
            <DocsRoute />
          ) : route.kind === "designtoken" ? (
            <DesignTokenRoute />
          ) : (
            <ComponentsRoute currentStoryId={currentStoryId} hasStoryRoute={route.kind === "story"} />
          )}
        </React.Suspense>
      </main>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
      Loading…
    </div>
  );
}
