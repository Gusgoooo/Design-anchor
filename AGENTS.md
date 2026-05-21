# AGENTS.md — AI 编码边界与契约

## 目录约定（三条硬规则）

1. **UI / 组件 / token 真源** → `./.accord/src/components/` 与 `./.accord/src/design-tokens/`
   - 所有组件实现、变体、样式变更只在此处修改。
   - 业务代码通过 `@design` 别名或相对路径引用，禁止复制组件实现到 `src/`。

2. **Portal / sync / kit 集成** → `./.accord/` 根层（CLI、scripts、.storybook）
   - 仅用于 Storybook 配置、schema 同步、Portal 适配。
   - 非组件实现代码。

3. **上游 npm 包** → `node_modules/design-accord/` **只读**
   - 通过 `accord upgrade` 同步变更到 `./.accord/`。
   - 禁止直接修改 `node_modules` 内文件。

## AI 编码契约

- **Import 来源**：优先 `@design`（指向 `./.accord/index.ts`）；禁止从 `node_modules` 深路径引用 kit 组件。
- **颜色**：仅使用 Design Token 语义类（`bg-primary`、`text-muted-foreground`），禁止硬编码色值。
- **间距**：禁止任意值 Tailwind（`m-[13px]`），使用 schema 声明的语义 props。
- **组件规范**：以 `./.accord/src/accord/schema/components/*.spec.json` 为唯一数据源。
- **修改后**：运行 `npm run sync:accord` 同步 .cursorrules 与 Tailwind 扩展。
