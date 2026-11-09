# lago-ui — v2 design system

The v2 design system of lago-front: shadcn-style components built on Radix, CVA and Tailwind, with the v2 tokens. This README is the entry point; every component and foundation links to its own guide below.

## When to use v2

**Work in progress.** Use the existing design system for ordinary UI work, including new views and components. Use `lago-ui` only when the task explicitly asks to build or adopt v2; for that scope, follow these guides without asking for extra confirmation, and ask only when the scope is ambiguous.

A new view is not automatically a v2 view, and adopting v2 in an existing view needs explicit design and code review.

## Rules

1. **Import from `lago-ui/<name>`**, one subpath per component, never from a barrel:
   ```tsx
   import { Button } from 'lago-ui/button'
   import { buttonVariants } from 'lago-ui/button-variants'
   import { cn } from 'lago-ui/utils'
   ```
2. **Never import `@radix-ui/*` or `lucide-react` in the app.** Use the `lago-ui` component; if none fits, add or extend one here. App ESLint enforces this.
   - Known gap: the guides show Lucide icons as children (`<Copy aria-hidden="true" />`), which works inside this package and in Storybook. `lago-ui` does not expose icons to the app yet, so an app view cannot pass a Lucide icon today. Do not disable the ESLint rule to work around it; raise it instead.
3. **Use semantic tokens**, never primitives or hex values: `bg-surface-raised`, `text-text-muted`, `border-border-control`. See the [color guide](src/styles/colors.md) and [component surfaces](src/styles/component-surfaces.md).
4. **Use the typography classes** (`v2-text-*`), never raw font sizes or weights. See [typography](src/styles/typography.md).
5. **Merge classes with `cn()`** from `lago-ui/utils`: it resolves Tailwind and `v2-text-*` conflicts.
6. **Themes go through [`ColorTheme`](src/components/color-theme.md)**, never a hand-written `data-color-theme`.
7. **Reuse variants before adding classes.** A new visual variation belongs in the component, reviewed, not in a one-off `className`.
8. **`lago-ui` never imports from the app** (`~/…`): the package ESLint enforces it.

## Components

| Component | Import | Guide |
| --- | --- | --- |
| Badge | `lago-ui/badge` | [badge.md](src/components/badge.md) |
| Button | `lago-ui/button` | [button.md](src/components/button.md) |
| ColorTheme | `lago-ui/color-theme` | [color-theme.md](src/components/color-theme.md) |
| DropdownMenu | `lago-ui/dropdown-menu` | [dropdown-menu.md](src/components/dropdown-menu.md) |
| IconButton | `lago-ui/icon-button` | [icon-button.md](src/components/icon-button.md) |
| Input (provisional) | `lago-ui/input` | [input.md](src/components/input.md) |
| NumericBadge | `lago-ui/numeric-badge` | [numeric-badge.md](src/components/numeric-badge.md) |
| OverflowTabs | `lago-ui/overflow-tabs` | [overflow-tabs.md](src/components/overflow-tabs.md) |
| Separator | `lago-ui/separator` | [separator.md](src/components/separator.md) |
| Tabs | `lago-ui/tabs` | [tabs.md](src/components/tabs.md) |
| Tooltip | `lago-ui/tooltip` | [tooltip.md](src/components/tooltip.md) |

Each guide follows the same sections: **When to use**, **Import**, **API**, **Examples**, **Accessibility**, **Design**, **References**.

## Foundations

| Topic | Guide |
| --- | --- |
| Colors, opacity, local themes, tokens | [colors.md](src/styles/colors.md) |
| Surfaces, borders, shadows, interaction states per component type | [component-surfaces.md](src/styles/component-surfaces.md) |
| Typography classes | [typography.md](src/styles/typography.md) |

Fonts are owned by `lago-configs` (`lago-configs/fonts.css`), not by this package.

## Storybook

Published at **https://getlago.github.io/lago-front/ui/** on every merge into `main` that touches the design system (`.github/workflows/storybook.yml`). Keep this URL stable: it is shared in docs, Figma and agent instructions. To run it locally:

```bash
pnpm --filter lago-ui storybook
```

Every component and foundation has a story; the **Docs** page of each one renders the same guide linked above, so the guide is the single source. Use the toolbar to switch light and dark.

## Adding or changing a component

1. Component in `src/components/<name>.tsx`, exporting only components and types (CVA variants go in `<name>-variants.ts`, for Fast Refresh).
2. Guide in `src/components/<name>.md` with the sections above.
3. Story in `src/components/<name>.stories.tsx`, with the guide as its Docs description.
4. Tests in `src/components/__tests__/`.
5. A row in the table above.

A story's deep link is built from its `title` (`ui/?path=/docs/components-button--docs`). Renaming a `title` breaks every shared link to it: avoid it, or keep the old id with `id` in the story meta.

`pnpm --filter lago-ui test:docs` fails when a component misses its guide or story, when a guide misses a section, or when it links to the removed dev-only pages.

## Using it in the app

The app is already wired: `lago-ui` dependency, Tailwind preset and content scan, `lago-ui/styles.css` in `src/main.css`. Adopting a component is a single import. The dev-only tab `LagoUiIntegrationTest` is the reference consumer.
