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

Combobox uses the same structure: place its root around Field so the label, description, control and error remain siblings. Set the input id, `aria-describedby` and `aria-invalid`; the Field spacing remains 8px/4px. Multiple and free-text chips may sit inside the control or in a row 8px above it. See [Combobox](./combobox.md) for these compositions.

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

Input and Textarea retain standalone invalid styling through aria-invalid without Field. Field handles layout, not validation. Hovering a FieldLabel highlights its editable Input, Input Group, Textarea, Combobox or Select. Clicking the label focuses or opens its control. Description and help hover do not highlight the control; disabled, read-only and focused states keep their existing appearance.

For Select or Combobox, connect labels and error references to the appropriate interactive control. Radio and checkbox groups need group semantics such as fieldset/legend; individual checkboxes still need their own labels. Field does not replace those semantics.

IDs and aria-describedby are explicit; no hidden form context. Keep help outside the label, use a meaningful button name and provide visible essential instructions. Tooltip opens on focus/hover and dismisses with Escape. Use native required on the input in addition to any visual marker. Avoid putting every validation message in an assertive live region.

## Design

Field CSS owns sibling spacing: 8px by default and 4px before a direct FieldError. An empty FieldError renders nothing and adds no space. This gives 8px from FieldContent to control, 4px between label and description, 4px from control to error, 16px between fields. FieldHelp is visually 20px with a 14px Info icon and a 24px hit area. Keep sibling spacing so its hit area does not overlap other controls. Labels use Medium500, descriptions/errors Caption Regular400. Borderless inputs always retain rounded corners.

## References

Storybook includes With Input, With Input Group, With Textarea and With Select galleries. Each shows empty, filled, disabled, read-only and invalid fields; hover and focus are exercised on the editable controls.

- [Input](./input.md)
- [Input Group](./input-group.md)
- [Tooltip](./tooltip.md)
- Storybook: Components / Field
- Tests: `__tests__/field.test.tsx`

Combobox combinations live in Field Storybook: single, chips inside, chips above, free-text inside, free-text above and popup. Each shows empty, filled, disabled, read-only and invalid states. Free-text defaults to arbitrary values and an Add action without fetching suggestions.

Select uses the same direct-child composition and spacing. Connect FieldLabel to SelectTrigger, and set description/error references and aria-invalid on that trigger. Select follows the shared label-hover behavior and owns its standalone invalid state. See [Select](./select.md).
