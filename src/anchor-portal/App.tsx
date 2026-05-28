import * as React from "react";
import { DarkModeProvider } from "./theme/DarkModeProvider";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { useRoute } from "./router";
import { TopNav } from "./TopNav";

const DocsRoute = React.lazy(() => import("./docs/DocsRoute").then((m) => ({ default: m.DocsRoute })));
const DesignTokenRoute = React.lazy(() => import("./docs/DesignTokenRoute").then((m) => ({ default: m.DesignTokenRoute })));
const GovernRoute = React.lazy(() => import("./govern/GovernRoute").then((m) => ({ default: m.GovernRoute })));
const OnboardingRoute = React.lazy(() => import("./onboarding/OnboardingRoute").then((m) => ({ default: m.OnboardingRoute })));
const ComponentsRoute = React.lazy(() => import("./workbench/ComponentsRoute").then((m) => ({ default: m.ComponentsRoute })));
const PatternsRoute = React.lazy(() => import("./docs/PatternsRoute").then((m) => ({ default: m.PatternsRoute })));

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

  // Onboarding gate — show first-run wizard until /api/setup-status returns
  // configured: true. `null` = still loading; we render nothing in that
  // moment to avoid a flash of the regular shell.
  const [setupConfigured, setSetupConfigured] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/setup-status")
      .then((r) => r.json())
      .then((b) => { if (!cancelled) setSetupConfigured(!!b.configured); })
      .catch(() => { if (!cancelled) setSetupConfigured(true); /* fail-open: don't block on missing endpoint */ });
    return () => { cancelled = true; };
  }, []);

  if (setupConfigured === null) {
    return <div className="h-screen w-screen bg-background" />;
  }
  if (setupConfigured === false) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <React.Suspense fallback={<RouteFallback />}>
          <OnboardingRoute onComplete={() => setSetupConfigured(true)} />
        </React.Suspense>
      </div>
    );
  }
  if (route.kind === "onboarding") {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <React.Suspense fallback={<RouteFallback />}>
          <OnboardingRoute onComplete={() => setSetupConfigured(true)} />
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <main className="min-h-0 flex-1">
        <React.Suspense fallback={<RouteFallback />}>
          {route.kind === "docs" ? (
            <DocsRoute />
          ) : route.kind === "designtoken" ? (
            <DesignTokenRoute />
          ) : route.kind === "govern" ? (
            <GovernRoute />
          ) : route.kind === "patterns" ? (
            <PatternsRoute />
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
