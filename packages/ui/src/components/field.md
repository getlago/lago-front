# Field

Composable labels, descriptions, controls and errors. Independent of any form library.

## When to use

Compose FieldContent, a control and optional FieldError as direct children of Field. The control can be Input, Textarea, Input Group or a composite control; Field does not inspect its type. Keep validation, translation and formatting in the application. Use ordinary grid classes for columns.

## Import

```tsx
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldHelp,
  FieldLabel,
} from 'lago-ui/field'
```

## API

Field, FieldContent and FieldGroup accept native div props and refs. FieldLabel accepts native label props; FieldDescription and FieldError accept paragraph props. FieldError renders only when content exists. Field supports data-disabled for label and description styling. Set aria-invalid on the actual control to control its error appearance, and use FieldError to display the error message. FieldHelp accepts a translated accessible label and tooltip children; place it beside, not inside, FieldLabel. Share one TooltipProvider above the form.

## Examples

```tsx
<Field>
  <FieldContent>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <FieldDescription id="name-description">Shown on invoices.</FieldDescription>
  </FieldContent>
  <Input id="name" aria-describedby="name-description name-error" aria-invalid />
  <FieldError id="name-error">Enter a name.</FieldError>
</Field>
```

Keep wrappers only for meaningful internal layout, such as a group of choices. Field spacing applies only to direct children, preserving those internal layouts.

## Accessibility

Input and Textarea retain standalone invalid styling through aria-invalid without Field. Field handles layout, not validation. Hovering a FieldLabel does not highlight its control; clicking the label still focuses the control.

For Select or Combobox, connect labels and error references to the appropriate interactive control. Radio and checkbox groups need group semantics such as fieldset/legend; individual checkboxes still need their own labels. Field does not replace those semantics.

IDs and aria-describedby are explicit; no hidden form context. Keep help outside the label, use a meaningful button name and provide visible essential instructions. Tooltip opens on focus/hover and dismisses with Escape. Use native required on the input in addition to any visual marker. Avoid putting every validation message in an assertive live region.

## Design

Field CSS owns sibling spacing: 8px by default and 4px before a direct FieldError. An empty FieldError renders nothing and adds no space. This gives 8px from FieldContent to control, 4px between label and description, 4px from control to error, 16px between fields. FieldHelp is visually 20px with a 14px Info icon and a 24px hit area. Keep sibling spacing so its hit area does not overlap other controls. Labels use Medium500, descriptions/errors Caption Regular400. Borderless inputs always retain rounded corners.

## References

Storybook includes With Input, With Input Group and With Textarea galleries. Each shows empty, filled, disabled, read-only and invalid fields; hover and focus are exercised on the editable controls.

- [Input](./input.md)
- [Input Group](./input-group.md)
- [Tooltip](./tooltip.md)
- Storybook: Components / Field
- Tests: `__tests__/field.test.tsx`
