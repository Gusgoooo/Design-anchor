# Design-anchor Token Contract

This document freezes the seed-to-component contract that Design-anchor relies on for long-term governance.

Chinese summary: 这份协议定义 `tokens.json seed` 如何派生到 CSS variables、Tailwind utilities 和组件 className。后续所有治理增强都应该围绕这条契约扩展，而不是绕开它。

## 1. Contract Goal

Changing a seed value must flow through the whole product without manual component edits:

```
tokens.json seed
  -> deriveSeedToMap()
  -> design-tokens.generated.css
  -> Tailwind @theme utilities
  -> component className
  -> anchor audit / CI
```

The contract has two sides:

1. **Positive mapping**: every supported seed must produce known semantic variables.
2. **Negative guardrail**: components and app code must not bypass these variables with hardcoded design-sensitive values.

## 2. Seed Surface

The editable seed surface is intentionally small.

| Seed group | Required keys | Must affect |
|---|---|---|
| Brand color | `colorPrimary` | `primary`, `ring`, `sidebar-primary`, `color-primary-*` |
| Status colors | `colorSuccess`, `colorWarning`, `colorError`, `colorInfo` | status token ladders and `destructive` / `link` aliases |
| Surface | `colorBgBase`, `colorTextBase` | `background`, `foreground`, `card`, `muted`, `border`, text/fill ladders |
| Typography | `fontSize` | `text-xs` through `text-3xl` via `--font-size-*` |
| Shape | `borderRadius` | `rounded-xs/sm/md/lg/xl` via `--radius-*` |
| Spacing | `sizeUnit` | `p-*`, `m-*`, `gap-*`, `h-*`, `w-*`, `size-*` through `--spacing` and explicit stops |
| Charts | `chart1` to `chart5`, `chart1Dark` to `chart5Dark` | `chart-1` to `chart-5` |

`seedDark` is an override layer. Missing dark values inherit from light seed values.

## 3. Generated Variable Layers

`npm run sync:tokens` writes `src/styles/design-tokens.generated.css`.

The generated CSS must contain:

- `@theme` variables consumed by Tailwind utilities:
  - `--color-*`
  - `--radius-*`
  - `--shadow-*`
  - `--spacing`
  - `--spacing-*`
  - `--font-size-*`
  - `--opacity-*`
  - `--transition-duration-*`
- `:root` variables for light mode.
- `.dark` variables for dark mode.
- `_anchor-*` mirror variables for runtime preview overrides.

Important runtime rule:

```
rounded-md -> --radius-md -> var(--_anchor-radius-md)
text-sm    -> --font-size-sm -> var(--_anchor-font-size-sm)
duration-fast -> --transition-duration-fast -> var(--_anchor-transition-duration-fast)
```

If a new Tailwind utility family is added to `@theme`, it must also have a root/dark backing variable when runtime preview should be able to override it.

## 4. Component ClassName Rules

Components should use semantic Tailwind utilities:

| Use | Avoid |
|---|---|
| `bg-primary`, `text-muted-foreground`, `border-border` | `bg-[#0204a3]`, `text-[13px]` |
| `p-4`, `gap-2`, `h-9` | `p-[13px]`, `gap-[11px]` |
| `rounded-md`, `rounded-lg`, `rounded-xs` | `rounded-[10px]`, `rounded-[2px]` |
| `shadow-sm`, `shadow-lg` | `shadow-[0_8px_24px_-12px_rgba(...)]` |
| `ring-[var(--ring-width)]` | `ring-[3px]` |

Allowed exceptions:

- Layout sizing and positioning: `w-[280px]`, `max-w-[480px]`, `top-[12px]`.
- Component-local CSS variable geometry: `h-[var(--cell-size)]`, `rounded-[calc(var(--radius)-5px)]`.
- Third-party selector matching where the hardcoded value is an attribute selector, not an emitted style.
- Icon stroke widths such as `stroke-[1.5px]`.

## 5. Audit Coverage

`anchor audit` now scans TSX string literals, not only JSX `className` attributes. This means classes inside `cn()`, `cva()`, object variants, and component constants are governed too.

### 5.1 What to catch

治理重点不是“所有值都必须 token 化”，而是抓住会导致产品视觉语言漂移的关键面：

| Must catch | Why |
|---|---|
| Hardcoded colors on `bg/text/border/ring/fill/stroke/from/to/via` | Brand, status, surface, focus, and chart language must stay themeable. |
| Arbitrary spacing on `p/m/gap/space` | Product density must follow `sizeUnit`; random 13px/17px destroys grid rhythm. |
| Arbitrary radius on `rounded*` | Shape language must follow `borderRadius`. |
| Arbitrary type sizes on `text-[...]` | Typography scale must follow `fontSize`. |
| Arbitrary shadows | Elevation should map to `shadow-sm/md/lg` or semantic elevation tokens. |
| Raw native tags where a governed component exists | Bypasses variants, accessibility defaults, styleLock, and AI rules. |

中文判断：颜色、间距、圆角、字号、阴影、受管组件替代原生标签，是治理的核心。它们决定“产品像不像一个系统”。

### 5.2 What to allow

Not everything should become a token. Allow one-off values when they describe layout mechanics rather than product visual language:

| Allowed | Examples |
|---|---|
| Layout geometry | `w-[280px]`, `max-w-[480px]`, `h-[var(--cell-size)]` |
| Positioning | `top-[12px]`, `left-[50%]`, `translate-x-[...]` |
| Grid mechanics | `grid-cols-[...]`, `aspect-[...]`, `z-[...]` |
| Component-local CSS variable geometry | `rounded-[calc(var(--radius)-5px)]` |
| Third-party selector matching | Recharts selectors such as `[stroke='#ccc']` when the emitted style still maps to tokens |
| Icon geometry | `stroke-[1.5px]` for SVG icon stroke width |

中文判断：布局尺寸、定位、第三方库选择器、组件局部 CSS 变量、图标几何值可以放过。它们不是品牌/密度/形态语言本身。

### 5.3 Safe auto-fix

`anchor audit --fix` only plans deterministic fixes that can be mapped to the current seed-derived scale. It must ask for confirmation before writing files. In non-interactive environments, pass `--yes` explicitly.

Safe fixes:

| Before | After |
|---|---|
| `p-[13px]` | nearest spacing utility, e.g. `p-3` |
| `gap-[17px]` | nearest spacing utility, e.g. `gap-4` |
| `rounded-[10px]` | nearest radius utility, e.g. `rounded-md` / `rounded-lg` |
| `text-[13px]` | nearest type utility, e.g. `text-sm` / `text-base` |
| `ring-[3px]` | `ring-[var(--ring-width)]` |
| `border-[1.5px]` | `border-[var(--line-width-bold)]` |

Unsafe by default:

- `bg-[#...]`, `text-[#...]`, `border-[#...]`: color intent is semantic; nearest-color replacement can be wrong.
- `shadow-[...]`: elevation intent is semantic; the tool reports it and asks for a human/component decision.
- Complex gradients: may be brand, illustration, or overlay behavior.

Run:

```bash
npm run anchor:audit:fix
# or in a consumer project
npx design-anchor audit .anchor --scope all --fix
```

For CI or a scripted migration where the team has already reviewed the policy:

```bash
npx design-anchor audit .anchor --scope all --fix --yes
```

Recommended workflow:

1. Run `anchor audit --scope all`.
2. Run `anchor audit --scope all --fix` to preview safe mechanical fixes.
3. Confirm in the terminal before files are written.
4. Review the diff.
5. Manually decide remaining color/shadow/semantic component issues.
6. Run `npm run sync:anchor && npm run check:anchor && npm run anchor:audit:all`.

The audit rejects arbitrary values for token-sensitive families:

```
bg text border ring fill stroke from to via shadow
p px py pt pb pl pr
m mx my mt mb ml mr
gap gap-x gap-y space-x space-y
rounded*
```

Values using CSS variables, such as `ring-[var(--ring-width)]`, are allowed because they still flow through the token layer.

## 6. Executable Checks

Run:

```bash
npm run check:tokens
```

This verifies:

- `tokens.json` uses the v2 seed contract.
- required seed and custom seed keys exist.
- light and dark maps contain the required semantic variables.
- generated CSS exposes required `@theme`, `:root`, `.dark`, and `_anchor-*` variables.
- mutating each seed changes the expected mapped tokens.
- unrelated fixed tokens stay stable when a color seed changes.

Run the full governance check:

```bash
npm run check:anchor
```

This combines schema/MCP/export consistency with the token contract check.

## 7. Change Protocol

When adding a new seed:

1. Add it to `tokens.json` and `factory-tokens.json`.
2. Normalize it in `seed-to-map.mjs` if it is numeric.
3. Derive one or more semantic map variables.
4. Emit Tailwind `@theme` variables if components should use utility classes.
5. Add `_anchor-*` mirror variables if live preview should override it.
6. Add required keys and sensitivity checks to `scripts/check-token-contract.mjs`.
7. Update this document.
8. Run `npm run sync:anchor && npm run check:anchor && npm run anchor:audit:all`.

When adding a new component:

1. Prefer semantic utilities from the existing token families.
2. If a new design-sensitive arbitrary value feels necessary, first ask whether it should become a token.
3. Add or update the component `spec.json`.
4. Run `npm run sync:anchor`.
5. Run `npm run anchor:audit:all`.
