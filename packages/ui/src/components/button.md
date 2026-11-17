# Button

Text or icon button for actions and, through `asChild`, for navigation links styled as buttons.

## When to use

- Use it for any action in v2 UI: submit, confirm, open a menu, navigate.
- For an icon-only button with a tooltip, prefer [`IconButton`](./icon-button.md): it requires the label and wires the tooltip for you.
- The legacy `src/components/designSystem/Button.tsx` is unchanged and stays the default outside v2 UI.

## Import

```tsx
import { Button } from 'lago-ui/button'
```

## API

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `default` (primary), `secondary`, `outline`, `ghost`, `link`, `destructive` | `default` |
| `size` | text: `sm` (32px), `default` (36px), `lg` (40px); icon-only: `icon-sm` (32px), `icon` (36px), `icon-lg` (40px) | `default` |
| `loading` | `boolean`: shows a spinner, keeps label and width, blocks activation | `false` |
| `disabled` | `boolean`: disabled tokens, blocks activation | `false` |
| `asChild` | `boolean`: renders its single child (e.g. a router `Link`) with button styles | `false` |
| `type` | native button type | `button` |

Forwards its ref and every native button attribute.

## Examples

```tsx
import { Copy } from 'lucide-react'

<Button variant="secondary" size="lg">Create customer</Button>

<Button variant="ghost" size="icon-sm" aria-label="Copy API key">
  <Copy aria-hidden="true" />
</Button>

<Button variant="link" asChild>
  <Link to="/customers">Customers</Link>
</Button>

<Button type="submit" loading={isSubmitting}>Save</Button>
```

## Accessibility

- Icon-only buttons need an accessible name, normally `aria-label`. Decorative icons use `aria-hidden="true"`.
- Native buttons default to `type="button"`: pass `type="submit"` explicitly for form submission.
- `loading` sets `aria-busy`, keeps the accessible name and the width, and prevents activation without switching to disabled colors.
- `disabled` and `loading` both block native buttons and slotted anchors.
- Focus is a 4px `focus-ring` with no gap; never remove it.
- Give standalone `link` buttons enough clickable space around them: the label height alone is not a touch target.

## Design

- 8px radius (`rounded-lg`) on every size. Horizontal padding: 12px at every text size. Icon sizes are square with no padding. `link` hugs its content and ignores the text-size padding.
- Labels keep their normal line-height (no text trimming); content is centered with flex alignment and padding.
- Icons are 14px with stroke 2 at every size, with a 4px gap to the label.
- Primary and destructive use their action state tokens (`action-primary*`, `destructive*`).
- Secondary: `surface-raised` at rest, `surface-subtle` for focus and loading, `border-divider`, `shadow-v2-interactive`.
- Outline: `surface` with `border-control`; outline also uses `focus-border` on focus.
- Ghost: transparent at rest. Hover and press use the alpha `interactive-hover` / `interactive-pressed` layers.
- Link: `link` / `link-hover`, always underlined, no padding, no surface.
- The spinner respects reduced motion.

## References

- Storybook: Components / Button
- Figma: [v2 - Desktop components](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb/v2---Desktop-components?node-id=0-1)
- Tests: `__tests__/button.test.tsx`, `__tests__/button-colors.test.tsx`
