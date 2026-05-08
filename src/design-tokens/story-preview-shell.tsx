import type { ReactNode } from "react";
import { cssVar, layoutMaxWidthTokenIds, tokenIdsByCategory } from "./story-controls";

export const previewShellRadiusOptions = (): string[] =>
  Array.from(new Set([...tokenIdsByCategory("radius"), ...tokenIdsByCategory("radius-scale")]));

/** 画布级 token：多数组件 Story 共用 */
export const previewShellDefaults = {
  shellPadding: "space-6",
  shellMaxWidth: "layout-max-w-2xl",
  shellGap: "space-3",
  shellRadius: "radius-token-lg",
};

export type PreviewShellArgs = typeof previewShellDefaults;

export function previewShellArgTypes() {
  return {
    shellPadding: {
      control: "select",
      options: tokenIdsByCategory("spacing"),
      description: "预览区外层 padding（token）",
      table: { category: "画布" },
    },
    shellMaxWidth: {
      control: "select",
      options: layoutMaxWidthTokenIds(),
      description: "预览内容最大宽度（token）",
      table: { category: "画布" },
    },
    shellGap: {
      control: "select",
      options: tokenIdsByCategory("spacing"),
      description: "预览区内 flex 间距（token）",
      table: { category: "画布" },
    },
    shellRadius: {
      control: "select",
      options: previewShellRadiusOptions(),
      description: "预览区内层圆角（token）",
      table: { category: "画布" },
    },
  } as const;
}

/** 从 Story args 取出画布 token（缺省回退到 previewShellDefaults） */
export function pickPreviewShellArgs(args: Record<string, unknown>): PreviewShellArgs {
  return {
    shellPadding: (args.shellPadding as string) ?? previewShellDefaults.shellPadding,
    shellMaxWidth: (args.shellMaxWidth as string) ?? previewShellDefaults.shellMaxWidth,
    shellGap: (args.shellGap as string) ?? previewShellDefaults.shellGap,
    shellRadius: (args.shellRadius as string) ?? previewShellDefaults.shellRadius,
  };
}

export function PreviewShell({
  args,
  children,
}: {
  args: PreviewShellArgs;
  children: ReactNode;
}) {
  return (
    <div className="box-border w-full bg-transparent" style={{ padding: cssVar(args.shellPadding) }}>
      <div
        className="box-border w-full min-w-0"
        style={{
          maxWidth: cssVar(args.shellMaxWidth),
          marginLeft: "auto",
          marginRight: "auto",
          borderRadius: cssVar(args.shellRadius),
          display: "flex",
          flexDirection: "column",
          gap: cssVar(args.shellGap),
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** 与 previewShellDefaults 对应的 tokenIdArgs（供 harnessTokenCompliance） */
export const previewShellTokenIdArgNames = ["shellPadding", "shellMaxWidth", "shellGap", "shellRadius"] as const;

/** 合并画布 token + 额外 token 字段 + 扫描手写 Control 时的忽略名 */
export function storyHarnessCompliance(opts: {
  extraTokenIds?: string[];
  ignoreArgNames?: string[];
}) {
  return {
    sidebarStatus: "full" as const,
    tokenIdArgs: [...previewShellTokenIdArgNames, ...(opts.extraTokenIds ?? [])],
    scanFreeTextControls: true,
    ignoreArgNames: opts.ignoreArgNames ?? [],
  };
}
