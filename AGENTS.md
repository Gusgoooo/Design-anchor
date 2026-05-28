# AGENTS.md — AI 编码边界与契约

## 目录约定（三条硬规则）

1. **UI / 组件实现真源** → `src/components/anchor-ui/`
   - 所有组件实现、变体、样式变更只在此处修改。
   - 业务代码通过 `@design` 别名或 `@/components/anchor-ui` 引用。
   - 禁止从 `./.anchor/` 深路径引用组件实现。

2. **Token 真源** → `src/design-tokens/tokens.json`
   - 项目创建 token 后，业务项目自己的 token 是唯一真源。
   - `./.anchor/src/design-tokens/` 仅作为初始化模板与派生算法，不作为业务运行时 token 来源。

3. **Portal / sync / kit 集成** → `./.anchor/` 根层（CLI、scripts、anchor-portal、schema、rules）
   - 仅用于 Anchor 产品控制面、schema 同步、Portal 适配。
   - 非组件实现代码。

4. **上游 npm 包** → `node_modules/design-anchor/` **只读**
   - 通过 `anchor upgrade` 同步变更到 `src/components/anchor-ui/` 与 `./.anchor/`。
   - 禁止直接修改 `node_modules` 内文件。

## AI 编码契约

- **Import 来源**：优先 `@design`（指向 `src/components/anchor-ui/index.ts`）；也可从 `@/components/anchor-ui/<component>` 引用；禁止从 `node_modules` 或 `./.anchor/` 深路径引用组件。
- **颜色**：仅使用 Design Token 语义类（`bg-primary`、`text-muted-foreground`），禁止硬编码色值。
- **Token 修改**：只修改 `src/design-tokens/tokens.json`，然后同步生成 `src/styles/design-tokens.generated.css`。
- **间距**：禁止任意值 Tailwind（`m-[13px]`），使用 schema 声明的语义 props。
- **组件规范**：以 `./.anchor/src/anchor/schema/components/*.spec.json` 为唯一数据源；规范中的组件路径应指向 `@/components/anchor-ui` 或 `@design`。
- **修改后**：运行 `npm run sync:anchor` 同步 .cursorrules 与 Tailwind 扩展。

## AI 生码链路中的 Design Anchor

- **生码开始**：只要任务涉及 UI / 主题 / 组件 / token / 页面布局，先显式输出：`Design Anchor 预检：我会先查组件规范与 token，优先复用 @design。`
- **写 UI 前**：先查 `@design` / `src/components/anchor-ui` 和组件 spec，优先复用已有组件与 token。
- **写 UI 中**：发现原生 `<button>`、`<input>`、`<table>`、硬编码颜色、任意值 Tailwind 或绕过 `@design` 的实现时，直接在当前生码任务里改正，并显式说明：`Design Anchor 自动治理：已改为组件或语义 token。`
- **写 UI 后**：运行或总结 Design Anchor 自检，把结果放在 AI 任务总结中，不把问题处理迁移到 Portal backlog。
- **最终回复**：只要改过 UI，必须包含一行 `Design Anchor 自检`，说明组件复用、token 合规、自动修复、待确认项与同步 / audit 状态。
- **通过示例**：`Design Anchor 自检：复用了 8 个 @design 组件，未发现硬编码颜色，规则已同步。`
- **自动修复示例**：`Design Anchor 自检：检测到 2 处绕过 @design / token 的实现，已改为使用 Button / DataTable。`
- **需要确认示例**：`Design Anchor 自检：有 1 处需要确认：这个原生 table 是否应该替换为 DataTable？`
- **禁止弱化表达**：不要只说 “lint passed / checks passed”，必须点名 Design Anchor。

## Portal 自动唤起

用户要求查看或修改 token、主题、组件库、组件规范、组件样式、右上角仪表盘、preset 或文档时，优先运行 `npx design-anchor portal <tab>` 打开 Portal。中英文都要识别，例如：

- `tokens`：改 token、看看 token、修改主题、调整主题、打开主题编辑器、主题编辑器、改品牌色、改圆角、theme、theme editor、design tokens。
- `components`：有哪些组件、组件列表、组件预览、component library。
- `specs`：组件规范、组件 schema、props contract、variant mapping。
- `dashboard`：右上角仪表盘、健康度、AI 约束状态、audit、self-check。
- `docs`：文档、怎么接入、CLI commands。
- `presets`：选择 preset、品牌风格、onboarding。
