# Textarea

Native multiline text entry with content-driven height.

## When to use

Use Textarea for descriptions, notes and other multiline values. Compose it with the existing Field primitives. Form state and validation belong to the consumer. This component does not introduce a TanStack adapter, formatting or production-form migration. AmountInput remains separate.

## Import

```tsx
import { Field, FieldContent, FieldDescription, FieldLabel } from 'lago-ui/field'
import { Textarea } from 'lago-ui/textarea'
```

## API

Textarea accepts native textarea props and forwards an HTMLTextAreaElement ref. Use value/onChange for controlled usage or defaultValue for uncontrolled usage. Native name, required, maxLength, disabled, readOnly and event handlers pass through unchanged. className merges through cn(). There are no size, auto-grow or row-count variants.

The default minimum height is 78px. CSS field-sizing: content grows and shrinks the control with text wrapping and line breaks, including programmatic value changes and clearing. Width follows its container. There is no default maximum height. Consumers that set a maximum height retain native scrolling for longer content.

Browsers without field-sizing support fall back to a native three-row textarea with vertical resizing and scrolling. The native rows prop applies to that fallback; it does not control height when content sizing is supported. A long placeholder also participates in native content sizing, so keep placeholder copy concise.

## Examples

```tsx
<Field>
  <FieldContent>
    <FieldLabel htmlFor="description">Description</FieldLabel>
    <FieldDescription id="description-help">Shown on customer invoices.</FieldDescription>
  </FieldContent>
  <Textarea
    id="description"
    aria-describedby="description-help"
    placeholder="Enter a description…"
  />
</Field>
```

For validation, set aria-invalid on Textarea and link the existing FieldError with aria-describedby alongside any description ID. Place Textarea and FieldError directly inside Field. Field supplies the 8px content-to-control gap and 4px control-to-error gap; no spacing wrapper is needed. If including FieldHelp, supply a shared TooltipProvider above the composition.

## Accessibility

Connect FieldLabel with htmlFor/id or provide an accessible name. Keep description and error text associated through aria-describedby. Enter inserts a newline; Tab moves focus normally. Disabled prevents editing and focus; readOnly preserves focus and selection. The native textarea handles selection, composition and input events without value transformation. Focus remains visible in forced-colors mode.

## Design

Minimum height 78px; 12px horizontal padding (px-3), 8px vertical padding (py-2), and a stable 8px radius (rounded-lg). Body Regular400 typography is 14/20. Values use text-default; placeholders use text-subtle. Default uses surface and border-control. Hover and read-only use surface-subtle. Focus uses surface, focus-border and a 4px focus-ring. Invalid uses surface with danger-border at rest, surface-subtle on hover, and retains danger-border with the focus ring on focus. Disabled uses the shared disabled tokens. All colors follow the active light/dark theme.

## References

The States story shows standalone controls. For labels, descriptions and errors across each state, see Components / Field.

- [Field](./field.md)
- [Input](./input.md)
- [shadcn Textarea](https://ui.shadcn.com/docs/components/base/textarea)
- [CSS field-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing)
- Storybook: Components / Textarea
- Tests: `__tests__/textarea.test.tsx`
