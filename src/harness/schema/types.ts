/**
 * Harness「大脑」——全组件通用的 ComponentSpec 类型系统。
 * JSON Spec（`components/*.spec.json`）与 TS 共用同一形状；JSON 中 `styleLock.blacklist[].pattern` 仅支持 **字符串**（正则字面量无法序列化）。
 */

/** JSON / 持久化层使用的 pattern 形态（见 StyleLockRule） */
export type StyleLockPatternString = string;

/** 单一 Tailwind / 任意类名字段的锁定策略 */
export type ClassSource = "consumer" | "internal" | "designToken";

export interface StyleLockRule {
  /** 人类可读说明，进入 .cursorrules */
  description: string;
  /**
   * 匹配「完整 class token」或子串。
   * - 在 **JSON spec** 中：仅使用字符串形式的正则源码，如 `"^p-"`。
   * - 在 **纯 TS** 中（若使用 `defineComponentSpec`）：可为 `RegExp`。
   */
  pattern: StyleLockPatternString | RegExp;
  /** 若设置，仅当 className 来源为 consumer 时从合并结果中剔除 */
  stripWhen?: ClassSource[];
}

export interface StyleLock {
  /**
   * 设计令牌：内部基准类名（不可被业务侧覆盖的部分语义由 density 等映射而来）。
   * 写入组件实现，而非由 AI 手写。
   */
  baselineTokens: string[];
  /**
   * 黑名单：合并 consumer `className` 时剔除的规则（间距、边框、品牌色等）。
   */
  blacklist: StyleLockRule[];
  /**
   * 允许 consumer 追加的安全前缀（可选 allowlist，用于逐步收紧）。
   * 未设置表示：除 blacklist 外允许任意「非冲突」扩展。
   */
  allowedConsumerPrefixes?: string[];
}

/** Props 在 Schema 层的描述（代码生成、Portal 与规则文案共用） */
export interface PropSemanticSpec {
  name: string;
  /** 面向设计师 / AI 的说明 */
  description: string;
  /** TS 类型字符串，便于 Portal 与文档生成 */
  type: string;
  required: boolean;
  /**
   * 业务语义值 -> 内部 tailwind / token 列表（锁定映射，禁止 AI 手写映射外的类名）。
   * 使用 Partial：同一 spec 内不同 prop 的 enumMap 键集合可以不同（如 density vs variant）。
   */
  enumMap?: Partial<Record<string, readonly string[]>>;
  defaultValue?: string | number | boolean;
}

/** 禁止在对应业务语义场景使用的原生标签（驱动「禁止项」与 harness-audit） */
export interface ForbiddenPattern {
  /** 如 table, button */
  htmlTag: string;
  reason: string;
  /** 应使用的业务组件 import 路径 */
  useInstead: string;
}

/** AI 纠错：违规模式 -> 修复指引 */
export interface AiCorrection {
  id: string;
  /** 描述违规（可由 linter 复用） */
  violation: string;
  /** 给 AI 的自然语言指令 */
  fixPrompt: string;
}

/** 组件在目录 / Portal 中的分区（便于扩展全组件族） */
export type ComponentCategory =
  | "data-display"
  | "form"
  | "feedback"
  | "navigation"
  | "layout"
  | "action"
  | "other";

export interface ComponentSpecMeta {
  owner?: string;
  tags?: string[];
  /** 设计 Portal 中默认打开的 JSON 文件名（与 `components/*.spec.json` 对应） */
  portalConfigFile?: string;
  category?: ComponentCategory;
  /** 生命周期标记（Portal / 文档可筛选） */
  status?: "experimental" | "stable" | "deprecated";
  /**
   * 可选：声明在语义上扩展另一 spec（文档与 AI 提示用；运行时合并需自行实现）。
   */
  extendsSpecId?: string;
}

/** 给 AI / 设计师的简短用法示例（不进 linter；`npm run sync:harness` 写入 .cursorrules Few-shot） */
export interface ComponentExample {
  title: string;
  description?: string;
  /** JSX 或近似 JSX 片段 */
  snippet: string;
}

/**
 * 全组件通用契约：首个验证场景为 DataTable（BusinessTable），
 * Button / Input / Form 等新增组件时复制本结构并增加 `*.spec.json` 即可接入同一套 sync / audit / Portal。
 */
export interface ComponentSpec {
  /** 稳定 id，如 business-data-table */
  id: string;
  /** 导出组件名，如 DataTable */
  componentName: string;
  version: `${number}.${number}.${number}`;
  /** 业务意图：何时用、解决什么问题 */
  intent: string;
  /** 封装的上游（Shadcn / Radix 等） */
  wraps: {
    /** 展示用，如 @/components/ui/table */
    module: string;
    /** 核心 primitive 名称列表 */
    primitives: string[];
  };
  /** 必须从 Schema / Props 显式声明且文档化的 props */
  requiredProps: PropSemanticSpec[];
  optionalProps?: PropSemanticSpec[];
  styleLock: StyleLock;
  /**
   * 给 AI 的短指令（人类可读，会进入 .cursorrules）。
   * 与 intent 区别：intent 偏产品语义，aiPrompt 偏协作约束。
   */
  aiPrompt: string;
  forbidden?: ForbiddenPattern[];
  corrections?: AiCorrection[];
  /** 引用优先：强制查找的路径前缀（与规划「强制优先 @/components/business」一致） */
  referencePriority: string[];
  meta?: ComponentSpecMeta;
  /**
   * Storybook 侧栏中 **每个 Story 变体** 的可选覆盖层（key = `getCurrentStoryData().id`，如 `datatable--playground`）。
   * 与顶层字段做深度合并后供 Harness 面板编辑；未声明的变体沿用顶层「组件基准」。
   * 代码侧 import 的 JSON 仍可只读顶层；变体层主要进入 .cursorrules / 协作提示。
   */
  storyHarness?: Record<string, Partial<Omit<ComponentSpec, "storyHarness">>>;
  /** 用法示例（可选；用于文档生成与后续自动化 prompt） */
  examples?: ComponentExample[];
  /**
   * 由 Portal / sync 聚合写入 `tailwind.harness.generated.ts`，再被根 `tailwind.config.ts` 引用。
   * （规划中的「更新 tailwind.config」在本仓库落地为：更新生成物 + config 已 import 该生成物。）
   */
  tailwindExtend?: {
    spacing?: Record<string, string>;
    colors?: Record<string, string>;
    borderRadius?: Record<string, string>;
  };
}

/** Registry 文件导出形状 */
export type ComponentSpecRegistry = Record<string, ComponentSpec>;

/** 用于合并前列举「禁止覆盖」类别（供 runtime 与文档预设） */
export const STYLE_LOCK_CATEGORY_PRESETS = {
  spacing: [/^p-/, /^px-/, /^py-/, /^pt-/, /^pb-/, /^pl-/, /^pr-/, /^m-/, /^mx-/, /^my-/, /^mt-/, /^mb-/, /^ml-/, /^mr-/, /^gap-/, /^space-[xy]-/, /^scroll-p/],
  border: [/^border/, /^rounded/, /^ring/, /^outline/, /^divide-/],
  brandColor: [
    /^bg-(primary|secondary|destructive|accent|muted|popover|card)/,
    /^text-(primary|secondary|destructive|accent|muted|foreground)/,
    /^border-(primary|secondary|input|ring)/,
    /^from-/, /^to-/, /^via-/,
  ],
} as const;

export function defineComponentSpec(spec: ComponentSpec): ComponentSpec {
  return spec;
}

/**
 * 从 spec 取「主引用路径」（用于文档 / 模板；等价于 `referencePriority[0]`）。
 */
export function primaryReference(spec: ComponentSpec): string | undefined {
  return spec.referencePriority[0];
}
