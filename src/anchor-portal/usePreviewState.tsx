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
  /** Committed args — what the preview renders with. */
  args: Record<string, unknown>;
  /** Pending edits from the Controls panel; only flows into `args` on applyDraft(). */
  draftArgs: Record<string, unknown>;
  /** True when draftArgs diverges from args. */
  isDirty: boolean;
  /** Per-key set of arg names that differ from applied. */
  dirtyKeys: Set<string>;
  setDraftArg: (key: string, value: unknown) => void;
  applyDraft: () => void;
  discardDraft: () => void;
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
  const [appliedArgs, setAppliedArgs] = React.useState<Record<string, unknown>>({});
  const [draftArgs, setDraftArgs] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (!story) {
      setLoader(EMPTY_LOADER);
      setAppliedArgs({});
      setDraftArgs({});
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
        setAppliedArgs(merged);
        setDraftArgs(merged);
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
        setAppliedArgs({});
        setDraftArgs({});
      });
    return () => {
      cancelled = true;
    };
  }, [story, loader.storyId, loader.meta]);

  const setDraftArg = React.useCallback((key: string, value: unknown) => {
    setDraftArgs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyDraft = React.useCallback(() => {
    setAppliedArgs(draftArgs);
  }, [draftArgs]);

  const discardDraft = React.useCallback(() => {
    setDraftArgs(appliedArgs);
  }, [appliedArgs]);

  const resetArgs = React.useCallback(() => {
    setAppliedArgs(loader.defaultArgs);
    setDraftArgs(loader.defaultArgs);
  }, [loader.defaultArgs]);

  const dirtyKeys = React.useMemo(() => {
    const keys = new Set<string>();
    const all = new Set([...Object.keys(draftArgs), ...Object.keys(appliedArgs)]);
    for (const k of all) {
      if (!shallowEq(draftArgs[k], appliedArgs[k])) keys.add(k);
    }
    return keys;
  }, [draftArgs, appliedArgs]);

  const session = React.useMemo<StorySession | null>(() => {
    if (!story || !loader.meta || !loader.storyObj) return null;
    return {
      story,
      meta: loader.meta,
      storyObj: loader.storyObj,
      defaultArgs: loader.defaultArgs,
      args: appliedArgs,
      draftArgs,
      isDirty: dirtyKeys.size > 0,
      dirtyKeys,
      setDraftArg,
      applyDraft,
      discardDraft,
      resetArgs,
    };
  }, [
    story,
    loader.meta,
    loader.storyObj,
    loader.defaultArgs,
    appliedArgs,
    draftArgs,
    dirtyKeys,
    setDraftArg,
    applyDraft,
    discardDraft,
    resetArgs,
  ]);

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

/** Cheap equality for arg values: handles primitives, NaN, simple arrays/objects by JSON. */
function shallowEq(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}
