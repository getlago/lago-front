# Input Group

A native input with inline text or decorative icon addons and one shared border and focus ring.

## When to use

Use Input Group for URL prefixes, percentages, units and supporting text. Addons are presentation: the input stores only its own value. Use AmountInput for money; Input Group does not format currencies, numbers or percentages.

For a standard search field, use `SearchInput` from `lago-ui/input`: it includes the search icon, native search type and subtle, borderless-at-rest search styling. Use Input Group when additional content is needed, such as a search result count, or when composing an email field with a mail icon. Input Group uses the standard bordered appearance; a search icon alone does not set search semantics, so pass `type="search"` to its input.

Storybook is the first consumer. Production adoption belongs in separately reviewed v2 work. No TanStack adapter, formatting or existing-form migration is included.

## Import

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from 'lago-ui/input-group'
```

## API

- `InputGroup`: native div props and ref. Contains exactly one direct `InputGroupInput` child and optional addons.
- `InputGroupInput`: native Input props and HTMLInputElement ref, except `variant`. Supports `value`/`onChange`, `defaultValue`, native constraints, autocomplete and inputMode. Uses native events.
- `InputGroupAddon`: native div props and ref; `align="inline-start" | "inline-end"` (default: inline-start). Text and decorative icons only; interactive controls are outside this component's scope.
- `InputGroupText`: native span props and ref for addon text.

Place the input first in the DOM, then addons. Alignment controls visual order. Put `disabled`, `readOnly` and `aria-invalid` on the input; the group derives its appearance from that control. Do not duplicate these states on the wrapper or add `data-invalid`.

## Examples

```tsx
<InputGroup>
  <InputGroupInput aria-label="Website domain" name="domain" placeholder="example.com" />
  <InputGroupAddon>
    <InputGroupText>https://</InputGroupText>
  </InputGroupAddon>
</InputGroup>
```

Place Input Group directly inside Field alongside FieldContent and FieldError. Field owns the 8px/4px spacing; no control/error wrapper is needed:

```tsx
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from 'lago-ui/field'

;<Field>
  <FieldContent>
    <FieldLabel htmlFor="discount">Discount percentage</FieldLabel>
    <FieldDescription id="discount-description">Enter a value between 0 and 100.</FieldDescription>
  </FieldContent>
  <InputGroup>
    <InputGroupInput
      id="discount"
      name="discount"
      inputMode="decimal"
      defaultValue="120"
      aria-invalid
      aria-describedby="discount-description discount-error"
    />
    <InputGroupAddon align="inline-end">
      <InputGroupText>%</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
  <FieldError id="discount-error">Enter a percentage from 0 to 100.</FieldError>
</Field>
```

The example supplies an error for demonstration; validation and formatting belong to the consumer. Package-local Storybook examples show Lucide icons. App code must follow the existing icon import restrictions described in the [README](../../README.md); this component does not introduce an app icon export.

## Accessibility

Give the input a label through `htmlFor`/`id` or `aria-label`. Prefixes and suffixes do not replace a label. Include meaningful units in the accessible name or description; reference additional explanatory text with `aria-describedby`. Mark decorative icons `aria-hidden="true"`.

Only the input receives keyboard focus. Disabled inputs cannot be edited or focused, including when disabled through a fieldset; read-only inputs remain focusable and selectable. Do not clip the group focus ring. If composing FieldHelp, provide one shared TooltipProvider above the form, not one per group.

## Design

36px height, 8px radius, 12px horizontal padding and **8px gaps** between prefix, control and suffix. Addons hug their content; the control fills the remaining width and scrolls long input text. Keep addons concise at narrow widths. Use body typography, text-muted addons and 14px icon-muted icons.

The group owns the background, border and 4px focus ring. Hovering the control or its addons highlights the full group; hovering the external label or description leaves its background unchanged. It follows Input's empty, filled, hover, focus, disabled, read-only, invalid, invalid + hover and invalid + focus states in both themes. Invalid focus retains the danger border and standard focus ring. Autofill follows the group's background. Field content-to-control spacing remains 8px; control-to-error spacing is 4px.

## References

The States story shows standalone controls. For labels, descriptions and errors across each state, see Components / Field.

- [Input](./input.md)
- [Field](./field.md)
- [Figma](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=268-3507)
- Storybook: Components / InputGroup
- Tests: `__tests__/input-group.test.tsx`
