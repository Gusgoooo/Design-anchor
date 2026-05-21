import * as React from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { useRoute } from "../router";
import { useStorySession } from "../usePreviewState";
import { PreviewFrame } from "./PreviewFrame";

export function Canvas() {
  const route = useRoute();
  const { session, loading, error, registry } = useStorySession();

  if (route.kind === "welcome") return <WelcomeScreen registryCount={registry?.length ?? 0} />;
  if (route.kind === "designtoken") return <RoutePlaceholder name="DesignToken" />;
  if (route.kind === "patterns") return <RoutePlaceholder name="Patterns" />;

  if (loading) return <CenterMessage icon={<Loader2 size={16} className="animate-spin" />} text="Loading story…" />;
  if (error) return <CenterMessage icon={null} text={error} variant="error" />;
  if (!session) return <CenterMessage icon={null} text="Story not found in registry." variant="error" />;

  return (
    <div className="flex h-full flex-col">
      <CanvasToolbar
        title={session.story.componentTitle}
        storyName={session.story.storyName}
      />
      <div className="flex-1 overflow-auto bg-background">
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

function RoutePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-sm text-muted-foreground">
      <p>
        <strong>{name}</strong> route — TODO (Stage 2.F)
      </p>
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
