# v2 color guide

> **Work in progress:** v2 styles and components are under development. Use the existing design system for ordinary UI work, including new views and components. This guide applies only when a task explicitly requests building or adopting v2.

For explicitly requested v2 work, follow this guide without additional confirmation. Ask for clarification only when the intended scope is ambiguous.

## Choosing colors during the transition

- Within explicitly scoped v2 work, use semantic tokens for new shadcn components. Choose a role such as `action-primary`, `text-default`, or `border-control` instead of a raw color.
- Keep the existing palette when maintaining legacy components or extending views built with the legacy design system.
- A new view is not automatically a palette migration. Adoption outside shadcn and migrations of existing components require explicit design/code review.
- Primitives (`v2-brand-600`, for example) define the palette behind the semantic roles. They are available for foundation tooling and previews; avoid consuming them directly in application components.

```tsx
<section className="border border-border-control bg-surface text-text-default">Content</section>
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

;<ColorTheme mode="dark" asChild>
  <section className="bg-surface text-text-default">Content</section>
</ColorTheme>
```

Nested boundaries can use a different mode. For React portals, wrap the portalled content in `ColorThemePortal` from the same module so it inherits the nearest React theme context. Use `asChild` on either helper to apply the theme to its single child element without adding a wrapper. Without `asChild`, the helper renders a `div`. Custom child components must pass received properties and refs to their underlying element. Set the theme through the helper rather than a conflicting `data-color-theme` on its child.

Inspect the primitive and semantic color tables at `/design-system/shadcn-color` in development or QA.

## Updating tokens

[`colors.css`](colors.css) is the source of truth. Edit primitive values and semantic aliases directly there; no generation command or generated output is needed. Keep both light and dark semantic declarations, including aliases, so nested theme boundaries resolve locally.

When adding or removing a token, update its variable name in [`tailwindColors.ts`](tailwindColors.ts) to expose or remove its Tailwind utilities. That file lists names only; color values and aliases live exclusively in CSS. Changing an existing value requires only a CSS edit.

The showcase reads the CSS declarations and lets the browser resolve their values for the selected theme. CSS validation tests check alias references and cycles, while utility tests cover opacity and legacy isolation.

New semantic roles should represent an agreed design purpose, rather than a one-off visual adjustment.

## Surfaces and elevation

Use `shadow-v2-interactive` for subtle elevation on secondary buttons and clickable cards. It combines a 0.5px black 12.5% edge with `0 1px 1px` and `0 2px 4px` black 4% shadows, identically in light and dark. Figma: `v2 / Shadows / Interactive`. Adoption is explicit per shadcn component; it does not replace focus indication or apply to production automatically.

- `bg-surface` follows canvas; use for flat page content.
- `bg-surface-subtle` provides subtle grouping areas: light #FBFBFB, dark #212121.
- `bg-surface-raised` is white in light mode and #232323 in dark mode.
- `bg-surface-floating` is white in light mode and #2C2C2C in dark mode.
- Pair floating surfaces with `shadow-v2-floating` for toasts/popovers or `shadow-v2-dialog` for dialogs. These opt-in utilities preserve Tailwind ring composition. Existing shadow utilities are unchanged.

`shadows.css` defines light/dark values using the same local theme boundary as colors. Portal consumers must use `ColorThemePortal`. Elevation is chosen explicitly per component; it does not increment automatically with nesting. New components should use `border-border-control` for control boundaries, `text-link` for links/text actions and active tab text, `text-text-subtle` for the current breadcrumb, `text-text-default` for unselected navigation text, and icon semantic roles for icons. Active tab indicators retain `action-primary`. Do not add opacity modifiers to selected backgrounds or decorative borders by default.

These rules guide future shadcn implementation; this foundation does not migrate production components.

## Approved semantic color update

[Figma color definitions](https://www.figma.com/design/LpzAy6Jka2kl1G8wk4WZAs?node-id=16-4)

The v2 utilities are now `bg-surface-subtle`, `border-border-control`, and
`border-border-divider`. Their former names were `bg-surface-inset`,
`border-border-default`, and `border-border-subtle`; migrate all consumers together.
Surface and divider colors stay unchanged. Control boundaries use neutral-400 in
light mode and neutral-525 in dark mode.

Dark muted text uses neutral-250; muted icons continue to alias muted text.
Information messages use neutral-75 / neutral-600 / neutral-200 in light mode and
neutral-800 / neutral-200 / neutral-700 in dark mode (background / foreground / border).
The new neutral-75, neutral-250, and neutral-525 primitives are authored in OKLCH;
their Figma sRGB references are #F5F5F5, #BDBDBD, and #777777 respectively.

Subtle text/icons, premium icons, focus, inverse, selection, and elevation retain
their existing definitions. This update applies to the opt-in v2 foundation and
development showcases; it does not migrate legacy production components.
