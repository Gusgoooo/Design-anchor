import * as React from "react";
import type { Meta, Parameters, StoryContext, StoryObj } from "./argTypes-types";
import {
  findStoryById,
  loadDemoModule,
  useRegistry,
  type ComponentEntry,
  type StoryEntry,
} from "./story-registry";

export type StorySession = {
  story: StoryEntry;
  meta: Meta;
  storyObj: StoryObj;
  defaultArgs: Record<string, unknown>;
  args: Record<string, unknown>;
  setArg: (key: string, value: unknown) => void;
  resetArgs: () => void;
};

type LoaderState = {
  storyId: string | null;
  meta: Meta | null;
  storyObj: StoryObj | null;
  defaultArgs: Record<string, unknown>;
  loading: boolean;
  error: string | null;
};

const EMPTY_LOADER: LoaderState = {
  storyId: null,
  meta: null,
  storyObj: null,
  defaultArgs: {},
  loading: false,
  error: null,
};

type SessionCtxValue = {
  registry: ComponentEntry[] | null;
  story: StoryEntry | null;
  session: StorySession | null;
  loading: boolean;
  error: string | null;
};

const SessionCtx = React.createContext<SessionCtxValue>({
  registry: null,
  story: null,
  session: null,
  loading: false,
  error: null,
});

export function useStorySession(): SessionCtxValue {
  return React.useContext(SessionCtx);
}

export function StorySessionProvider({
  storyId,
  children,
}: {
  storyId: string | null;
  children: React.ReactNode;
}) {
  const registry = useRegistry();
  const story = React.useMemo(
    () => (registry && storyId ? findStoryById(registry, storyId) : null),
    [registry, storyId],
  );

  const [loader, setLoader] = React.useState<LoaderState>(EMPTY_LOADER);
  const [args, setArgs] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (!story) {
      setLoader(EMPTY_LOADER);
      setArgs({});
      return;
    }
    if (loader.storyId === story.id && loader.meta) return;

    let cancelled = false;
    setLoader((prev) => ({ ...prev, loading: true, error: null }));
    loadDemoModule(story.filePath)
      .then((mod) => {
        if (cancelled) return;
        const meta = (mod.default as Meta) ?? {};
        const storyObj = (mod[story.exportName] as StoryObj | undefined) ?? {};
        const merged: Record<string, unknown> = {
          ...((meta.args as Record<string, unknown>) ?? {}),
          ...((storyObj.args as Record<string, unknown>) ?? {}),
        };
        setLoader({
          storyId: story.id,
          meta,
          storyObj,
          defaultArgs: merged,
          loading: false,
          error: null,
        });
        setArgs(merged);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoader({
          storyId: story.id,
          meta: null,
          storyObj: null,
          defaultArgs: {},
          loading: false,
          error: String(err),
        });
        setArgs({});
      });
    return () => {
      cancelled = true;
    };
  }, [story, loader.storyId, loader.meta]);

  const setArg = React.useCallback((key: string, value: unknown) => {
    setArgs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetArgs = React.useCallback(() => {
    setArgs(loader.defaultArgs);
  }, [loader.defaultArgs]);

  const session = React.useMemo<StorySession | null>(() => {
    if (!story || !loader.meta || !loader.storyObj) return null;
    return {
      story,
      meta: loader.meta,
      storyObj: loader.storyObj,
      defaultArgs: loader.defaultArgs,
      args,
      setArg,
      resetArgs,
    };
  }, [story, loader.meta, loader.storyObj, loader.defaultArgs, args, setArg, resetArgs]);

  const value = React.useMemo<SessionCtxValue>(
    () => ({ registry, story, session, loading: loader.loading, error: loader.error }),
    [registry, story, session, loader.loading, loader.error],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

/** Merge meta + story params into a single Parameters object */
export function mergeParameters(session: StorySession): Parameters {
  return {
    ...(session.meta.parameters ?? {}),
    ...(session.storyObj.parameters ?? {}),
  };
}

export function buildStoryContext(session: StorySession): StoryContext {
  return {
    id: session.story.id,
    name: session.story.storyName,
    title: session.story.componentTitle,
    args: session.args,
    parameters: mergeParameters(session),
    globals: {},
  };
}
