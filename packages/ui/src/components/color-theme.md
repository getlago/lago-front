# ColorTheme

Sets a local light or dark theme for a region, without changing the document theme.

## When to use

- Semantic tokens default to light. Wrap a region in `ColorTheme` to render it in a given mode.
- Wrap content rendered in a React portal (menus, tooltips, dialogs) in `ColorThemePortal` so it inherits the nearest theme. The v2 menus and tooltips already do this.
- Set the theme through these helpers, never with a hand-written `data-color-theme` attribute.

## Import

```tsx
import { ColorTheme, ColorThemePortal, type ColorMode } from 'lago-ui/color-theme'
```

## API

| Component | Props | Notes |
| --- | --- | --- |
| `ColorTheme` | `mode: 'light' \| 'dark'`, `asChild?`, HTML attributes | Provides the mode to descendants and sets `data-color-theme` |
| `ColorThemePortal` | `asChild?`, HTML attributes | Reads the nearest `ColorTheme` mode and applies it to portalled content |

Without `asChild` both render a `div`. With `asChild` they apply the theme to their single child; a custom child component must forward received props and ref to its element.

## Examples

```tsx
<ColorTheme mode="dark" asChild>
  <section className="bg-surface text-text-default">Content</section>
</ColorTheme>

<ColorTheme mode="dark">
  <ColorTheme mode="light">Nested light region</ColorTheme>
</ColorTheme>
```

## Accessibility

No semantics of its own. Both modes keep the contrast of the semantic tokens; check the [color guide](../styles/colors.md) before using a primitive color.

## Design

Every semantic color and shadow has a light and a dark value; the theme boundary switches them locally. Boundaries can be nested.

## References

- Storybook: Components / ColorTheme, and the toolbar theme switch on every story
- Tests: `__tests__/color-theme.test.tsx`
