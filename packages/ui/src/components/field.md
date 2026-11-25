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

Field, FieldContent and FieldGroup accept native div props and refs. Field adds orientation="vertical" (default) or "horizontal". FieldGroup adds spacing="default" (16px) or "compact" (8px). FieldSet and FieldLegend accept native fieldset/legend props and refs. FieldLabel accepts native label props; FieldDescription and FieldError accept paragraph props. FieldError renders only when content exists. Field supports data-disabled for label and description styling. Set aria-invalid on the actual control to control its error appearance, and use FieldError to display the error message. FieldHelp accepts a translated accessible label and tooltip children; place it beside, not inside, FieldLabel. Share one TooltipProvider above the form.

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

### Checkbox and radio composition

```tsx
<Field orientation="horizontal">
  <Checkbox id="email" aria-describedby="email-description email-error" aria-invalid />
  <FieldContent>
    <FieldLabel htmlFor="email">Email notifications</FieldLabel>
    <FieldDescription id="email-description">Send finalized invoices.</FieldDescription>
  </FieldContent>
  <FieldError id="email-error">Please review this option.</FieldError>
</Field>
```

For label-only options, place FieldLabel directly after Checkbox or RadioGroupItem. Horizontal Field uses an 8px column gap and places a direct FieldError on a new full-width row with 4px spacing. No caller layout wrappers are needed. The 16px control aligns with the first 20px label line. FieldContent text can wrap.

```tsx
<FieldSet>
  <FieldLegend>Email notifications</FieldLegend>
  <FieldDescription>Choose which updates to send.</FieldDescription>
  <FieldGroup spacing="compact">{/* Independent horizontal checkbox Fields */}</FieldGroup>
</FieldSet>
```

RadioGroup replaces FieldGroup for mutually exclusive options. Connect its aria-labelledby to the FieldLegend ID. Keep selection, validation and form integration with the caller. A group error can be associated using aria-describedby without marking every checkbox invalid. Native fieldset disabled blocks interaction; pass disabled to each Checkbox when you also need Base UI's disabled state attributes. RadioGroup disabled propagates to its items.

## Accessibility

Input and Textarea retain standalone invalid styling through aria-invalid without Field. Field handles layout, not validation. Checkbox and RadioGroupItem highlight on associated FieldLabel hover; clicking the label activates its control. Other controls retain their existing hover behavior.

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

Combobox combinations live in Field Storybook: single, chips inside, chips above, free-text inside, free-text above and popup. Each shows empty, filled, disabled, read-only and invalid states. Free-text defaults to arbitrary values and an Add action without fetching suggestions.
