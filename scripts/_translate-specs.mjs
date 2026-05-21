#!/usr/bin/env node
/**
 * One-shot script to translate all Chinese text in spec.json files to English.
 * Run once, then delete this file.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const dir = "src/anchor/schema/components";

// Translation maps for common patterns
const propDescMap = {
  "子内容": "Children content",
  "按钮文案或图标": "Button label or icon",
  "提示内容（通常包含 AlertTitle 和 AlertDescription）": "Alert content (typically AlertTitle + AlertDescription)",
  "视觉变体": "Visual variant",
  "主内容区域": "Main content area",
  "可选模型列表": "Available model list",
  "触发器视觉变体": "Trigger visual variant",
  "触发器尺寸": "Trigger size",
  "组件结构：ReasoningTrigger + ReasoningContent > ReasoningText": "Structure: ReasoningTrigger + ReasoningContent > ReasoningText",
  "初始展开状态": "Initial expanded state",
  "工具名称（显示在 Trigger 上）": "Tool name (shown on Trigger)",
  "工具调用状态": "Tool call status",
  "工具调用参数 JSON 字符串": "Tool call arguments JSON string",
  "工具调用结果": "Tool call result",
  "ToolGroupTrigger + ToolGroupContent 结构": "ToolGroupTrigger + ToolGroupContent structure",
  "工具调用计数（Trigger 显示）": "Tool call count (shown in Trigger)",
  "是否正在执行（Trigger 显示旋转动画）": "Whether executing (Trigger shows spinner)",
  "悬停提示文字": "Tooltip text",
  "图标元素": "Icon element",
  "Tooltip 弹出方向": "Tooltip placement",
  "按钮变体（继承 Button）": "Button variant (inherits Button)",
  "尺寸规格": "Size",
  "禁用状态": "Disabled state",
  "当前选中模型 ID": "Currently selected model ID",
  "选择回调": "Selection callback",
  "用户消息列表": "User message list",
  "发送消息回调": "Send message callback",
  "是否加载中": "Loading state",
  "占位提示文字": "Placeholder text",
  "容器 className": "Container className",
  "输入值": "Input value",
  "值变更回调": "Value change callback",
  "文件列表": "File list",
  "移除附件回调": "Remove attachment callback",
  "最大文件数": "Max file count",
  "接受的文件类型": "Accepted file types",
  "建议列表": "Suggestion list",
  "点击建议回调": "Suggestion click callback",
  "Markdown 文本内容": "Markdown text content",
  "代码块是否显示复制按钮": "Show copy button for code blocks",
  "代码块是否显示行号": "Show line numbers for code blocks",
  "组件结构：Thread > (Message | Composer)": "Structure: Thread > (Message | Composer)",
  "AI 消息文字": "AI message text",
  "消息角色": "Message role",
  "消息时间戳": "Message timestamp",
  "Composer 位置": "Composer placement",
  "是否可关闭": "Whether dismissible",
  "关闭回调": "Close callback",
  "标题文字": "Title text",
  "描述文字": "Description text",
  "抽屉位置": "Drawer position",
  "弹出方向": "Popup direction",
  "宽度": "Width",
  "高度": "Height",
  "偏移量": "Offset",
  "延迟显示（ms）": "Show delay (ms)",
  "延迟隐藏（ms）": "Hide delay (ms)",
  "对齐方式": "Alignment",
  "默认值": "Default value",
  "数据行数组": "Data rows array",
  "列定义数组": "Column definitions array",
  "分页配置": "Pagination config",
  "行选择回调": "Row selection callback",
  "密度模式": "Density mode",
  "排序状态": "Sort state",
  "筛选状态": "Filter state",
  "步长": "Step",
  "最小值": "Min value",
  "最大值": "Max value",
  "方向": "Direction",
  "颜色模式": "Color mode",
  "是否必填": "Required",
  "错误信息": "Error message",
  "标签文字": "Label text",
  "选项列表": "Options list",
  "默认展开": "Default expanded",
  "可折叠": "Collapsible",
  "手风琴模式（单项展开）": "Accordion mode (single item expanded)",
  "触发区域": "Trigger area",
  "分隔方向": "Separator direction",
  "是否为装饰性": "Whether decorative",
  "加载动画类型": "Loading animation type",
  "比例值（宽/高）": "Aspect ratio (width/height)",
  "是否选中": "Whether checked",
  "选中变更回调": "Check change callback",
  "indeterminate 状态": "Indeterminate state",
  "是否开启": "Whether enabled",
  "开关变更回调": "Toggle callback",
  "滑块值": "Slider value",
  "值变更回调（实时）": "Value change callback (real-time)",
  "文本域值": "Textarea value",
  "最小行数": "Min rows",
  "最大行数": "Max rows",
  "自动调整高度": "Auto-resize height",
  "头像图片 URL": "Avatar image URL",
  "备用文字（图片加载失败时显示缩写）": "Fallback text (shown when image fails)",
  "头像尺寸": "Avatar size",
  "进度值（0-100）": "Progress value (0-100)",
  "标签位置": "Label position",
  "加载状态文字": "Loading state text",
  "当前值": "Current value",
  "激活的 Tab 值": "Active tab value",
  "Tab 变更回调": "Tab change callback",
  "Tab 列表方向": "Tab list direction",
  "Popover 内容": "Popover content",
  "触发器内容": "Trigger content",
  "菜单项列表": "Menu item list",
  "子菜单支持": "Sub-menu support",
  "菜单项点击回调": "Menu item click callback",
  "滚动区域内容": "Scroll area content",
  "滚动条可见性": "Scrollbar visibility",
  "水平滚动": "Horizontal scroll",
  "最大高度": "Max height",
};

// Blacklist description translations (pattern-based)
function translateBlacklist(desc) {
  if (!desc || !/[一-鿿]/.test(desc)) return desc;

  const map = {
    "禁止覆盖过渡动画": "Do not override transition animations",
    "禁止覆盖层级定位": "Do not override z-index positioning",
    "禁止覆盖动画（由组件内部控制）": "Do not override animations (controlled internally)",
    "禁止覆盖内边距与圆角": "Do not override padding and border-radius",
    "禁止覆盖语义颜色（由 variant 控制）": "Do not override semantic colors (controlled by variant)",
    "禁止覆盖溢出与定位": "Do not override overflow and positioning",
    "禁止覆盖定位与层级": "Do not override positioning and z-index",
    "禁止覆盖弹窗尺寸": "Do not override popup dimensions",
    "禁止覆盖动画": "Do not override animations",
    "禁止覆盖弹窗背景与边框": "Do not override popup background and border",
    "禁止覆盖布局结构（flex 分割由内部控制）": "Do not override layout structure (flex split controlled internally)",
    "禁止覆盖分隔线与拖拽行为": "Do not override separator and drag behavior",
    "禁止覆盖容器高度": "Do not override container height",
    "禁止覆盖附件容器圆角与边框": "Do not override attachment container radius and border",
    "禁止覆盖附件缩略图尺寸": "Do not override attachment thumbnail size",
    "禁止覆盖按钮高度与内边距（由 size 映射）": "Do not override button height and padding (mapped by size)",
    "禁止覆盖圆角（由 design token --radius 驱动）": "Do not override border-radius (driven by design token --radius)",
    "禁止覆盖品牌/语义色（由 variant 映射）": "Do not override brand/semantic colors (mapped by variant)",
    "禁止任意值间距": "Do not use arbitrary spacing values",
    "禁止覆盖输入框高度与边框色": "Do not override input height and border color",
    "禁止覆盖焦点环": "Do not override focus ring",
    "禁止覆盖表格内边距（由密度令牌控制）": "Do not override table padding (controlled by density tokens)",
    "禁止覆盖表头背景": "Do not override table header background",
    "禁止覆盖表格行高": "Do not override table row height",
    "禁止覆盖消息气泡圆角与间距": "Do not override message bubble radius and spacing",
    "禁止覆盖消息列表滚动行为": "Do not override message list scroll behavior",
    "禁止覆盖输入区域布局": "Do not override input area layout",
    "禁止覆盖消息列表间距": "Do not override message list spacing",
    "禁止覆盖头像尺寸与圆角": "Do not override avatar size and border-radius",
    "禁止覆盖进度条高度与圆角": "Do not override progress bar height and radius",
    "禁止覆盖标签页指示器": "Do not override tab indicator",
    "禁止覆盖标签页间距": "Do not override tab spacing",
    "禁止覆盖 Checkbox 尺寸": "Do not override checkbox size",
    "禁止覆盖 Switch 尺寸": "Do not override switch size",
    "禁止覆盖 Slider 轨道": "Do not override slider track",
    "禁止覆盖 Dialog 遮罩层": "Do not override dialog overlay",
    "禁止覆盖 Dialog 定位": "Do not override dialog positioning",
    "禁止覆盖 Popover 定位": "Do not override popover positioning",
    "禁止覆盖 Popover 箭头": "Do not override popover arrow",
    "禁止覆盖 DropdownMenu 定位": "Do not override dropdown menu positioning",
    "禁止覆盖 Tooltip 定位": "Do not override tooltip positioning",
    "禁止覆盖 Tooltip 动画": "Do not override tooltip animation",
    "禁止覆盖 ScrollArea 滚动条": "Do not override scroll area scrollbar",
    "禁止覆盖滚动条样式": "Do not override scrollbar styles",
    "禁止覆盖 Select 下拉定位": "Do not override select dropdown positioning",
    "禁止覆盖文字颜色（由语义 token 驱动）": "Do not override text color (driven by semantic tokens)",
    "禁止覆盖卡片间距（由 p-* token 控制）": "Do not override card spacing (controlled by p-* tokens)",
    "禁止覆盖卡片圆角与阴影": "Do not override card radius and shadow",
    "禁止覆盖分隔线颜色": "Do not override separator color",
    "禁止覆盖骨架屏动画": "Do not override skeleton animation",
    "禁止覆盖标签字重与尺寸": "Do not override label font-weight and size",
    "禁止覆盖 Badge 内边距": "Do not override badge padding",
    "禁止覆盖 Badge 圆角": "Do not override badge border-radius",
    "禁止覆盖侧边栏宽度（由 CSS 变量控制）": "Do not override sidebar width (controlled by CSS variables)",
    "禁止覆盖侧边栏动画": "Do not override sidebar animation",
    "禁止覆盖面板分割比例": "Do not override panel split ratio",
    "禁止覆盖面板最小尺寸": "Do not override panel minimum size",
    "禁止覆盖模型列表布局": "Do not override model list layout",
    "禁止覆盖模型项交互状态": "Do not override model item interaction state",
    "禁止覆盖思考动画时序": "Do not override reasoning animation timing",
    "禁止覆盖思考容器布局": "Do not override reasoning container layout",
    "禁止覆盖工具调用状态色": "Do not override tool call status colors",
    "禁止覆盖工具组折叠动画": "Do not override tool group collapse animation",
    "禁止覆盖建议列表布局": "Do not override suggestion list layout",
    "禁止覆盖建议项交互状态": "Do not override suggestion item interaction states",
    "禁止覆盖 Markdown 排版": "Do not override Markdown typography",
    "禁止覆盖代码块主题": "Do not override code block theme",
  };

  if (map[desc]) return map[desc];

  // Generic fallback patterns
  if (desc.startsWith("禁止覆盖")) {
    return "Do not override " + desc.replace("禁止覆盖", "").replace("（", " (").replace("）", ")");
  }
  if (desc.startsWith("禁止")) {
    return "Forbidden: " + desc.replace("禁止", "");
  }
  return desc;
}

// Translate intent field
function translateIntent(intent) {
  if (!intent || !/[一-鿿]/.test(intent)) return intent;

  const intentMap = {
    "所有可点击行为的统一入口：主操作、次要操作、链接导航等；禁止在业务页散落原生 <button> 并手写间距与品牌色。": "Unified clickable action entry for primary, secondary, and link navigation actions. Raw <button> with manual spacing and brand colors is forbidden.",
    "表单输入统一入口：文本、密码、邮箱等；禁止裸 <input> 以保证高度、边框与 focus 样式一致。": "Unified form input for text, password, email, etc. Raw <input> is forbidden to ensure consistent height, border, and focus styles.",
    "数据表格的唯一入口：排序、筛选、分页、密度模式、行选择。禁止原生 <table> + 手写样式。": "Single entry for data tables: sorting, filtering, pagination, density modes, row selection. Raw <table> + manual styling is forbidden.",
  };

  if (intentMap[intent]) return intentMap[intent];

  // Fallback: simplify long Chinese sentences
  // Remove common Chinese filler and translate key patterns
  let result = intent;
  result = result.replace(/禁止在业务页[^。]*。?/g, "");
  result = result.replace(/；禁止[^。]*。?/g, ". ");
  result = result.replace(/；/g, "; ");
  result = result.replace(/。/g, ". ");
  result = result.replace(/（/g, " (").replace(/）/g, ")");
  result = result.replace(/、/g, ", ");

  // If still mostly Chinese, return a generic English version
  if (/[一-鿿]/.test(result)) {
    // Return as-is, we'll handle the rest in a second pass
    return intent;
  }
  return result.trim();
}

// Translate aiPrompt
function translateAiPrompt(prompt) {
  if (!prompt || !/[一-鿿]/.test(prompt)) return prompt;

  // Common patterns
  let result = prompt;
  result = result.replace(/需要.*?时必须使用/g, "Must use ");
  result = result.replace(/通过 variant 控制视觉风格/g, "Use variant prop for visual style");
  result = result.replace(/通过 size 控制尺寸/g, "Use size prop for dimensions");
  result = result.replace(/禁止在 JSX 上堆叠.*?覆盖/g, "Do not stack Tailwind overrides on JSX");
  result = result.replace(/颜色仅允许 design token 语义类/g, "Colors must use design token semantic classes only");
  result = result.replace(/禁止/g, "Forbidden: ");
  result = result.replace(/必须/g, "Must ");
  result = result.replace(/；/g, ". ");
  result = result.replace(/。/g, ". ");
  result = result.replace(/（/g, " (").replace(/）/g, ")");
  result = result.replace(/、/g, ", ");

  if (/[一-鿿]/.test(result)) return prompt; // Keep original if still has Chinese
  return result.trim().replace(/\.\s*\./g, ".").replace(/\s+/g, " ");
}

function translatePropDesc(desc) {
  if (!desc || !/[一-鿿]/.test(desc)) return desc;
  if (propDescMap[desc]) return propDescMap[desc];

  // Generic patterns
  let result = desc;
  result = result.replace(/（/g, " (").replace(/）/g, ")");
  result = result.replace(/、/g, ", ");

  if (/[一-鿿]/.test(result)) return desc;
  return result;
}

function translateForbiddenReason(reason) {
  if (!reason || !/[一-鿿]/.test(reason)) return reason;
  const map = {
    "禁止在业务页面手写聊天容器（div+输入框+消息列表）代替 Thread 组件": "Do not hand-build chat containers (div+input+message list) instead of using the Thread component",
    "业务场景禁止裸 <button>，以保证圆角、间距与品牌色一致": "Raw <button> is forbidden to ensure consistent border-radius, spacing, and brand colors",
    "业务列表应走统一 DataTable，以确保间距与品牌锁一致": "Business lists must use DataTable to ensure consistent spacing and brand compliance",
    "业务场景禁止裸 <input>，以保证高度、边框与 focus 样式一致": "Raw <input> is forbidden to ensure consistent height, border, and focus styles",
  };
  return map[reason] || reason;
}

function translateCorrection(obj) {
  if (!obj) return obj;
  if (obj.violation && /[一-鿿]/.test(obj.violation)) {
    obj.violation = obj.violation
      .replace("在 features/** 或 pages/** 使用原生", "Using raw native ")
      .replace("在业务页面", "In app pages, using ")
      .replace("使用原生", "using raw ");
    if (/[一-鿿]/.test(obj.violation)) {
      obj.violation = "Violation: using raw tag or hand-built alternative";
    }
  }
  if (obj.fixPrompt && /[一-鿿]/.test(obj.fixPrompt)) {
    obj.fixPrompt = obj.fixPrompt
      .replace(/替换为/g, "Replace with ")
      .replace(/用 variant 和 size props 控制样式/g, "Use variant and size props for styling")
      .replace(/。/g, ". ")
      .replace(/，/g, ", ");
    if (/[一-鿿]/.test(obj.fixPrompt)) {
      obj.fixPrompt = "Replace with the proper component import and use semantic props for styling.";
    }
  }
  return obj;
}

// Process all files
const files = readdirSync(dir).filter(f => f.endsWith(".spec.json"));
let totalTranslated = 0;

for (const file of files) {
  const filePath = join(dir, file);
  const spec = JSON.parse(readFileSync(filePath, "utf8"));
  let changed = false;

  // Translate intent
  if (spec.intent && /[一-鿿]/.test(spec.intent)) {
    spec.intent = translateIntent(spec.intent);
    changed = true;
  }

  // Translate aiPrompt
  if (spec.aiPrompt && /[一-鿿]/.test(spec.aiPrompt)) {
    spec.aiPrompt = translateAiPrompt(spec.aiPrompt);
    changed = true;
  }

  // Translate prop descriptions
  for (const prop of (spec.requiredProps || [])) {
    if (prop.description && /[一-鿿]/.test(prop.description)) {
      prop.description = translatePropDesc(prop.description);
      changed = true;
    }
  }
  for (const prop of (spec.optionalProps || [])) {
    if (prop.description && /[一-鿿]/.test(prop.description)) {
      prop.description = translatePropDesc(prop.description);
      changed = true;
    }
  }

  // Translate styleLock blacklist
  if (spec.styleLock?.blacklist) {
    for (const item of spec.styleLock.blacklist) {
      if (item.description && /[一-鿿]/.test(item.description)) {
        item.description = translateBlacklist(item.description);
        changed = true;
      }
    }
  }

  // Translate forbidden reasons
  if (spec.forbidden) {
    for (const item of spec.forbidden) {
      if (item.reason && /[一-鿿]/.test(item.reason)) {
        item.reason = translateForbiddenReason(item.reason);
        changed = true;
      }
    }
  }

  // Translate corrections
  if (spec.corrections) {
    for (const item of spec.corrections) {
      translateCorrection(item);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(spec, null, 2) + "\n");
    totalTranslated++;
  }
}

console.log(`Translated ${totalTranslated}/${files.length} spec files`);
