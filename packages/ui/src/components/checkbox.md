# Checkbox

Standalone v2 choices built on Base UI, composed with Field.

## When to use

Use for independent choices, including mixed select-all state. Group related choices with native FieldSet/FieldLegend and FieldGroup spacing="compact". Selection logic remains with the caller; no CheckboxGroup wrapper or form adapter is required.

## Import

```tsx
import { Checkbox } from 'lago-ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel } from 'lago-ui/field'
```

## API

Base UI checked/defaultChecked/onCheckedChange, indeterminate, disabled, readOnly, name/value, inputRef and ARIA props pass through. The forwarded ref points to the visible button. className is a string. Rendering, children and nativeButton are owned by the wrapper. Use indeterminate separately from the boolean checked value; undefined does not mean mixed.

Validation is caller-owned: set aria-invalid and aria-describedby, then render FieldError. No internal validation/error state, translation, or label props. Native form serialization is handled by Base UI's hidden input. Native reset restores uncontrolled defaults; controlled values remain the caller's responsibility. These components do not change v1 or its Formik/TanStack adapters.

## Examples

```tsx
<Field orientation="horizontal">
  <Checkbox id="email" aria-describedby="email-help" />
  <FieldContent>
    <FieldLabel htmlFor="email">Finalized invoices</FieldLabel>
    <FieldDescription id="email-help">Send an email when an invoice is ready.</FieldDescription>
  </FieldContent>
</Field>
```

For label-only content, put FieldLabel directly after the control. For a description, wrap FieldLabel and FieldDescription in FieldContent. Group headings use FieldLegend, not a label targeting one option. See [Field](./field.md) for group and error layouts.

## Accessibility

Sibling htmlFor/id labels target a native button backed by Base UI's hidden input. Preserve caller accessible names and description/error IDs. Disabled controls are inert; read-only controls remain focusable without changing value. Keyboard focus stays visible without changing the read-only fill. Label hover highlights only its associated editable control. Descriptions do not toggle controls. Avoid nested interactive content in labels.

Space toggles. Mixed activation requests checked=true; the caller updates indeterminate. Bare controls require an accessible name. Label-less 16px controls need suitable surrounding target spacing in dense views.

## Design

16px controls, 1px border; Checkbox has a 6px radius, Radio a circular boundary and 8px dot. Selection uses action-primary and inverse-foreground. Unchecked hover uses surface-subtle; selected hover overlays interactive-hover. Invalid borders use danger-foreground while preserving selected fill. Focus uses focus-border plus a 4px focus-ring without a gap. Disabled uses disabled/disabled-foreground. Forced-colors uses system colors.

Field keeps 8px between control and label/content, 4px between label and description, and 4px before an error. Text wraps; the control stays aligned to the first label line. No new animation or pressed palette is introduced.

## References

- [Figma](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=391-1136)
- [Base UI](https://base-ui.com/react/components/checkbox)
- [Field](./field.md)
- Storybook: Components / Checkbox (standalone states), Components / Field (compositions)
