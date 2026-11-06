# Separator

1px line that divides content, horizontally or vertically.

## When to use

- Use it between sections or inline items in v2 UI.
- Inside a dropdown menu use `DropdownMenuSeparator` from [`dropdown-menu`](./dropdown-menu.md), never this component.
- Existing production dividers are unchanged.

## Import

```tsx
import { Separator } from 'lago-ui/separator'
```

## API

| Prop | Values | Default |
| --- | --- | --- |
| `orientation` | `horizontal`, `vertical` | `horizontal` |
| `decorative` | `true`: hidden from assistive technology; `false`: exposed as a separator | `true` |

## Examples

```tsx
<Separator />

<div className="flex h-10 items-center gap-4">
  <span>Details</span>
  <Separator orientation="vertical" />
  <span>Activity</span>
</div>
```

The parent owns spacing, and must give a height for a full-height vertical separator.

## Accessibility

- Decorative by default. Set `decorative={false}` only when the division carries meaning for assistive technology.
- Not interactive and not focusable.

## Design

1px thick, `border-divider` color from the surrounding theme. No margin, padding, radius or shadow.

## References

- Storybook: Components / Separator
- Tests: `__tests__/separator.test.tsx`
