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

## Portal 自动唤起

用户要求查看或修改 token、主题、组件库、组件规范、组件样式、治理健康度、preset 或文档时，优先运行 `npx design-anchor portal <tab>` 打开 Portal。中英文都要识别，例如：

- `tokens`：改 token、看看 token、改品牌色、改圆角、theme、design tokens。
- `components`：有哪些组件、组件列表、组件预览、component library。
- `specs`：组件规范、组件 schema、props contract、variant mapping。
- `govern`：治理、健康度、组件使用情况、audit、drift check。
- `docs`：文档、怎么接入、CLI commands。
- `presets`：选择 preset、品牌风格、onboarding。
