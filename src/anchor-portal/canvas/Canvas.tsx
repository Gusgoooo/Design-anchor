import * as React from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { useRoute } from "../router";
import { useStorySession } from "../usePreviewState";
import { PreviewFrame } from "./PreviewFrame";
import { PatternsRoute } from "../docs/PatternsRoute";

export function Canvas() {
  const route = useRoute();
  const { session, loading, error, registry } = useStorySession();

  if (route.kind === "components") return <WelcomeScreen registryCount={registry?.length ?? 0} />;
  if (route.kind === "patterns") return <PatternsRoute />;

  if (loading) return <CenterMessage icon={<Loader2 size={16} className="animate-spin" />} text="Loading story…" />;
  if (error) return <CenterMessage icon={null} text={error} variant="error" />;
  if (!session) return <CenterMessage icon={null} text="Story not found in registry." variant="error" />;

  return (
    <div className="flex h-full flex-col">
      <CanvasToolbar
        title={session.story.componentTitle}
        storyName={session.story.storyName}
      />
      {/*
        transform creates a new containing block, so any
        `position: fixed` element inside a story (e.g. AssistantModal's
        `fixed end-4 bottom-4` anchor, AssistantSidebar's right-edge
        overlay) resolves to the canvas area instead of the viewport.
        This is what keeps the bottom Controls/Spec panel uncovered.
        Radix Portal-rendered dialogs/popovers are unaffected since
        they escape to document.body.
      */}
      <div
        className="relative flex-1 overflow-auto bg-background"
        style={{ transform: "translateZ(0)" }}
      >
        <PreviewFrame session={session} />
      </div>
    </div>
  );
}

function CanvasToolbar({ title, storyName }: { title: string; storyName: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-3 py-1.5 text-[12px]">
      <span className="font-medium text-foreground">{title}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{storyName}</span>
    </div>
  );
}

function WelcomeScreen({ registryCount }: { registryCount: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <MousePointerClick size={28} className="text-muted-foreground" />
      <div>
        <p className="text-base font-medium text-foreground">Welcome to Design-anchor</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {registryCount > 0
            ? `Select a story from the sidebar to preview. ${registryCount} components are available.`
            : "Add a *.demo.tsx file under src/components/ to get started."}
        </p>
      </div>
    </div>
  );
}

function CenterMessage({
  icon,
  text,
  variant,
}: {
  icon: React.ReactNode | null;
  text: string;
  variant?: "error";
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-sm ${
        variant === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {icon}
      <p className="max-w-xl whitespace-pre-wrap">{text}</p>
    </div>
  );
}
