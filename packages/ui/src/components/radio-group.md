# RadioGroup

Standalone v2 choices built on Base UI, composed with Field.

## When to use

Use for one choice from a visible list. Always render RadioGroupItem within RadioGroup, including standalone visual specimens. Use Checkbox for independent choices.

## Import

```tsx
import { Field, FieldContent, FieldDescription, FieldLabel } from 'lago-ui/field'
import { RadioGroup, RadioGroupItem } from 'lago-ui/radio-group'
```

## API

RadioGroup owns value/defaultValue/onValueChange, name, disabled and readOnly. Values may be strings, numbers or booleans; null represents no controlled selection. RadioGroupItem requires value and supports item-level disabled/readOnly, refs and ARIA. The group ref targets its div; the item ref targets its visible button. className is a string. Item rendering and indicator children are owned by the wrapper.

Validation is caller-owned: set aria-invalid and aria-describedby, then render FieldError. No internal validation/error state, translation, or label props. Native form serialization is handled by Base UI's hidden input. Native reset restores uncontrolled defaults; controlled values remain the caller's responsibility. These components do not change v1 or its Formik/TanStack adapters.

## Examples

```tsx
<RadioGroup defaultValue="automatic" aria-label="Collection">
  <Field orientation="horizontal">
    <RadioGroupItem id="automatic" value="automatic" />
    <FieldLabel htmlFor="automatic">Automatic collection</FieldLabel>
  </Field>
  <Field orientation="horizontal">
    <RadioGroupItem id="manual" value="manual" />
    <FieldLabel htmlFor="manual">Manual collection</FieldLabel>
  </Field>
</RadioGroup>
```

For label-only content, put FieldLabel directly after the control. For a description, wrap FieldLabel and FieldDescription in FieldContent. Group headings use FieldLegend, not a label targeting one option. See [Field](./field.md) for group and error layouts.

## Accessibility

Sibling htmlFor/id labels target a native button backed by Base UI's hidden input. Preserve caller accessible names and description/error IDs. Disabled controls are inert; read-only controls remain focusable without changing value. Keyboard focus stays visible without changing the read-only fill. Label hover highlights only its associated editable control. Descriptions do not toggle controls. Avoid nested interactive content in labels.

Tab enters/leaves the group; arrow keys move and select enabled options. The group has one tab stop and one selected value. Give each group a name with aria-label or aria-labelledby. Native FieldSet/FieldLegend provides an optional visible heading; descriptions and errors use explicit IDs.

## Design

16px controls, 1px border; Checkbox has a 6px radius, Radio a circular boundary and 8px dot. Selection uses action-primary and inverse-foreground. Unchecked hover uses surface-subtle; selected hover overlays interactive-hover. Invalid borders use danger-foreground while preserving selected fill. Focus uses focus-border plus a 4px focus-ring without a gap. Disabled uses disabled/disabled-foreground. Forced-colors uses system colors.

Field keeps 8px between control and label/content, 4px between label and description, and 4px before an error. Text wraps; the control stays aligned to the first label line. No new animation or pressed palette is introduced.

## References

- [Figma](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=391-1491)
- [Base UI](https://base-ui.com/react/components/radio-group)
- [Field](./field.md)
- Storybook: Components / RadioGroup (standalone states), Components / Field (compositions)
