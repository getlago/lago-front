# Badge

Static, single-line label for a status or a category.

## When to use

- Use it to show a state or a category next to content: `Active`, `Draft`, `Overdue`.
- Do not use it for anything interactive. Removal or selection needs a dedicated interactive chip; never nest an icon button inside a Badge.
- Legacy `Chip`, `Status` and the other production badges stay on the legacy design system. Use this Badge only in v2 UI.

## Import

```tsx
import { Badge } from 'lago-ui/badge'
```

## API

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `neutral`, `info`, `success`, `warning`, `danger`, `disabled`, `outline` | `neutral` |
| `size` | `sm` (20px high), `default` (24px high) | `default` |
| `className` | extra classes, merged with `cn()` | |

Renders a `span` and forwards its ref and HTML attributes.

## Examples

```tsx
import { CircleCheck } from 'lucide-react'

<Badge variant="success" size="sm">
  <CircleCheck aria-hidden="true" />
  Active
</Badge>

<Badge variant="warning">Pending payment</Badge>
```

Icons come as children and are sized by the Badge (14px, stroke 2).

## Accessibility

- Badge adds no tab stop, no live region and no disabled semantics: `disabled` is only a visual tone.
- Keep icons decorative (`aria-hidden="true"`) when the text already carries the meaning.
- For a status that changes while the user is on the page, put live-region semantics on the containing region, not on the Badge.
- Contrast: `outline` (light 3.09:1, dark 6.54:1) and `disabled` (light 3.09:1, dark 3.75:1) are below 4.5:1 for normal text in at least one theme. Do not use them for essential information. Every other variant is above 4.5:1 in both themes.

## Design

Caption typography (12px / 16px) with medium weight (500), 6px radius, 4px gap, 1px border, no shadow, no interaction states. `sm` has a 20px minimum width and 4px horizontal padding; `default` has a 24px minimum width and 8px horizontal padding. The border is additional to the padding. Text is centered.

| Variant | Background | Text / icon | Border |
| --- | --- | --- | --- |
| neutral | surface-subtle | text-default | border-divider |
| info | info | info-foreground | info-border |
| success | success | success-foreground | success-border |
| warning | warning | warning-foreground | warning-border |
| danger | danger | danger-foreground | danger-border |
| disabled | surface-subtle | disabled-foreground | border-divider |
| outline | surface-subtle | text-subtle | border-divider |

Colors follow the surrounding theme; use [`ColorTheme`](./color-theme.md) for a local light/dark region.

## References

- Storybook: Components / Badge
- Figma: [Badge](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb/v2---Desktop-components?node-id=77-809)
- Screenshots: `docs/badge/light.png`, `docs/badge/dark.png`
