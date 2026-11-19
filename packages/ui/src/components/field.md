# Field

Composable labels, descriptions, controls and errors. Independent of any form library.

## When to use

Compose with Input or another control. Keep validation, translation, formatting and presence state in the application. Use ordinary grid classes for columns.

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

Field, FieldContent and FieldGroup accept native div props and refs. FieldLabel accepts native label props; FieldDescription and FieldError accept paragraph props. FieldError renders only when content exists. Field supports data-disabled and data-invalid. FieldHelp accepts a translated accessible label and tooltip children; place it beside, not inside, FieldLabel. Share one TooltipProvider above the form.

## Examples

```tsx
<Field>
  <FieldContent>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <FieldDescription id="name-description">Shown on invoices.</FieldDescription>
  </FieldContent>
  <div className="flex flex-col gap-1">
    <Input id="name" aria-describedby="name-description name-error" aria-invalid />
    <FieldError id="name-error">Enter a name.</FieldError>
  </div>
</Field>
```

Addable is an app composition, demonstrated in Storybook: Add reveals and focuses an empty input; trash clears the value, removes the input and focuses Add. Re-adding always starts empty. Keep presence independent from value. Disable structural changes for disabled/read-only fields, and clear stale field errors when removing. Optional badges do not imply Addable behavior.

## Accessibility

IDs and aria-describedby are explicit; no hidden form context. Keep help outside the label, use a meaningful button name and provide visible essential instructions. Tooltip opens on focus/hover and dismisses with Escape. Use native required on the input in addition to any visual marker. Avoid putting every validation message in an assertive live region.

## Design

8px from FieldContent to control, 4px between label and description, 4px from control to error, 16px between fields. FieldHelp is visually 20px with a 14px Info icon and a 24px hit area. Keep sibling spacing so its hit area does not overlap other controls. Labels use Medium500, descriptions/errors Caption Regular400. Borderless inputs always retain rounded corners.

## References

- [Input](./input.md)
- [Tooltip](./tooltip.md)
- Storybook: Components / Field
- Tests: **tests**/field.test.tsx
