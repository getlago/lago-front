# v2 color guide

> **Work in progress:** v2 styles and components are under development. Use the existing design system for ordinary UI work, including new views and components. This guide applies only when a task explicitly requests building or adopting v2.

For explicitly requested v2 work, follow this guide without additional confirmation. Ask for clarification only when the intended scope is ambiguous.

## Choosing colors during the transition

- Within explicitly scoped v2 work, use semantic tokens for new shadcn components. Choose a role such as `action-primary`, `text-default`, or `border-default` instead of a raw color.
- Keep the existing palette when maintaining legacy components or extending views built with the legacy design system.
- A new view is not automatically a palette migration. Adoption outside shadcn and migrations of existing components require explicit design/code review.
- Primitives (`v2-brand-600`, for example) define the palette behind the semantic roles. They are available for foundation tooling and previews; avoid consuming them directly in application components.

```tsx
<section className="border border-border-default bg-surface text-text-default">Content</section>
```

Prefer existing component variants and semantic state tokens such as `action-primary-hover` and `disabled` over creating new color variations.

## Opacity

Use semantic colors as defined by default. Slash opacity modifiers are supported as an escape hatch, not as the normal way to define component states:

| Class                     | Light mode          | Dark mode           |
| ------------------------- | ------------------- | ------------------- |
| `bg-action-primary`       | Opaque blue         | Opaque blue         |
| `bg-action-primary/50`    | Blue at 50% opacity | Blue at 50% opacity |
| `bg-interactive-hover`    | Black at 4% opacity | White at 6% opacity |
| `bg-interactive-hover/50` | Black at 2% opacity | White at 3% opacity |

A modifier multiplies the token's existing alpha: `/50` always means half as opaque. `/100` preserves the original alpha; `/0` makes the color transparent. Arbitrary fractions such as `/[0.25]` work too. The modifier affects the color, not the text or other children of the element.

Prefer an existing semantic role over a modifier. If a variation becomes a recurring need, review it for a dedicated semantic token. Use slash modifiers for color opacity; separate Tailwind utilities such as `bg-opacity-50` are not supported for these tokens. Element-level `opacity-50` is different: it also fades children.

### Design decision

Modifiers use `color-mix()` to mix the active token with transparency. This preserves existing alpha and follows local theme changes without duplicating the palette. Classes without modifiers keep the original token value. Replacing alpha would turn a subtle 4% hover layer into 50% black, so modifiers multiply instead.

## Local themes

Semantic tokens default to light mode. Use `ColorTheme` to set a local boundary without changing the document theme:

```tsx
import { ColorTheme } from '~/components/ui/color-theme'

;<ColorTheme mode="dark">
  <section className="bg-surface text-text-default">Content</section>
</ColorTheme>
```

Nested boundaries can use a different mode. For React portals, wrap the portalled content in `ColorThemePortal` from the same module so it inherits the nearest React theme context. Both helpers currently render a `div`; account for that wrapper in layouts and markup.

Inspect the primitive and semantic color tables at `/design-system/shadcn` in development or QA.

## Updating tokens

[`colors.ts`](colors.ts) is the source of truth for primitives and semantic aliases. [`colors.css`](colors.css) is generated; do not edit it by hand. The generator resolves aliases, rejects missing references and cycles, and writes the CSS variables for both modes.

When changing token definitions, run these commands from the repository root:

```sh
pnpm colors:generate
pnpm colors:check
```

Commit both `colors.ts` and the regenerated `colors.css`. The check command verifies freshness without writing files; the color unit tests also check freshness. Consuming existing tokens in a component requires no generation.

The Tailwind mappings are derived from the registry automatically. New semantic roles should represent an agreed design purpose, rather than a one-off visual adjustment.
