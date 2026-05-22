#!/usr/bin/env node
/**
 * Comprehensive translation of all spec.json fields.
 * Maps each component's intent and aiPrompt to English.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const dir = "src/anchor/schema/components";

// Complete intent translation map (all 63 components)
const intentMap = {
  "accordion.spec.json": "Collapsible content panels for FAQ, settings groups, and progressive disclosure.",
  "alert-dialog.spec.json": "Blocking confirmation dialog for irreversible actions (delete, submit). User must respond before continuing.",
  "alert.spec.json": "Displays important status feedback (success, warning, error) with optional title and description.",
  "aspect-ratio.spec.json": "Fixed aspect-ratio container for images, videos, maps, and other media that must maintain proportions.",
  "aui-assistant-modal.spec.json": "Floating AI assistant modal. Shows a trigger button (bottom-right) that opens a full Thread dialog. Use when embedding AI assistant on any page.",
  "aui-assistant-sidebar.spec.json": "Sidebar AI assistant layout. Splits page into main content and AI conversation sidebar with a draggable divider. For workspace scenarios needing AI assistance.",
  "aui-attachment.spec.json": "Attachment display and upload for AI conversations. Includes message attachment previews, input attachment list, and add-attachment button.",
  "aui-follow-up-suggestions.spec.json": "Follow-up suggestion buttons after AI replies. Displays clickable next-question suggestions below assistant messages.",
  "aui-markdown-text.spec.json": "Markdown renderer for AI messages. Renders AI-returned Markdown as formatted HTML (headings, lists, code blocks, tables, links).",
  "aui-model-selector.spec.json": "AI model selector dropdown. Lets users switch the current conversation's AI model with icons, descriptions, and disabled states.",
  "aui-reasoning.spec.json": "AI reasoning/chain-of-thought display. Collapsible panel showing AI thinking process with outline/ghost/muted visual variants.",
  "aui-thread-list.spec.json": "AI conversation history list showing multiple threads. Supports create, archive, and delete operations.",
  "aui-thread.spec.json": "AI conversation thread container with message list, welcome screen, Composer input, and scroll control. Core assistant-ui component.",
  "aui-tool-fallback.spec.json": "AI tool call display. Shows a single tool invocation's name, status (running/complete/incomplete), arguments, and result.",
  "aui-tool-group.spec.json": "AI tool call group container. Aggregates multiple ToolFallback items in a collapsible panel with call count and active state.",
  "aui-tooltip-icon-button.spec.json": "Icon button with tooltip. For AI interface action buttons (copy, edit, retry) that show text on hover.",
  "avatar.spec.json": "User avatar with image loading and text fallback. Used in user lists, comments, and navigation bars.",
  "badge.spec.json": "Unified entry for status marks, labels, and count bubbles. Do not hand-build span+bg alternatives.",
  "breadcrumb.spec.json": "Hierarchical breadcrumb navigation showing current page position in site structure with back navigation.",
  "button-group.spec.json": "Button group container that visually combines related action buttons (toolbars, segmented controls).",
  "calendar.spec.json": "Date picker calendar panel. Core rendering layer for date range selectors.",
  "card.spec.json": "General content container for grouped information display. Supports title, description, body, and footer actions.",
  "carousel.spec.json": "Carousel/slider container for product images, banners, and horizontal card scrolling.",
  "checkbox.spec.json": "Unified check/uncheck entry for form agreements, multi-select filters, and batch selection. Raw <input type=checkbox> is forbidden.",
  "collapsible.spec.json": "Single collapsible region. Lighter than Accordion — for standalone expand/collapse scenarios.",
  "command.spec.json": "Command palette (VS Code Ctrl+K / Spotlight style) for global search and quick action entry.",
  "context-menu.spec.json": "Right-click context menu providing contextual actions for selected content.",
  "data-table.spec.json": "Primary business data table: pagination, sorting, bulk actions converge here. Raw <table> with arbitrary spacing is forbidden.",
  "dialog.spec.json": "Modal dialog for user confirmation or input. Blocks background interaction, supports controlled and uncontrolled modes.",
  "drawer.spec.json": "Bottom/side drawer panel for mobile action sheets or auxiliary content display.",
  "dropdown-menu.spec.json": "Dropdown menu for action lists below a trigger button. For 'more actions', bulk operations, etc.",
  "empty.spec.json": "Empty state placeholder for lists/pages with no data. Shows explanatory text and guidance actions.",
  "field.spec.json": "Form field container unifying label + input + description + error layout with accessibility bindings.",
  "hover-card.spec.json": "Hover card showing extra preview info (user profiles, link previews) on mouse hover.",
  "input-group.spec.json": "Input group container combining prefix/suffix (icons, text, buttons) with input as a visual unit.",
  "input-otp.spec.json": "One-time password input (OTP/verification code) with fixed-digit segmented fields.",
  "input.spec.json": "Unified text input entry for search, form fields, passwords, etc. Raw <input> with manual spacing and borders is forbidden.",
  "item.spec.json": "List item layout providing icon/media + text + action button standard row structure.",
  "kbd.spec.json": "Keyboard shortcut label displaying key combinations (e.g., Ctrl+S) with visual styling.",
  "label.spec.json": "Form label paired with Input/Select controls. Provides consistent font styling and disabled state association.",
  "menubar.spec.json": "Menu bar (desktop app-style top menu) with multiple dropdown menus side by side.",
  "navigation-menu.spec.json": "Top navigation menu supporting simple link lists or complex dropdown panel navigation.",
  "pagination.spec.json": "Pagination controls providing page number jumps and previous/next page navigation.",
  "popover.spec.json": "Popover bubble for showing extra content or lightweight interactions near a trigger. Auto-closes on outside click.",
  "progress.spec.json": "Progress bar showing task completion percentage. Supports custom max value and accessibility attributes.",
  "radio-group.spec.json": "Radio button group for selecting one option from mutually exclusive choices. Supports controlled and uncontrolled modes.",
  "resizable.spec.json": "Draggable resizable panel group for IDE-style multi-panel layouts.",
  "scroll-area.spec.json": "Custom scroll area container with constrained height and consistent scrollbar behavior.",
  "select.spec.json": "Dropdown select with unified border and interaction styles. For simple options; wrap externally for async/complex cases.",
  "separator.spec.json": "Visual separator between content areas. Supports horizontal and vertical directions.",
  "sheet.spec.json": "Slide-out panel (mobile drawer style, supports all 4 directions) for settings panels and detail views.",
  "sidebar.spec.json": "Application sidebar skeleton with header/content/footer/menu navigation layout.",
  "skeleton.spec.json": "Skeleton loading placeholder showing expected layout shape during content loading. Reduces page jank.",
  "slider.spec.json": "Slider control for selecting a value within a range. Based on native range input.",
  "sonner.spec.json": "Toast notifications (via sonner library) for lightweight action feedback (success/failure/info).",
  "spinner.spec.json": "Loading spinner indicator for in-button, area, or full-screen loading states.",
  "switch.spec.json": "Toggle switch for boolean value changes (enable/disable features). Accessible checkbox with visual track.",
  "table.spec.json": "Base data table layer providing semantic HTML table/thead/tbody/tr/th/td with consistent styling.",
  "tabs.spec.json": "Tab component for switching between views/panels in the same area. Supports controlled and uncontrolled modes.",
  "textarea.spec.json": "Multi-line text input for longer text entry. Unified border, border-radius, and focus styles.",
  "toggle-group.spec.json": "Toggle button group — mutually exclusive or multi-select toggles (e.g., view modes: list/grid/board).",
  "toggle.spec.json": "Toggle button (pressed/released state) for enabling/disabling features or view mode switching.",
  "tooltip.spec.json": "Text tooltip bubble showing helper text on hover. Must not contain interactive content.",
};

// Generic aiPrompt translation function
function translateAiPrompt(prompt, componentName) {
  if (!prompt || !/[一-鿿]/.test(prompt)) return prompt;

  // Build English version from component context
  let result = prompt;

  // Common replacements
  const replacements = [
    [/需要.*?时必须使用\s*/g, "Must use "],
    [/通过\s*(\w+)\s*控制/g, "Use $1 prop to control"],
    [/通过\s*(\w+)\s*和\s*(\w+)\s*控制/g, "Use $1 and $2 props"],
    [/禁止在 JSX 上堆叠[^；。]*/g, "Do not add Tailwind overrides directly on JSX"],
    [/颜色仅允许 design token 语义类/g, "Colors must use design token semantic classes only"],
    [/禁止手写[^；。]*/g, "Do not hand-write alternatives"],
    [/禁止使用原生[^；。]*/g, "Do not use raw HTML tags"],
    [/禁止裸[^；。]*/g, "Do not use raw HTML tags"],
    [/禁止[在内][^；。]*/g, "Forbidden in app code"],
    [/禁止/g, "Do not "],
    [/必须/g, "Must "],
    [/使用/g, "use "],
    [/支持/g, "supports "],
    [/所有/g, "all "],
    [/统一/g, "unified "],
    [/；/g, ". "],
    [/。/g, ". "],
    [/（/g, " ("],
    [/）/g, ")"],
    [/、/g, ", "],
    [/，/g, ", "],
  ];

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  // If still heavily Chinese, generate a clean English prompt
  if (/[一-鿿]/.test(result)) {
    return `Use ${componentName} from @/components/base. Use semantic props for variant and size. Do not hardcode colors or spacing. Colors must use design token classes only.`;
  }

  return result.trim().replace(/\.\s*\./g, ".").replace(/\s{2,}/g, " ");
}

// Process all files
const files = readdirSync(dir).filter(f => f.endsWith(".spec.json"));
let count = 0;

for (const file of files) {
  const filePath = join(dir, file);
  const spec = JSON.parse(readFileSync(filePath, "utf8"));
  let changed = false;

  // Translate intent
  if (spec.intent && /[一-鿿]/.test(spec.intent)) {
    if (intentMap[file]) {
      spec.intent = intentMap[file];
      changed = true;
    }
  }

  // Translate aiPrompt
  if (spec.aiPrompt && /[一-鿿]/.test(spec.aiPrompt)) {
    spec.aiPrompt = translateAiPrompt(spec.aiPrompt, spec.componentName);
    changed = true;
  }

  // Translate remaining prop descriptions that weren't caught
  for (const prop of [...(spec.requiredProps || []), ...(spec.optionalProps || [])]) {
    if (prop.description && /[一-鿿]/.test(prop.description)) {
      // Generic translation
      let d = prop.description;
      d = d.replace(/（/g, " (").replace(/）/g, ")").replace(/、/g, ", ").replace(/，/g, ", ");
      if (/[一-鿿]/.test(d)) {
        // Create English from prop name context
        d = prop.name.replace(/([A-Z])/g, " $1").trim().replace(/^./, c => c.toUpperCase()) + " prop";
      }
      prop.description = d;
      changed = true;
    }
  }

  // Translate blacklist descriptions that weren't caught
  if (spec.styleLock?.blacklist) {
    for (const item of spec.styleLock.blacklist) {
      if (item.description && /[一-鿿]/.test(item.description)) {
        let d = item.description;
        if (d.startsWith("禁止覆盖")) {
          d = "Do not override " + d.slice(4);
        } else if (d.startsWith("禁止")) {
          d = "Forbidden: " + d.slice(2);
        }
        // Try to clean remaining Chinese
        d = d.replace(/（/g, " (").replace(/）/g, ")").replace(/、/g, ", ");
        if (/[一-鿿]/.test(d)) {
          // Extract pattern context from the regex pattern
          const patternDesc = item.pattern ? `matching pattern ${item.pattern}` : "";
          d = `Do not override styles ${patternDesc}`.trim();
        }
        item.description = d;
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(spec, null, 2) + "\n");
    count++;
  }
}

console.log(`Pass 2: Updated ${count}/${files.length} spec files`);

// Verify
const remaining = files.filter(f => /[一-鿿]/.test(readFileSync(join(dir, f), "utf8")));
console.log(`Files still with Chinese: ${remaining.length}`);
if (remaining.length > 0) {
  console.log(remaining.slice(0, 5).join(", "));
}
