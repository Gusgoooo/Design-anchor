import * as React from "react";
import { AlertCircle, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildStoryContext,
  mergeParameters,
  type StorySession,
} from "../usePreviewState";
import type { LayoutMode, StoryContext } from "../argTypes-types";

class StoryErrorBoundary extends React.Component<
  { sessionId: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { sessionId: string }) {
    if (prev.sessionId !== this.props.sessionId && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="m-8 flex max-w-xl flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle size={14} /> Story render error
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">{String(this.state.error.stack || this.state.error.message)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function renderStoryElement(session: StorySession): React.ReactNode {
  const { meta, storyObj, args } = session;
  const ctx = buildStoryContext(session);
  const renderFn = storyObj.render ?? meta.render;
  if (renderFn) return renderFn(args, ctx);
  if (meta.component) {
    const Comp = meta.component;
    return <Comp {...args} />;
  }
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <ImageOff size={14} />
      No <code className="font-mono">render</code> function nor{" "}
      <code className="font-mono">component</code> set on this story.
    </div>
  );
}

/** Wrap result through decorators. Meta decorators are outermost, then story decorators. */
function applyDecorators(session: StorySession, base: () => React.ReactNode): React.ReactElement {
  const ctx = buildStoryContext(session);
  const decorators = [
    ...(session.meta.decorators ?? []),
    ...(session.storyObj.decorators ?? []),
  ];
  let wrapped: () => React.ReactNode = base;
  for (let i = decorators.length - 1; i >= 0; i--) {
    const dec = decorators[i];
    const prev = wrapped;
    wrapped = () => dec((_args?: Partial<Record<string, unknown>>) => prev() as React.ReactElement, ctx);
  }
  return <>{wrapped()}</>;
}

function LayoutWrapper({
  layout,
  children,
}: {
  layout: LayoutMode;
  children: React.ReactNode;
}) {
  if (layout === "fullscreen") {
    return <div className="h-full w-full">{children}</div>;
  }
  if (layout === "padded") {
    return <div className="p-8">{children}</div>;
  }
  // centered (default)
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="w-full max-w-[480px]">{children}</div>
    </div>
  );
}

export function PreviewFrame({ session }: { session: StorySession }) {
  const params = mergeParameters(session);
  const layout: LayoutMode = (params.layout as LayoutMode) ?? "centered";

  // Re-mount the story tree when the story changes so decorators that hold
  // local state don't bleed across navigations.
  const subtree = React.useMemo(() => {
    return applyDecorators(session, () => renderStoryElement(session));
    // session is recreated each time args or story changes — useMemo with full session keeps it stable
  }, [session]);

  return (
    <StoryErrorBoundary sessionId={session.story.id}>
      <LayoutWrapper layout={layout}>{subtree}</LayoutWrapper>
    </StoryErrorBoundary>
  );
}

/** Compact context exported for debugging in dev only */
export type _PreviewDebug = { ctx: StoryContext; layout: LayoutMode };
export const _previewDebug = (session: StorySession): _PreviewDebug => ({
  ctx: buildStoryContext(session),
  layout: ((mergeParameters(session).layout as LayoutMode) ?? "centered") as LayoutMode,
});

export { LayoutWrapper };
