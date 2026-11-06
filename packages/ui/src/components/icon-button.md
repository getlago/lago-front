# IconButton

Icon-only button with a required label that becomes both its accessible name and its tooltip. A composition of [`Button`](./button.md) and [`Tooltip`](./tooltip.md).

## When to use

- Use it for every icon-only action in v2 UI (copy, edit, more actions). It makes the label impossible to forget.
- Use [`Button`](./button.md) with `asChild` instead when the icon must navigate: IconButton does not support `asChild`.
- The legacy production Button, Tooltip and icons are unchanged.

## Import

```tsx
import { IconButton } from 'lago-ui/icon-button'
import { TooltipProvider } from 'lago-ui/tooltip'
```

## API

| Prop | Values | Default |
| --- | --- | --- |
| `label` | required, non-empty, localized action label | |
| `size` | `icon-sm` (32px), `icon` (36px), `icon-lg` (40px) | `icon` |
| `variant` | any [`Button`](./button.md) variant | `ghost` |
| `loading`, `disabled` | same as Button | `false` |

Forwards its ref, event handlers and form props to a native button. `aria-label`, `aria-labelledby`, `asChild` and text sizes are not accepted.

## Examples

```tsx
import { Copy } from 'lucide-react'

<TooltipProvider>
  <IconButton label="Copy invoice number" size="icon-sm" onClick={copyInvoiceNumber}>
    <Copy aria-hidden="true" />
  </IconButton>
</TooltipProvider>
```

Mount one `TooltipProvider` around the region (toolbar, page section), not one per button: IconButton deliberately does not create its own.

## Accessibility

- The icon is decorative: `aria-hidden="true"`. The label is the accessible name.
- Loading keeps the name and the geometry.
- Disabled and loading buttons stay native disabled buttons and are skipped by keyboard navigation, so their tooltip is not reachable by keyboard. When users need to know why an action is disabled, show persistent help or compose an explicit focusable wrapper at the usage site.

## Design

Same geometry and tokens as the Button icon sizes: square controls, full radius, 14px icons with stroke 2. The tooltip follows [`Tooltip`](./tooltip.md).

## References

- Storybook: Components / IconButton
- Tests: `__tests__/icon-button.test.tsx`
