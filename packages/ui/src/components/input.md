# Input

Native single-line inputs aligned with the v2 design.

## When to use

Use Input for text entry, SearchInput for search, and PasswordInput for a password with a visibility toggle. Formatting and form state belong in the app. AmountInput, multiline fields, and arbitrary adornments are separate work. Existing legacy fields are not migrated automatically.

## Import

```tsx
import { Input, PasswordInput, SearchInput } from 'lago-ui/input'
```

## API

Input accepts native input props, an HTMLInputElement ref, className, and `variant="default" | "search" | "borderless"`. It uses native onChange events and supports both value/onChange and defaultValue. SearchInput fixes type and variant to search. PasswordInput requires translated showPasswordLabel and hidePasswordLabel strings and owns only visibility state. Both forward refs to the input. No radius option or clear action.

## Examples

```tsx
<Input id="name" name="name" autoComplete="organization" />
<Input variant="borderless" aria-label="Usage threshold" inputMode="decimal" />
<PasswordInput aria-label="Password" showPasswordLabel="Show password" hidePasswordLabel="Hide password" />
```

## Accessibility

Associate a label through htmlFor/id or provide an accessible name. Link description/error IDs using aria-describedby; mark errors with aria-invalid. Disabled prevents editing/focus; readOnly allows focus and selection. Password reveal is a button that never submits the form. Search has no clear button. Table containers must not clip focus rings. Native autocomplete and inputMode remain caller-controlled.

## Design

36px high, 8px rounded corners, 12px horizontal padding, regular 14/20 typography. Placeholders use text-subtle; entered values use text-default. Plain defaults to surface; hover/read-only and search use surface-subtle. Password focus also uses surface-subtle. Invalid inputs use surface at rest and surface-subtle on hover, retaining danger-border. Autofill follows the same semantic backgrounds, text colors and focus ring in both themes. Borderless uses surface at rest and is transparent when read-only. Focus uses focus-border and a 4px focus-ring with no gap; invalid keeps danger-border during focus. Disabled uses semantic disabled colors, not opacity. Search and password icons use icon-muted, with an 8px gap to the text. Use Field for the 8px content-to-control gap.

## References

- [Field](./field.md)
- Storybook: Components / Input
- Tests: **tests**/input.test.tsx
