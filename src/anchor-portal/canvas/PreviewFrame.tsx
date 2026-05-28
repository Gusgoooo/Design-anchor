import * as React from "react";
import { AlertCircle, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildStoryContext,
  mergeParameters,
  type StorySession,
} from "../usePreviewState";
import type { Decorator, LayoutMode, StoryContext } from "../argTypes-types";

type StoryArgs = Record<string, unknown>;

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

function buildStoryContextWithArgs(session: StorySession, args: StoryArgs): StoryContext {
  return { ...buildStoryContext(session), args };
}

function StoryRenderHost({
  session,
  args = session.args,
}: {
  session: StorySession;
  args?: StoryArgs;
}) {
  const { meta, storyObj } = session;
  const ctx = buildStoryContextWithArgs(session, args);
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

function StoryContent({ session }: { session: StorySession }) {
  const decorators = React.useMemo<ReadonlyArray<Decorator>>(
    () => [
      ...(session.meta.decorators ?? []),
      ...(session.storyObj.decorators ?? []),
    ],
    [session.meta.decorators, session.storyObj.decorators],
  );

  return <StoryDecoratorLayer args={session.args} decorators={decorators} index={0} session={session} />;
}

function StoryDecoratorLayer({
  args,
  decorators,
  index,
  session,
}: {
  args: StoryArgs;
  decorators: ReadonlyArray<Decorator>;
  index: number;
  session: StorySession;
}) {
  const decorator = decorators[index];
  const ctx = buildStoryContextWithArgs(session, args);

  const Story = React.useCallback(
    (nextArgs?: Partial<StoryArgs>) => (
      <StoryDecoratorLayer
        args={nextArgs ? { ...args, ...nextArgs } : args}
        decorators={decorators}
        index={index + 1}
        session={session}
      />
    ),
    [args, decorators, index, session],
  );

  if (!decorator) return <StoryRenderHost args={args} session={session} />;
  return <>{decorator(Story, ctx)}</>;
}

export function PreviewFrame({ session }: { session: StorySession }) {
  const params = mergeParameters(session);
  const layout: LayoutMode = (params.layout as LayoutMode) ?? "centered";

  return (
    <StoryErrorBoundary sessionId={session.story.id}>
      <LayoutWrapper layout={layout}>
        <StoryContent key={session.story.id} session={session} />
      </LayoutWrapper>
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
