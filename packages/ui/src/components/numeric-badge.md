# NumericBadge

Compact count display, built on [`Badge`](./badge.md) without changing its defaults.

## When to use

- Use it to show a count next to a label: unread items, results, entries in a tab.
- Inside a tab, use `TabsCounter` from [`Tabs`](./tabs.md): it reads the selected and disabled state of its trigger.
- Do not use it for a status or a category: that is a [`Badge`](./badge.md). There is no tone or color prop.

## Import

```tsx
import { NumericBadge } from 'lago-ui/numeric-badge'
```

## API

| Prop | Values | Default |
| --- | --- | --- |
| `value` | `number` or `string`, rendered as supplied | required |
| `selected` | `boolean`: selected text color | `false` |
| `disabled` | `boolean`: disabled text color, wins over `selected` | `false` |
| `className` | extra classes, merged with `cn()` | |

Renders a `span` and forwards its ref and HTML attributes. It takes no `children`.

## Examples

```tsx
<NumericBadge value={12} />
<NumericBadge value={12} selected />
<NumericBadge value={12} disabled />
```

Zero stays visible. Formatting, hiding zero and abbreviations such as `99+` are caller decisions.

## Accessibility

- `selected` and `disabled` are visual states only: the parent owns focus, disabled behavior and any live announcement.
- Give the count a meaningful accessible label when the surrounding text does not explain it.

## Design

- `v2-text-number-small` with medium weight (Inter Medium, 12px / 16px, tabular lining figures, slashed zero).
- 20px high, 20px minimum width, 4px horizontal padding, full radius, no border, no shadow.
- Background `selected` in every state. Text `text-muted` by default, `text-default` when selected, `disabled-foreground` when disabled.
- Colors follow the surrounding theme; use [`ColorTheme`](./color-theme.md) for a local light/dark region.

## References

- Storybook: Components / NumericBadge
- Tests: `__tests__/numeric-badge.test.tsx`
