/**
 * Minimal Meta / StoryObj surface for *.demo.tsx files — drop-in replacement
 * for `@storybook/react` types used by this repo.
 *
 * Intentionally permissive: existing stories rely on inferred shapes from
 * `autoClassControls` (dynamic argTypes) and the `satisfies Meta<...>` pattern.
 * Strict typing here would require regenerating every story.
 */

import type { ComponentType, ReactElement, ReactNode } from "react";

export type LayoutMode = "centered" | "fullscreen" | "padded";

export type ControlShorthand =
  | "boolean"
  | "text"
  | "number"
  | "select"
  | "radio"
  | "check"
  | "inline-radio"
  | "inline-check"
  | "multi-select"
  | "color"
  | "date"
  | "object"
  | "range"
  | "file";

export type ControlConfig =
  | ControlShorthand
  | false
  | null
  | {
      type?: ControlShorthand;
      options?: ReadonlyArray<unknown>;
      labels?: Record<string, string>;
      min?: number;
      max?: number;
      step?: number;
      presetColors?: ReadonlyArray<string>;
      [k: string]: unknown;
    };

export type ArgType = {
  name?: string;
  description?: string;
  control?: ControlConfig;
  options?: ReadonlyArray<unknown>;
  type?: unknown;
  defaultValue?: unknown;
  table?: {
    disable?: boolean;
    category?: string;
    subcategory?: string;
    defaultValue?: { summary?: string; detail?: string };
    type?: { summary?: string; detail?: string };
  };
  if?: { arg: string; eq?: unknown; neq?: unknown; truthy?: boolean };
  [k: string]: unknown;
};

export type Parameters = {
  layout?: LayoutMode;
  anchorTokenCompliance?: unknown;
  docs?: { disable?: boolean; [k: string]: unknown };
  [k: string]: unknown;
};

export type StoryContext<TArgs = Record<string, unknown>> = {
  id: string;
  name: string;
  title: string;
  args: TArgs;
  parameters: Parameters;
  globals: Record<string, unknown>;
};

export type Decorator<TArgs = Record<string, unknown>> = (
  Story: (args?: Partial<TArgs>) => ReactElement,
  context: StoryContext<TArgs>,
) => ReactNode;

type ArgsOf<T> =
  T extends ComponentType<infer P>
    ? P extends object
      ? P
      : Record<string, unknown>
    : T extends { args?: infer A }
      ? A extends object
        ? A
        : Record<string, unknown>
      : T extends object
        ? T
        : Record<string, unknown>;

export type Meta<T = unknown> = {
  title?: string;
  id?: string;
  component?: ComponentType<unknown>;
  subcomponents?: Record<string, ComponentType<unknown>>;
  parameters?: Parameters;
  args?: Partial<ArgsOf<T>>;
  argTypes?: Record<string, ArgType>;
  decorators?: ReadonlyArray<Decorator<ArgsOf<T>>>;
  tags?: ReadonlyArray<string>;
  render?: (args: ArgsOf<T>, context: StoryContext<ArgsOf<T>>) => ReactElement;
  play?: (context: StoryContext<ArgsOf<T>>) => void | Promise<void>;
  loaders?: ReadonlyArray<unknown>;
};

export type StoryObj<TMeta = Meta<unknown>> = {
  name?: string;
  storyName?: string;
  args?: TMeta extends Meta<infer T> ? Partial<ArgsOf<T>> : Record<string, unknown>;
  argTypes?: Record<string, ArgType>;
  parameters?: Parameters;
  decorators?: TMeta extends Meta<infer T>
    ? ReadonlyArray<Decorator<ArgsOf<T>>>
    : ReadonlyArray<Decorator>;
  tags?: ReadonlyArray<string>;
  render?: TMeta extends Meta<infer T>
    ? (args: ArgsOf<T>, ctx: StoryContext<ArgsOf<T>>) => ReactElement
    : (args: Record<string, unknown>, ctx: StoryContext) => ReactElement;
  play?: TMeta extends Meta<infer T>
    ? (ctx: StoryContext<ArgsOf<T>>) => void | Promise<void>
    : (ctx: StoryContext) => void | Promise<void>;
};

/** Story module shape after import — default export is Meta, named exports are StoryObj */
export type DemoModule = {
  default: Meta;
  [storyName: string]: Meta | StoryObj | unknown;
};
