# Input

Single-line native text input. **Provisional**: not yet aligned with the v2 design.

## When to use

- Do not adopt it in new UI yet. Its border, focus ring, placeholder and invalid colors come from the shadcn scaffold (`border-input`, `ring-ring`, `text-muted-foreground`, `border-destructive`) and none of them is a v2 token. The app still defines them, so it renders with the scaffold greys there; the `lago-ui` preset deliberately does not, so Storybook shows it without them until it is aligned.
- Until it is aligned, keep using the legacy form fields for production forms.
- The target appearance is already defined in [component surfaces](../styles/component-surfaces.md): `surface-subtle` background, `border-control` border, `danger-border` when invalid.

## Import

```tsx
import { Input } from 'lago-ui/input'
```

## API

Every native `input` attribute (`type`, `value`, `onChange`, `disabled`, `aria-invalid`, …) plus `className`. Forwards its ref.

## Examples

```tsx
<Input type="text" placeholder="Customer name" />
<Input type="number" inputMode="decimal" />
<Input type="file" />
```

## Accessibility

- Always associate a visible label (`<label htmlFor>` or `aria-labelledby`); a placeholder is not a label.
- Mark errors with `aria-invalid` and link the message with `aria-describedby`.

## Design

36px high, `v2-text-body` typography, 6px radius, 12px horizontal padding. Disabled lowers opacity and shows a not-allowed cursor. Color tokens are pending the alignment described above.

## References

- Storybook: Components / Input
- Tests: `__tests__/input.test.tsx`
