# DesignAccord 规则镜像

与根目录 `.cursorrules` 内容一致（由 `npm run sync:accord` 生成）；请勿手改。

# DesignAccord Spec — 自动生成，请勿手改（修改 `*.spec.json` 后运行 npm run sync:accord 或 npm run generate:rules）

## 核心契约（AI 必须遵守）

1. **只用 Design Token**：颜色、间距、圆角等必须通过 token 语义类引用（如 `bg-primary`、`text-muted-foreground`），禁止硬编码色值或任意值 Tailwind。
2. **组件优先**：页面开发必须使用 Spec 声明的业务组件，禁止原生 HTML 标签替代。
3. **唯一数据源**：组件行为以 `src/accord/schema/components/*.spec.json` 为准，不凭记忆推断 API。

## 引用优先
- **主路径**：每个组件只以该组件 `referencePriority[0]` 为默认 import；禁止在多条路径间随意切换。
- 下列为全部已注册组件中出现过的路径（首条对每个 spec 为主路径，其余为备选）：
  - @/components/starter/badge
  - @/components/starter
  - @/components/starter/button
  - @/components/starter/checkbox
  - @/components/starter/data-table
  - @/components/starter/input

## 禁止项（原生 HTML）
- 不要使用 <button> — 业务场景禁止裸 <button>，以保证圆角、间距与品牌色一致；请改用：@/components/starter/button
- 不要使用 <table> — 业务列表应走统一 DataTable，以确保间距与品牌锁一致；请改用：@/components/starter/data-table
- 不要使用 <input> — 业务场景禁止裸 <input>，以保证高度、边框与 focus 样式一致；请改用：@/components/starter/input

## 样式锁定（黑名单思维）
- 禁止在业务页面为表格/按钮等叠加任意值间距类（如 `m-[13px]`、`p-[7px]`）。
- 禁止通过 className 覆盖下列语义（已在 DesignAccord styleLock 声明）：
### Accordion (accordion)
- 禁止覆盖过渡动画 — pattern: `^(transition-|duration-|data-)`
### AlertDialog (alert-dialog)
- 禁止覆盖层级定位 — pattern: `^(z-|fixed|absolute|inset)`
- 禁止覆盖动画（由组件内部控制） — pattern: `^(animate-|transition-|duration-)`
### Alert (alert)
- 禁止覆盖内边距与圆角 — pattern: `^(p-|px-|py-|rounded)`
- 禁止覆盖语义颜色（由 variant 控制） — pattern: `^(bg|text|border)-(primary|secondary|destructive|accent)`
### AspectRatio (aspect-ratio)
- 禁止覆盖溢出与定位 — pattern: `^(overflow|position|relative|absolute)`
### AssistantModal (aui-assistant-modal)
- 禁止覆盖定位与层级 — pattern: `^(z-|fixed|absolute|inset|end-|bottom-)`
- 禁止覆盖弹窗尺寸 — pattern: `^(h-|w-|max-h-|max-w-)`
- 禁止覆盖动画 — pattern: `^(animate-|transition-|duration-|data-\[state)`
- 禁止覆盖弹窗背景与边框 — pattern: `^(bg|border)-(popover|border|background)`
### AssistantSidebar (aui-assistant-sidebar)
- 禁止覆盖布局结构（flex 分割由内部控制） — pattern: `^(flex|grid|gap-|items-|justify-)`
- 禁止覆盖分隔线与拖拽行为 — pattern: `^(cursor|resize)`
- 禁止覆盖容器高度 — pattern: `^h-`
### Attachment (aui-attachment)
- 禁止覆盖附件容器圆角与边框 — pattern: `^(rounded|border)`
- 禁止覆盖附件缩略图尺寸 — pattern: `^(h-|w-|size-)`
- 禁止覆盖背景色 — pattern: `^bg-(muted|card|background)`
### FollowUpSuggestions (aui-follow-up-suggestions)
- 禁止覆盖建议按钮圆角 — pattern: `^rounded`
- 禁止覆盖交互状态色 — pattern: `^(bg|text|border)-(muted|accent|background)`
- 禁止覆盖动画 — pattern: `^(animate-|transition-)`
### MarkdownText (aui-markdown-text)
- 禁止覆盖排版样式（由 prose 统一控制） — pattern: `^(prose|leading-|tracking-)`
- 禁止覆盖代码块字体 — pattern: `^font-(mono|sans|serif)`
- 禁止覆盖代码块背景色 — pattern: `^bg-(muted|zinc|gray|slate)`
### ModelSelector (aui-model-selector)
- 禁止覆盖下拉框定位与层级 — pattern: `^(z-|fixed|absolute)`
- 禁止覆盖触发器高度与内边距（由 size 映射） — pattern: `^(h-|px-|py-)`
- 禁止覆盖下拉框背景与边框 — pattern: `^(bg|border)-(popover|input|background)`
### Reasoning (aui-reasoning)
- 禁止覆盖动画（折叠由内部控制） — pattern: `^(animate-|transition-|duration-)`
- 禁止覆盖圆角与边框（由 variant 映射） — pattern: `^(rounded|border)`
- 禁止覆盖背景色（由 variant 映射） — pattern: `^bg-(muted|secondary|accent|background)`
### AuiSelect (aui-select)
- 禁止覆盖触发器高度与内边距（由 size 映射） — pattern: `^(h-|px-|py-)`
- 禁止覆盖圆角（由 token 驱动） — pattern: `^rounded`
- 禁止覆盖下拉框定位与层级 — pattern: `^(z-|fixed|absolute)`
- 禁止覆盖品牌/状态色（由 variant 映射） — pattern: `^(bg|text|border)-(input|accent|secondary|popover)`
### ThreadList (aui-thread-list)
- 禁止覆盖列表项圆角与间距 — pattern: `^(rounded|gap-)`
- 禁止覆盖交互状态色 — pattern: `^(bg|text)-(muted|accent|destructive|popover)`
- 禁止覆盖定位与层级（下拉菜单） — pattern: `^(z-|fixed|absolute)`
### Thread (aui-thread)
- 禁止覆盖滚动与溢出行为 — pattern: `^overflow`
- 禁止覆盖动画（由内部控制） — pattern: `^(animate-|transition-|duration-)`
- 禁止覆盖背景色（由 token 驱动） — pattern: `^bg-(background|popover|accent|muted|primary|secondary)`
- 禁止覆盖容器高度（由父级控制） — pattern: `^h-`
### ToolFallback (aui-tool-fallback)
- 禁止覆盖动画（折叠由内部控制） — pattern: `^(animate-|transition-|duration-)`
- 禁止覆盖代码区域的字体 — pattern: `^font-(mono|sans|serif)`
- 禁止覆盖状态指示色 — pattern: `^(bg|text|border)-(destructive|primary|muted)`
### ToolGroup (aui-tool-group)
- 禁止覆盖动画（折叠与旋转由内部控制） — pattern: `^(animate-|transition-|duration-)`
- 禁止覆盖圆角与边框（由 variant 映射） — pattern: `^(rounded|border)`
- 禁止覆盖背景色（由 variant 映射） — pattern: `^bg-(muted|secondary|accent)`
### TooltipIconButton (aui-tooltip-icon-button)
- 禁止覆盖按钮尺寸（由 size 映射） — pattern: `^(h-|w-|size-|p-|px-|py-)`
- 禁止覆盖圆角 — pattern: `^rounded`
- 禁止覆盖 Tooltip 定位 — pattern: `^(z-|fixed|absolute)`
### Avatar (avatar)
- 禁止覆盖头像尺寸（使用 className 控制） — pattern: `^(h-|w-)[0-9]`
- 禁止覆盖圆角 — pattern: `^rounded`
### Badge (badge)
- 禁止覆盖内边距 — pattern: `^(px-|py-|p-|pt-|pb-|pl-|pr-)`
- 禁止覆盖圆角与边框 — pattern: `^(border|rounded)`
- 禁止覆盖品牌/语义色（由 variant 映射） — pattern: `^(bg|text)-(primary|secondary|destructive|accent|muted)`
- 禁止任意值间距 — pattern: `^(m|p|gap)-\[`
### Breadcrumb (breadcrumb)
- 禁止覆盖布局结构 — pattern: `^(flex|grid|gap-|items-|justify-)`
### ButtonGroup (button-group)
- 禁止覆盖溢出与定位 — pattern: `^(overflow|position|relative|absolute)`
### Button (button)
- 禁止覆盖按钮高度与内边距（由 size 映射） — pattern: `^(h-|px-|py-|p-|pt-|pb-|pl-|pr-)`
- 禁止覆盖圆角（由 design token --radius 驱动） — pattern: `^rounded`
- 禁止覆盖品牌/语义色（由 variant 映射） — pattern: `^(bg|text|border)-(primary|secondary|destructive|accent|muted)`
- 禁止任意值间距 — pattern: `^(m|p|gap|space-[xy])-\[`
### Calendar (calendar)
- 禁止覆盖焦点环样式 — pattern: `^(ring-|outline-)`
- 禁止覆盖高度（由 size 控制） — pattern: `^h-`
### Card (card)
- 禁止覆盖卡片圆角与阴影 — pattern: `^(rounded|shadow)`
- 禁止覆盖卡片背景色（由 design token 驱动） — pattern: `^bg-(card|background|primary|secondary)`
- 禁止覆盖内边距（由子组件统一控制） — pattern: `^(p-|px-|py-|pt-|pb-)`
### Carousel (carousel)
- 禁止覆盖溢出与定位 — pattern: `^(overflow|position|relative|absolute)`
### Checkbox (checkbox)
- 禁止覆盖尺寸 — pattern: `^(h-|w-|size-)`
- 禁止覆盖边框与圆角 — pattern: `^(border|rounded)`
- 禁止覆盖品牌色 — pattern: `^accent-`
- 禁止任意值间距 — pattern: `^(m|p|gap)-\[`
### Collapsible (collapsible)
- 禁止覆盖过渡动画 — pattern: `^(transition-|duration-|data-)`
### Command (command)
- 禁止覆盖焦点环样式 — pattern: `^(ring-|outline-)`
- 禁止覆盖高度（由 size 控制） — pattern: `^h-`
### ContextMenu (context-menu)
- 禁止覆盖层级定位 — pattern: `^(z-|fixed|absolute|inset)`
- 禁止覆盖动画（由组件内部控制） — pattern: `^(animate-|transition-|duration-)`
### DataTable (data-table)
- 禁止覆盖单元格与表头核心垂直内边距（由 density 映射） — pattern: `^(p|px|py|pt|pb|pl|pr)-`
- 禁止改动表格外边框与分割线语义 — pattern: `^(border|rounded|ring|outline|divide)-`
- 禁止覆盖品牌/语义色 — pattern: `^(bg|text|border)-(primary|secondary|destructive|accent|muted|card|popover)`
- 禁止任意值间距（AI 硬编码 m-[13px] 等） — pattern: `^(m|p|gap|space-[xy])-\[`
### Dialog (dialog)
- 禁止覆盖对话框定位与层级 — pattern: `^(fixed|absolute|z-)`
- 禁止覆盖最大宽度（由 DialogContent 内部控制） — pattern: `^max-w-`
- 禁止覆盖背景色与边框 — pattern: `^(bg|border)-(background|border|card)`
### Drawer (drawer)
- 禁止覆盖层级定位 — pattern: `^(z-|fixed|absolute|inset)`
- 禁止覆盖动画（由组件内部控制） — pattern: `^(animate-|transition-|duration-)`
### DropdownMenu (dropdown-menu)
- 禁止覆盖菜单定位与层级 — pattern: `^(absolute|fixed|z-)`
- 禁止覆盖菜单背景与边框 — pattern: `^(bg|border)-(popover|border)`
- 禁止覆盖圆角与阴影 — pattern: `^(rounded|shadow)`
### Empty (empty)
- 禁止覆盖动画 — pattern: `^(animate-|transition-)`
### Field (field)
- 禁止覆盖布局结构 — pattern: `^(flex|grid|gap-)`
### HoverCard (hover-card)
- 禁止覆盖层级定位 — pattern: `^(z-|fixed|absolute|inset)`
- 禁止覆盖动画（由组件内部控制） — pattern: `^(animate-|transition-|duration-)`
### InputGroup (input-group)
- 禁止覆盖焦点环样式 — pattern: `^(ring-|outline-)`
- 禁止覆盖高度（由 size 控制） — pattern: `^h-`
### InputOtp (input-otp)
- 禁止覆盖焦点环样式 — pattern: `^(ring-|outline-)`
- 禁止覆盖高度（由 size 控制） — pattern: `^h-`
### Input (input)
- 禁止覆盖输入框高度与内边距 — pattern: `^(h-|px-|py-|p-|pt-|pb-|pl-|pr-)`
- 禁止覆盖边框与圆角 — pattern: `^(border|rounded|ring|outline)`
- 禁止任意值间距 — pattern: `^(m|p|gap|space-[xy])-\[`
### Item (item)
- 禁止覆盖溢出与定位 — pattern: `^(overflow|position|relative|absolute)`
### Kbd (kbd)
- 禁止覆盖字体 — pattern: `^(font-family|font-mono|font-sans)`
### Label (label)
- 禁止覆盖字体大小与粗细 — pattern: `^(text-|font-)`
### Menubar (menubar)
- 禁止覆盖布局结构 — pattern: `^(flex|grid|gap-|items-|justify-)`
### NavigationMenu (navigation-menu)
- 禁止覆盖布局结构 — pattern: `^(flex|grid|gap-|items-|justify-)`
### Pagination (pagination)
- 禁止覆盖布局结构 — pattern: `^(flex|grid|gap-|items-|justify-)`
### Popover (popover)
- 禁止覆盖气泡框定位与层级 — pattern: `^(absolute|fixed|z-)`
- 禁止覆盖背景与边框色 — pattern: `^(bg|border)-(popover|border)`
### Progress (progress)
- 禁止覆盖进度条高度与圆角 — pattern: `^(h-|rounded)`
- 禁止覆盖轨道与填充颜色 — pattern: `^bg-(primary|secondary)`
### RadioGroup (radio-group)
- 禁止覆盖单选按钮尺寸 — pattern: `^(h-|w-)[0-9]`
- 禁止覆盖圆角（必须保持圆形） — pattern: `^rounded`
### Resizable (resizable)
- 禁止覆盖溢出与定位 — pattern: `^(overflow|position|relative|absolute)`
### ScrollArea (scroll-area)
- 禁止覆盖 overflow 行为 — pattern: `^overflow`
### Select (select)
- 禁止覆盖高度与内边距 — pattern: `^(h-|px-|py-|p-)`
- 禁止覆盖圆角 — pattern: `^rounded`
- 禁止覆盖边框与背景色 — pattern: `^(bg|border)-(input|background|primary)`
### Separator (separator)
- 禁止覆盖分隔线颜色 — pattern: `^bg-`
- 禁止覆盖尺寸（由 orientation 决定） — pattern: `^(h-|w-)`
### Sheet (sheet)
- 禁止覆盖层级定位 — pattern: `^(z-|fixed|absolute|inset)`
- 禁止覆盖动画（由组件内部控制） — pattern: `^(animate-|transition-|duration-)`
### Sidebar (sidebar)
- 禁止覆盖布局结构 — pattern: `^(flex|grid|gap-|items-|justify-)`
### Skeleton (skeleton)
- 禁止覆盖动画效果 — pattern: `^animate-`
- 禁止覆盖骨架屏背景色 — pattern: `^bg-(muted|gray|slate)`
### Slider (slider)
- 禁止覆盖轨道高度与圆角 — pattern: `^(h-|rounded)`
- 禁止覆盖轨道与滑块颜色 — pattern: `^(bg|accent)-(primary|secondary)`
### Sonner (sonner)
- 禁止覆盖动画 — pattern: `^(animate-|transition-)`
### Spinner (spinner)
- 禁止覆盖动画 — pattern: `^(animate-|transition-)`
### Switch (switch)
- 禁止覆盖开关尺寸 — pattern: `^(h-|w-)[0-9]`
- 禁止覆盖圆角（必须保持药丸形） — pattern: `^rounded`
- 禁止覆盖选中颜色 — pattern: `^(bg|peer-checked:bg)-(primary|secondary)`
### Table (table)
- 禁止覆盖表格结构 — pattern: `^(border-collapse|table-)`
### Tabs (tabs)
- 禁止覆盖 TabsList 背景色 — pattern: `^bg-(muted|background|primary|secondary)`
- 禁止覆盖圆角 — pattern: `^rounded`
- 禁止覆盖内边距与高度 — pattern: `^(h-|p-|px-|py-)`
### Textarea (textarea)
- 禁止覆盖最小高度与圆角 — pattern: `^(min-h-|rounded)`
- 禁止覆盖边框与背景 — pattern: `^(bg|border)-(input|transparent|background)`
- 禁止覆盖内边距 — pattern: `^(px-|py-|p-)`
### ToggleGroup (toggle-group)
- 禁止覆盖焦点环样式 — pattern: `^(ring-|outline-)`
- 禁止覆盖高度（由 size 控制） — pattern: `^h-`
### Toggle (toggle)
- 禁止覆盖焦点环样式 — pattern: `^(ring-|outline-)`
- 禁止覆盖高度（由 size 控制） — pattern: `^h-`
### Tooltip (tooltip)
- 禁止覆盖定位与层级 — pattern: `^(absolute|fixed|z-)`
- 禁止覆盖背景与文字色 — pattern: `^(bg|text)-(popover|foreground)`
- 禁止覆盖字体大小 — pattern: `^text-(xs|sm|base|lg)`

## 组件意图与 Spec
### Accordion
- **上游模块**: `@/components/starter/accordion`
- **子组件（Spec）**: `Accordion`、`AccordionItem`、`AccordionTrigger`、`AccordionContent`
- **Intent（业务意图）**: 可折叠内容面板组，适用于 FAQ、设置分组等需要逐项展开的场景。
- **Spec 指令**: 使用 Accordion 时从 @/components/starter/accordion 导入；可折叠内容面板组，适用于 FAQ、设置分组等需要逐项展开的场景。
### AlertDialog
- **上游模块**: `@/components/starter/alert-dialog`
- **子组件（Spec）**: `AlertDialog`、`AlertDialogPortal`、`AlertDialogOverlay`、`AlertDialogTrigger`、`AlertDialogContent`、`AlertDialogHeader`、`AlertDialogFooter`、`AlertDialogTitle`、`AlertDialogDescription`、`AlertDialogAction`、`AlertDialogCancel`
- **Intent（业务意图）**: 阻断式确认弹窗：用于不可逆操作（删除、提交）前二次确认，必须明确响应后才能继续。
- **Spec 指令**: 使用 AlertDialog 时从 @/components/starter/alert-dialog 导入；阻断式确认弹窗：用于不可逆操作（删除、提交）前二次确认，必须明确响应后才能继续。
### Alert
- **上游模块**: `@/components/starter/alert`
- **子组件（Spec）**: `Alert`、`AlertTitle`、`AlertDescription`
- **Intent（业务意图）**: 用于向用户展示重要提示信息，如成功、警告、错误等状态反馈；支持标题与描述组合。
- **Spec 指令**: 需要提示信息时使用 Alert 组件；通过 variant 控制类型（默认/错误）；内部使用 AlertTitle 和 AlertDescription 组合内容结构。
### AspectRatio
- **上游模块**: `@/components/starter/aspect-ratio`
- **子组件（Spec）**: `AspectRatio`
- **Intent（业务意图）**: 固定宽高比容器，用于图片、视频、地图等需要保持比例的媒体内容。
- **Spec 指令**: 使用 AspectRatio 时从 @/components/starter/aspect-ratio 导入；固定宽高比容器，用于图片、视频、地图等需要保持比例的媒体内容。
### AssistantModal
- **上游模块**: `@/components/starter/ai/assistant-modal`
- **子组件（Spec）**: `AssistantModal`
- **Intent（业务意图）**: 悬浮式 AI 助手弹窗。在页面右下角显示一个触发按钮，点击后弹出包含完整 Thread 的浮窗。适合需要在任意页面嵌入 AI 助手的场景。
- **Spec 指令**: 需要在页面角落嵌入浮窗式 AI 助手时使用 AssistantModal；需要包裹在 AssistantRuntimeProvider 内；组件自带触发按钮和弹窗容器，内部渲染完整 Thread。适合非 AI 核心页面的辅助场景。
### AssistantSidebar
- **上游模块**: `@/components/starter/ai/assistant-sidebar`
- **子组件（Spec）**: `AssistantSidebar`
- **Intent（业务意图）**: 侧边栏式 AI 助手。将页面分为主内容区和 AI 对话侧边栏，中间有可拖拽的分隔线。适合需要 AI 辅助的工作台场景。
- **Spec 指令**: 需要侧边栏式 AI 助手时使用 AssistantSidebar；将 children 作为主内容区传入，AI 对话面板自动出现在右侧；需要包裹在 AssistantRuntimeProvider 内；适合工作台/IDE 类页面布局。
### Attachment
- **上游模块**: `@/components/starter/ai/attachment`
- **子组件（Spec）**: `UserMessageAttachments`、`ComposerAttachments`、`ComposerAddAttachment`
- **Intent（业务意图）**: AI 对话中的附件展示与上传组件。包含用户消息附件预览、输入框附件列表、添加附件按钮。
- **Spec 指令**: AI 对话中的附件功能由 Attachment 组件系列自动处理（在 Thread 内部使用）；UserMessageAttachments 展示已发送附件，ComposerAttachments 展示待发送附件，ComposerAddAttachment 是添加按钮。通常无需手动使用。
### FollowUpSuggestions
- **上游模块**: `@/components/starter/ai/follow-up-suggestions`
- **子组件（Spec）**: `ThreadFollowupSuggestions`
- **Intent（业务意图）**: AI 回复后的跟进建议按钮组。在助手消息下方展示可点击的后续问题建议。
- **Spec 指令**: AI 回复后的跟进建议由 ThreadFollowupSuggestions 组件自动渲染（在 Thread 内部使用）；通常无需手动使用；建议内容由 runtime 的 suggestions 接口提供。
### MarkdownText
- **上游模块**: `@/components/starter/ai/markdown-text`
- **子组件（Spec）**: `MarkdownText`
- **Intent（业务意图）**: AI 消息中的 Markdown 渲染器。将 AI 返回的 Markdown 文本渲染为格式化 HTML（标题、列表、代码块、表格、链接等）。
- **Spec 指令**: AI 消息的 Markdown 渲染由 MarkdownText 组件自动处理（在 Thread 内部使用）；不需要手动调用；如果需要在 Thread 外渲染 Markdown，从 @/components/starter/ai/markdown-text 导入 MarkdownText。
### ModelSelector
- **上游模块**: `@/components/starter/ai/model-selector`
- **子组件（Spec）**: `ModelSelector`、`ModelSelectorRoot`、`ModelSelectorTrigger`、`ModelSelectorContent`
- **Intent（业务意图）**: AI 模型选择器。下拉菜单让用户切换当前对话使用的 AI 模型，支持图标、描述和禁用状态。
- **Spec 指令**: 需要模型切换功能时使用 ModelSelector；传入 models 数组（含 id/name/description/icon）；简单场景直接用 <ModelSelector models={...} />，需要自定义布局用 Root/Trigger/Content 组合。
### Reasoning
- **上游模块**: `@/components/starter/ai/reasoning`
- **子组件（Spec）**: `ReasoningRoot`、`ReasoningTrigger`、`ReasoningContent`、`ReasoningText`
- **Intent（业务意图）**: AI 推理过程展示组件（思维链）。可折叠面板，展示 AI 的思考过程，支持 outline/ghost/muted 三种视觉变体。
- **Spec 指令**: 展示 AI 思维链/推理过程时使用 Reasoning 组件；结构为 ReasoningRoot > ReasoningTrigger + ReasoningContent > ReasoningText；通过 variant 控制视觉风格；禁止自己实现折叠面板模拟推理展示。
### AuiSelect
- **上游模块**: `@/components/starter/ai/select`
- **子组件（Spec）**: `SelectRoot`、`SelectTrigger`、`SelectContent`、`SelectItem`、`SelectLabel`、`SelectGroup`、`SelectSeparator`
- **Intent（业务意图）**: AI 组件库内部的 Select（基于 Radix）。支持 outline/ghost/muted 变体和 sm/default/lg 尺寸，用于 AI 界面中的选择场景。
- **Spec 指令**: AI 界面中的选择场景使用 AuiSelect（@/components/starter/ai/select）；结构为 SelectRoot > SelectTrigger + SelectContent > SelectItem；通过 variant 和 size 控制外观；分组用 SelectGroup + SelectLabel。注意：业务页面中的普通 Select 仍使用 @/components/starter/select。
### ThreadList
- **上游模块**: `@/components/starter/ai/thread-list`
- **子组件（Spec）**: `ThreadList`
- **Intent（业务意图）**: AI 对话历史列表，展示用户的多个对话线程。支持新建、归档、删除线程操作。
- **Spec 指令**: 多对话管理场景使用 ThreadList 组件；需要配合 Thread 一起使用，放在侧边栏中；ThreadList 自带新建/归档/删除功能，无需手动实现。
### Thread
- **上游模块**: `@/components/starter/ai/thread`
- **子组件（Spec）**: `Thread`
- **Intent（业务意图）**: AI 对话线程主容器，包含消息列表、欢迎页面、输入框（Composer）及滚动控制。是 assistant-ui 的核心组件。
- **Spec 指令**: AI 对话场景使用 Thread 组件；需要包裹在 AssistantRuntimeProvider 内使用；Thread 自带消息列表、欢迎页、输入框，无需手动拼装；禁止自己实现聊天 UI。
### ToolFallback
- **上游模块**: `@/components/starter/ai/tool-fallback`
- **子组件（Spec）**: `ToolFallbackRoot`、`ToolFallbackTrigger`、`ToolFallbackContent`、`ToolFallbackArgs`、`ToolFallbackResult`、`ToolFallbackError`
- **Intent（业务意图）**: AI 工具调用展示组件。展示单个工具调用的名称、状态（running/complete/incomplete）、参数和结果。
- **Spec 指令**: 展示 AI 工具调用详情时使用 ToolFallback 组件；结构为 ToolFallbackRoot > ToolFallbackTrigger + ToolFallbackContent > (ToolFallbackArgs + ToolFallbackResult)；通过 status prop 显示运行/完成/错误状态。
### ToolGroup
- **上游模块**: `@/components/starter/ai/tool-group`
- **子组件（Spec）**: `ToolGroupRoot`、`ToolGroupTrigger`、`ToolGroupContent`
- **Intent（业务意图）**: AI 工具调用分组容器。将多个 ToolFallback 聚合在一个可折叠面板中，显示工具调用计数和活跃状态。
- **Spec 指令**: 需要聚合展示多个工具调用时使用 ToolGroup；结构为 ToolGroupRoot > ToolGroupTrigger + ToolGroupContent > (多个 ToolFallback)；通过 count 和 active 控制标题显示。
### TooltipIconButton
- **上游模块**: `@/components/starter/ai/tooltip-icon-button`
- **子组件（Spec）**: `TooltipIconButton`
- **Intent（业务意图）**: 带 Tooltip 的图标按钮。用于 AI 界面中的操作按钮（复制、编辑、重试等），悬停显示文字提示。
- **Spec 指令**: AI 界面中的图标操作按钮使用 TooltipIconButton；必须传 tooltip prop 提供无障碍说明；通常 variant='ghost' size='icon'；禁止在 AI 界面用裸 Button + 单独 Tooltip 组合。
### Avatar
- **上游模块**: `@/components/starter/avatar`
- **子组件（Spec）**: `Avatar`、`AvatarImage`、`AvatarFallback`
- **Intent（业务意图）**: 展示用户头像，支持图片加载与文字回退；用于用户列表、评论、导航栏等场景。
- **Spec 指令**: 展示用户头像时使用 Avatar + AvatarImage + AvatarFallback 组合；AvatarFallback 在图片加载失败时显示替代文字或图标。
### Badge
- **上游模块**: `@/components/starter/badge`
- **子组件（Spec）**: `Badge`
- **Intent（业务意图）**: 状态标记、标签与计数气泡的统一入口；禁止在业务页手写 span+bg 实现类似效果。
- **Spec 指令**: 需要标签/徽章时必须使用 @/components/starter/badge；通过 variant 控制风格，禁止手写背景色和间距。
### Breadcrumb
- **上游模块**: `@/components/starter/breadcrumb`
- **子组件（Spec）**: `Breadcrumb`、`BreadcrumbList`、`BreadcrumbItem`、`BreadcrumbLink`、`BreadcrumbPage`、`BreadcrumbSeparator`、`BreadcrumbEllipsis`
- **Intent（业务意图）**: 层级导航面包屑，展示当前页面在站点结构中的位置，支持逐级返回。
- **Spec 指令**: 使用 Breadcrumb 时从 @/components/starter/breadcrumb 导入；层级导航面包屑，展示当前页面在站点结构中的位置，支持逐级返回。
### ButtonGroup
- **上游模块**: `@/components/starter/button-group`
- **子组件（Spec）**: `ButtonGroup`、`ButtonGroupSeparator`、`ButtonGroupText`
- **Intent（业务意图）**: 按钮编组容器，将相关操作按钮视觉上组合为一组（如工具栏、分段控件）。
- **Spec 指令**: 使用 ButtonGroup 时从 @/components/starter/button-group 导入；按钮编组容器，将相关操作按钮视觉上组合为一组（如工具栏、分段控件）。
### Button
- **上游模块**: `@/components/starter/button`
- **子组件（Spec）**: `Button`
- **Intent（业务意图）**: 所有可点击行为的统一入口：主操作、次要操作、链接导航等；禁止在业务页散落原生 <button> 并手写间距与品牌色。
- **Spec 指令**: 需要按钮时必须使用 @/components/starter/button；通过 variant 控制视觉风格，通过 size 控制尺寸；禁止在 JSX 上堆叠 h-/px-/bg-primary 等 Tailwind 覆盖。颜色仅允许 design token 语义类。
### Calendar
- **上游模块**: `@/components/starter/calendar`
- **子组件（Spec）**: `Calendar`、`CalendarDayButton`
- **Intent（业务意图）**: 日期选择日历面板，用于日期范围选择器的核心渲染层。
- **Spec 指令**: 使用 Calendar 时从 @/components/starter/calendar 导入；日期选择日历面板，用于日期范围选择器的核心渲染层。
### Card
- **上游模块**: `@/components/starter/card`
- **子组件（Spec）**: `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardContent`、`CardFooter`
- **Intent（业务意图）**: 通用内容容器，用于分组展示相关信息；支持标题、描述、正文、底部操作等结构化布局。
- **Spec 指令**: 展示分组内容时使用 Card 组件；内部按 CardHeader > CardTitle/CardDescription > CardContent > CardFooter 的层次结构组织；禁止直接在 Card 上添加 padding 类。
### Carousel
- **上游模块**: `@/components/starter/carousel`
- **子组件（Spec）**: `Carousel`、`CarouselContent`、`CarouselItem`、`CarouselPrevious`、`CarouselNext`
- **Intent（业务意图）**: 轮播/走马灯容器，用于产品图片、banner、卡片列表等水平滚动展示。
- **Spec 指令**: 使用 Carousel 时从 @/components/starter/carousel 导入；轮播/走马灯容器，用于产品图片、banner、卡片列表等水平滚动展示。
### Checkbox
- **上游模块**: `@/components/starter/checkbox`
- **子组件（Spec）**: `Checkbox`
- **Intent（业务意图）**: 勾选/取消勾选的统一入口：表单同意项、多选过滤器、批量选择等；禁止在业务页裸用 <input type=checkbox>。
- **Spec 指令**: 需要勾选框时必须使用 @/components/starter/checkbox；禁止手写尺寸与品牌色。
### Collapsible
- **上游模块**: `@/components/starter/collapsible`
- **子组件（Spec）**: `Collapsible`、`CollapsibleTrigger`、`CollapsibleContent`
- **Intent（业务意图）**: 单个可折叠区域，比 Accordion 更轻量——用于单独的「展开/收起更多」场景。
- **Spec 指令**: 使用 Collapsible 时从 @/components/starter/collapsible 导入；单个可折叠区域，比 Accordion 更轻量——用于单独的「展开/收起更多」场景。
### Command
- **上游模块**: `@/components/starter/command`
- **子组件（Spec）**: `Command`、`CommandDialog`、`CommandInput`、`CommandList`、`CommandEmpty`、`CommandGroup`、`CommandItem`、`CommandShortcut`、`CommandSeparator`
- **Intent（业务意图）**: 命令面板（类 VS Code Ctrl+K / Spotlight），用于全局搜索、快捷操作入口。
- **Spec 指令**: 使用 Command 时从 @/components/starter/command 导入；命令面板（类 VS Code Ctrl+K / Spotlight），用于全局搜索、快捷操作入口。
### ContextMenu
- **上游模块**: `@/components/starter/context-menu`
- **子组件（Spec）**: `ContextMenu`、`ContextMenuTrigger`、`ContextMenuContent`、`ContextMenuItem`、`ContextMenuCheckboxItem`、`ContextMenuRadioItem`、`ContextMenuLabel`、`ContextMenuSeparator`、`ContextMenuShortcut`、`ContextMenuGroup`、`ContextMenuPortal`、`ContextMenuSub`、`ContextMenuSubContent`、`ContextMenuSubTrigger`、`ContextMenuRadioGroup`
- **Intent（业务意图）**: 右键上下文菜单，用于对选中内容提供上下文相关的操作选项。
- **Spec 指令**: 使用 ContextMenu 时从 @/components/starter/context-menu 导入；右键上下文菜单，用于对选中内容提供上下文相关的操作选项。
### DataTable
- **上游模块**: `@/components/ui/table`
- **子组件（Spec）**: `Table`、`TableHeader`、`TableBody`、`TableRow`、`TableHead`、`TableCell`（展示名：数据单元格（TableCell））
- **Intent（业务意图）**: 展示业务列表数据的主表格：分页、排序、批量操作在此收敛；禁止在业务页散落原生 <table> 与任意间距类。
- **Spec 指令**: 展示表格数据时必须使用 @/components/starter/data-table；通过 density/variant 表达密度与斑马纹，禁止在 JSX 上堆叠 p-/m-/border-/bg-primary 等 Tailwind；列宽用 columns 元数据或模板列，不要手写 w-[13px]。颜色与边框仅允许来自全局令牌 src/design-tokens/tokens.json 所映射的语义类（如 border-border、bg-muted），禁止手写 oklch/hex 离散值。
### Dialog
- **上游模块**: `@/components/starter/dialog`
- **子组件（Spec）**: `Dialog`、`DialogTrigger`、`DialogContent`、`DialogHeader`、`DialogFooter`、`DialogTitle`、`DialogDescription`、`DialogClose`
- **Intent（业务意图）**: 模态对话框，用于需要用户确认或输入信息的场景；阻断背景交互，支持受控与非受控模式。
- **Spec 指令**: 需要模态交互时使用 Dialog 组件；结构为 Dialog > DialogTrigger + DialogContent > DialogHeader/DialogFooter；通过 open/onOpenChange 实现受控，或使用 DialogTrigger/DialogClose 实现非受控。
### Drawer
- **上游模块**: `@/components/starter/drawer`
- **子组件（Spec）**: `Drawer`、`DrawerPortal`、`DrawerOverlay`、`DrawerTrigger`、`DrawerClose`、`DrawerContent`、`DrawerHeader`、`DrawerFooter`、`DrawerTitle`、`DrawerDescription`
- **Intent（业务意图）**: 底部/侧边抽屉面板，适用于移动端操作面板或辅助内容展示。
- **Spec 指令**: 使用 Drawer 时从 @/components/starter/drawer 导入；底部/侧边抽屉面板，适用于移动端操作面板或辅助内容展示。
### DropdownMenu
- **上游模块**: `@/components/starter/dropdown-menu`
- **子组件（Spec）**: `DropdownMenu`、`DropdownMenuTrigger`、`DropdownMenuContent`、`DropdownMenuItem`、`DropdownMenuSeparator`
- **Intent（业务意图）**: 下拉菜单，用于在触发按钮下方展示操作列表；适用于更多操作、批量操作等场景。
- **Spec 指令**: 需要下拉操作列表时使用 DropdownMenu；结构为 DropdownMenu > DropdownMenuTrigger + DropdownMenuContent > DropdownMenuItem；使用 DropdownMenuSeparator 分隔逻辑组。
### Empty
- **上游模块**: `@/components/starter/empty`
- **子组件（Spec）**: `Empty`、`EmptyHeader`、`EmptyTitle`、`EmptyDescription`、`EmptyContent`、`EmptyMedia`
- **Intent（业务意图）**: 空状态占位组件，当列表/页面无数据时展示说明文案和引导操作。
- **Spec 指令**: 使用 Empty 时从 @/components/starter/empty 导入；空状态占位组件，当列表/页面无数据时展示说明文案和引导操作。
### Field
- **上游模块**: `@/components/starter/field`
- **子组件（Spec）**: `Field`、`FieldLabel`、`FieldDescription`、`FieldError`、`FieldGroup`、`FieldLegend`、`FieldSeparator`、`FieldSet`、`FieldContent`、`FieldTitle`
- **Intent（业务意图）**: 表单字段容器，统一 label + input + description + error 的布局与无障碍绑定。
- **Spec 指令**: 使用 Field 时从 @/components/starter/field 导入；表单字段容器，统一 label + input + description + error 的布局与无障碍绑定。
### HoverCard
- **上游模块**: `@/components/starter/hover-card`
- **子组件（Spec）**: `HoverCard`、`HoverCardTrigger`、`HoverCardContent`
- **Intent（业务意图）**: 悬浮卡片，鼠标悬停时展示额外预览信息（如用户资料、链接预览）。
- **Spec 指令**: 使用 HoverCard 时从 @/components/starter/hover-card 导入；悬浮卡片，鼠标悬停时展示额外预览信息（如用户资料、链接预览）。
### InputGroup
- **上游模块**: `@/components/starter/input-group`
- **子组件（Spec）**: `InputGroup`、`InputGroupAddon`、`InputGroupButton`、`InputGroupText`、`InputGroupInput`、`InputGroupTextarea`
- **Intent（业务意图）**: 输入框组合容器，将前缀/后缀（图标、文字、按钮）与 input 视觉合为一体。
- **Spec 指令**: 使用 InputGroup 时从 @/components/starter/input-group 导入；输入框组合容器，将前缀/后缀（图标、文字、按钮）与 input 视觉合为一体。
### InputOtp
- **上游模块**: `@/components/starter/input-otp`
- **子组件（Spec）**: `InputOTP`、`InputOTPGroup`、`InputOTPSlot`、`InputOTPSeparator`
- **Intent（业务意图）**: 一次性密码输入（OTP/验证码），固定位数的分格输入框。
- **Spec 指令**: 使用 InputOtp 时从 @/components/starter/input-otp 导入；一次性密码输入（OTP/验证码），固定位数的分格输入框。
### Input
- **上游模块**: `@/components/starter/input`
- **子组件（Spec）**: `Input`
- **Intent（业务意图）**: 所有文本输入场景的统一入口：搜索、表单字段、密码等；禁止在业务页散落原生 <input> 并手写间距与边框。
- **Spec 指令**: 需要文本输入时必须使用 @/components/starter/input；禁止在 JSX 上堆叠 h-/px-/border- 等 Tailwind 覆盖。
### Item
- **上游模块**: `@/components/starter/item`
- **子组件（Spec）**: `Item`、`ItemMedia`、`ItemContent`、`ItemActions`、`ItemGroup`、`ItemSeparator`、`ItemTitle`、`ItemDescription`、`ItemHeader`、`ItemFooter`
- **Intent（业务意图）**: 列表项布局组件，提供图标/媒体 + 文本 + 操作按钮的标准行结构。
- **Spec 指令**: 使用 Item 时从 @/components/starter/item 导入；列表项布局组件，提供图标/媒体 + 文本 + 操作按钮的标准行结构。
### Kbd
- **上游模块**: `@/components/starter/kbd`
- **子组件（Spec）**: `Kbd`、`KbdGroup`
- **Intent（业务意图）**: 键盘快捷键标签，展示按键组合（如 Ctrl+S）的视觉样式。
- **Spec 指令**: 使用 Kbd 时从 @/components/starter/kbd 导入；键盘快捷键标签，展示按键组合（如 Ctrl+S）的视觉样式。
### Label
- **上游模块**: `@/components/starter/label`
- **子组件（Spec）**: `Label`
- **Intent（业务意图）**: 表单标签，与 Input/Select 等表单控件配合使用；提供一致的字体样式与禁用态关联。
- **Spec 指令**: 表单控件前必须使用 Label 组件提供标签；通过 htmlFor 关联对应控件 id；禁止用 <span> 或 <p> 代替 Label。
### Menubar
- **上游模块**: `@/components/starter/menubar`
- **子组件（Spec）**: `Menubar`、`MenubarMenu`、`MenubarTrigger`、`MenubarContent`、`MenubarItem`、`MenubarSeparator`、`MenubarLabel`、`MenubarCheckboxItem`、`MenubarRadioGroup`、`MenubarRadioItem`、`MenubarPortal`、`MenubarSubContent`、`MenubarSubTrigger`、`MenubarGroup`、`MenubarSub`、`MenubarShortcut`
- **Intent（业务意图）**: 菜单栏（类桌面应用顶部菜单），多个下拉菜单并排展示。
- **Spec 指令**: 使用 Menubar 时从 @/components/starter/menubar 导入；菜单栏（类桌面应用顶部菜单），多个下拉菜单并排展示。
### NavigationMenu
- **上游模块**: `@/components/starter/navigation-menu`
- **子组件（Spec）**: `NavigationMenu`、`NavigationMenuList`、`NavigationMenuItem`、`NavigationMenuContent`、`NavigationMenuTrigger`、`NavigationMenuLink`、`NavigationMenuIndicator`、`NavigationMenuViewport`
- **Intent（业务意图）**: 顶部导航菜单，支持简单链接列表或带下拉面板的复杂导航结构。
- **Spec 指令**: 使用 NavigationMenu 时从 @/components/starter/navigation-menu 导入；顶部导航菜单，支持简单链接列表或带下拉面板的复杂导航结构。
### Pagination
- **上游模块**: `@/components/starter/pagination`
- **子组件（Spec）**: `Pagination`、`PaginationContent`、`PaginationEllipsis`、`PaginationItem`、`PaginationLink`、`PaginationNext`、`PaginationPrevious`
- **Intent（业务意图）**: 分页导航，提供页码跳转和前后翻页控件。
- **Spec 指令**: 使用 Pagination 时从 @/components/starter/pagination 导入；分页导航，提供页码跳转和前后翻页控件。
### Popover
- **上游模块**: `@/components/starter/popover`
- **子组件（Spec）**: `Popover`、`PopoverTrigger`、`PopoverContent`
- **Intent（业务意图）**: 弹出气泡框，用于在触发元素附近展示额外内容或轻量交互；点击外部自动关闭。
- **Spec 指令**: 需要轻量弹出内容时使用 Popover；结构为 Popover > PopoverTrigger + PopoverContent；通过 align 属性控制对齐方式（start/center/end）。
### Progress
- **上游模块**: `@/components/starter/progress`
- **子组件（Spec）**: `Progress`
- **Intent（业务意图）**: 进度条，用于展示任务完成百分比；支持自定义最大值与无障碍属性。
- **Spec 指令**: 展示进度时使用 Progress 组件；通过 value 和 max 控制进度；禁止手动设置 h-/bg- 覆盖样式。
### RadioGroup
- **上游模块**: `@/components/starter/radio-group`
- **子组件（Spec）**: `RadioGroup`、`RadioGroupItem`
- **Intent（业务意图）**: 单选按钮组，用于在多个互斥选项中选择一个；支持受控与非受控模式。
- **Spec 指令**: 互斥选项选择使用 RadioGroup + RadioGroupItem；通过 value/onValueChange 实现受控；每个 RadioGroupItem 需搭配 Label 使用以保证无障碍。
### Resizable
- **上游模块**: `@/components/starter/resizable`
- **子组件（Spec）**: `ResizablePanelGroup`、`ResizablePanel`、`ResizableHandle`
- **Intent（业务意图）**: 可拖拽调整大小的面板组，用于 IDE 式多面板布局。
- **Spec 指令**: 使用 Resizable 时从 @/components/starter/resizable 导入；可拖拽调整大小的面板组，用于 IDE 式多面板布局。
### ScrollArea
- **上游模块**: `@/components/starter/scroll-area`
- **子组件（Spec）**: `ScrollArea`
- **Intent（业务意图）**: 自定义滚动区域容器，用于限制内容高度并提供滚动能力；保持滚动行为一致性。
- **Spec 指令**: 需要滚动容器时使用 ScrollArea；通过 className 设置 max-h 控制可视高度；禁止直接在容器上覆盖 overflow 类。
### Select
- **上游模块**: `@/components/starter/select`
- **子组件（Spec）**: `Select`
- **Intent（业务意图）**: 原生下拉选择器，统一边框与交互样式；用于简单选项场景，复杂异步选项请外层封装。
- **Spec 指令**: 简单选择场景使用 Select 组件包裹 <option>；禁止在业务页使用裸 <select> 标签；复杂选择器（搜索、多选）需在此基础上封装。
### Separator
- **上游模块**: `@/components/starter/separator`
- **子组件（Spec）**: `Separator`
- **Intent（业务意图）**: 分隔线，用于视觉分隔内容区域；支持水平和垂直方向。
- **Spec 指令**: 内容区域之间需要视觉分隔时使用 Separator；通过 orientation 控制方向；禁止用 <hr> 或手写 border 代替。
### Sheet
- **上游模块**: `@/components/starter/sheet`
- **子组件（Spec）**: `Sheet`、`SheetPortal`、`SheetOverlay`、`SheetTrigger`、`SheetClose`、`SheetContent`、`SheetHeader`、`SheetFooter`、`SheetTitle`、`SheetDescription`
- **Intent（业务意图）**: 侧边滑出面板（类移动端抽屉但支持上下左右四方向），用于设置面板、详情查看。
- **Spec 指令**: 使用 Sheet 时从 @/components/starter/sheet 导入；侧边滑出面板（类移动端抽屉但支持上下左右四方向），用于设置面板、详情查看。
### Sidebar
- **上游模块**: `@/components/starter/sidebar`
- **子组件（Spec）**: `Sidebar`、`SidebarContent`、`SidebarFooter`、`SidebarGroup`、`SidebarGroupAction`、`SidebarGroupContent`、`SidebarGroupLabel`、`SidebarHeader`、`SidebarInput`、`SidebarInset`、`SidebarMenu`、`SidebarMenuAction`、`SidebarMenuBadge`、`SidebarMenuButton`、`SidebarMenuItem`、`SidebarMenuSkeleton`、`SidebarMenuSub`、`SidebarMenuSubButton`、`SidebarMenuSubItem`、`SidebarProvider`、`SidebarRail`、`SidebarSeparator`、`SidebarTrigger`
- **Intent（业务意图）**: 应用侧边栏骨架，包含 header/content/footer/menu 的完整导航布局。
- **Spec 指令**: 使用 Sidebar 时从 @/components/starter/sidebar 导入；应用侧边栏骨架，包含 header/content/footer/menu 的完整导航布局。
### Skeleton
- **上游模块**: `@/components/starter/skeleton`
- **子组件（Spec）**: `Skeleton`
- **Intent（业务意图）**: 骨架屏占位符，用于内容加载时展示预期布局形态；减少页面跳动感。
- **Spec 指令**: 加载态使用 Skeleton 占位；通过 className 设置宽高模拟真实内容形状（如 h-4 w-[200px]）；禁止修改 animate-pulse 和 bg-muted。
### Slider
- **上游模块**: `@/components/starter/slider`
- **子组件（Spec）**: `Slider`
- **Intent（业务意图）**: 滑块控件，用于在一个范围内选取数值；基于原生 range input 实现。
- **Spec 指令**: 范围选值使用 Slider 组件；通过 min/max/step 控制范围；禁止覆盖轨道样式，颜色由 design token 驱动。
### Sonner
- **上游模块**: `@/components/starter/sonner`
- **子组件（Spec）**: `Toaster`
- **Intent（业务意图）**: Toast 通知（基于 sonner 库），用于轻量级操作反馈（成功/失败/提示）。
- **Spec 指令**: 使用 Sonner 时从 @/components/starter/sonner 导入；Toast 通知（基于 sonner 库），用于轻量级操作反馈（成功/失败/提示）。
### Spinner
- **上游模块**: `@/components/starter/spinner`
- **子组件（Spec）**: `Spinner`
- **Intent（业务意图）**: 加载旋转指示器，用于按钮内/区域/全屏加载状态。
- **Spec 指令**: 使用 Spinner 时从 @/components/starter/spinner 导入；加载旋转指示器，用于按钮内/区域/全屏加载状态。
### Switch
- **上游模块**: `@/components/starter/switch`
- **子组件（Spec）**: `Switch`
- **Intent（业务意图）**: 开关组件，用于布尔值切换场景（如启用/禁用功能）；基于无障碍 checkbox + 视觉化轨道实现。
- **Spec 指令**: 布尔切换场景使用 Switch 组件；搭配 Label 使用提供文字说明；禁止用 checkbox 或自定义 div 实现开关效果。
### Table
- **上游模块**: `@/components/starter/table`
- **子组件（Spec）**: `Table`、`TableHeader`、`TableBody`、`TableFooter`、`TableHead`、`TableRow`、`TableCell`、`TableCaption`
- **Intent（业务意图）**: 数据表格基础层，提供 table/thead/tbody/tr/th/td 的语义化 HTML 封装与一致样式。
- **Spec 指令**: 使用 Table 时从 @/components/starter/table 导入；数据表格基础层，提供 table/thead/tbody/tr/th/td 的语义化 HTML 封装与一致样式。
### Tabs
- **上游模块**: `@/components/starter/tabs`
- **子组件（Spec）**: `Tabs`、`TabsList`、`TabsTrigger`、`TabsContent`
- **Intent（业务意图）**: 选项卡组件，用于在同一区域内切换不同视图/面板；支持受控与非受控模式。
- **Spec 指令**: 内容面板切换使用 Tabs 组件；结构为 Tabs > TabsList > TabsTrigger + TabsContent；每个 TabsTrigger 和 TabsContent 的 value 必须对应。
### Textarea
- **上游模块**: `@/components/starter/textarea`
- **子组件（Spec）**: `Textarea`
- **Intent（业务意图）**: 多行文本输入框，用于需要较长文本输入的场景；统一边框、圆角与聚焦样式。
- **Spec 指令**: 多行输入场景使用 Textarea 组件；禁止在业务页使用裸 <textarea>；搭配 Label 使用；通过 className 仅允许添加布局类（如 w-full）。
### ToggleGroup
- **上游模块**: `@/components/starter/toggle-group`
- **子组件（Spec）**: `ToggleGroup`、`ToggleGroupItem`
- **Intent（业务意图）**: 切换按钮组，一组互斥或多选的 toggle 按钮（如视图模式：列表/网格/看板）。
- **Spec 指令**: 使用 ToggleGroup 时从 @/components/starter/toggle-group 导入；切换按钮组，一组互斥或多选的 toggle 按钮（如视图模式：列表/网格/看板）。
### Toggle
- **上游模块**: `@/components/starter/toggle`
- **子组件（Spec）**: `Toggle`
- **Intent（业务意图）**: 切换按钮（按下/弹起状态），用于启用/禁用某功能或视图模式切换。
- **Spec 指令**: 使用 Toggle 时从 @/components/starter/toggle 导入；切换按钮（按下/弹起状态），用于启用/禁用某功能或视图模式切换。
### Tooltip
- **上游模块**: `@/components/starter/tooltip`
- **子组件（Spec）**: `TooltipProvider`、`Tooltip`、`TooltipTrigger`、`TooltipContent`
- **Intent（业务意图）**: 文字提示气泡，用于鼠标悬停时展示辅助说明文字；不承载交互内容。
- **Spec 指令**: 需要悬停提示时使用 Tooltip 组件；结构为 TooltipProvider > Tooltip > TooltipTrigger + TooltipContent；内容仅限纯文字说明，交互内容请用 Popover。

## 纠错指令
- **no-raw-button**: 若 在 features/** 或 pages/** 使用原生 <button> → 替换为 import { Button } from '@/components/starter/Button'，用 variant 和 size props 控制样式。
- **no-raw-table**: 若 在 features/** 或 pages/** 使用原生 <table> → 替换为 import { DataTable } from '@/components/starter/DataTable'，数据与列定义传入 props。
- **no-hacky-spacing**: 若 在 DataTable 子树使用 m-[13px]、p-[7px] 等任意值 → 删除任意值 class，改用 DataTable 的 density 或设计约定的列模板。
- **no-raw-input**: 若 在 features/** 或 pages/** 使用原生 <input> → 替换为 import { Input } from '@/components/starter/Input'。

## 装饰/动效组件库（页面点缀）

以下第三方组件库可作为页面视觉点缀使用。核心交互仍使用 `@/components/starter/*`，装饰组件仅用于非功能性视觉增强。

**使用原则**：
- 适用场景：页面需要视觉亮点/动效点缀时（Hero 区域、Landing Page、空状态、加载态、CTA 区域）
- 用量控制：每个页面最多使用 1-2 个装饰组件，避免过度动效导致性能问题或视觉疲劳
- 优先级：核心交互组件仍然使用 @/components/starter/* ，装饰组件仅用于非功能性视觉增强
- 色彩约束：装饰组件应使用项目 design token 颜色（如 hsl(var(--primary))），避免硬编码色值

### Magic UI
- 文档：https://magicui.design
- 安装：`npx magicui-cli@latest add <component-name>`
- 组件目录：src/components/magicui/
- 运行依赖：motion
- 可用组件：
  - **text**：animated-shiny-text, number-ticker, sparkles-text, typing-animation, text-reveal, word-rotate, flip-text, gradual-spacing
  - **background**：particles, meteors, ripple, dot-pattern, grid-pattern, retro-grid
  - **layout**：bento-grid, dock, marquee, safari, iphone-15-pro
  - **card**：magic-card, neon-gradient-card, lens
  - **border**：border-beam, shimmer-button, shine-border, pulsating-button
  - **other**：animated-beam, globe, orbit, cool-mode, confetti, animated-list

### Aceternity UI
- 文档：https://ui.aceternity.com
- 安装：`npx aceternity-ui@latest add <component-name>`
- 组件目录：src/components/aceternity/
- 运行依赖：motion
- 可用组件：
  - **background**：aurora-background, background-beams, background-gradient, wavy-background, vortex, background-boxes
  - **text**：text-generate-effect, typewriter-effect, hero-highlight, flip-words, text-reveal-card
  - **card**：card-hover-effect, 3d-card-effect, direction-aware-hover, hover-border-gradient
  - **navigation**：floating-navbar
  - **border**：moving-border, glowing-stars
  - **layout**：infinite-moving-cards, lamp, spotlight, tracing-beam, parallax-scroll, sticky-scroll-reveal, images-slider
