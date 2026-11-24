# Select

## When to use

Choose one value from a short, predefined list. Use Combobox for search, large datasets, free text or multiple selection; use DropdownMenu for actions. Select has no search, creation, chips or clear button. Existing v1 forms are unchanged.

## Import

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'lago-ui/select'
```

## API

Select wraps Base UI's single-selection Root with string or number values. Use `value`/`onValueChange` or `defaultValue`, and supply `items` with value/label mappings so the closed trigger displays labels. `null` is empty; `0` is a valid value. Caller ordering is preserved. Changing labels or externally resetting value updates the trigger without emitting a selection.

Root accepts `name`, `form`, `required`, `disabled`, `readOnly`, and controlled or uncontrolled open props. Value/open callbacks retain Base UI event details and cancellation. Read-only prevents opening and changes but remains focusable and retains the submitted value; disabled blocks interaction. No Formik/TanStack adapter or app provider is required.

SelectTrigger forwards an HTMLButtonElement ref and native accessibility attributes. SelectValue renders the selected label or `placeholder`. SelectContent owns the themed portal, positioning and scrollable list; optional `container` supports nested overlays. SelectItem requires `value` and `label`, with optional `description` and `disabled`. SelectGroup/SelectLabel provide named groups; SelectSeparator divides them. Items use Select option semantics, not Dropdown Menu action semantics.

Labels and placeholders are caller-owned and translated by the app. Keep the selected value in the supplied label mapping even if its option is temporarily unavailable, or explicitly reset it; Select does not silently choose a replacement. For an empty collection, disable the control and explain why through FieldDescription. Data fetching and loading UI belong to the caller.

## Examples

```tsx
const periods = [{ value: 'month', label: 'Monthly' }]

<Select items={periods} value={period} onValueChange={setPeriod} name="period">
  <SelectTrigger aria-label="Billing period">
    <SelectValue placeholder="Select a billing period" />
  </SelectTrigger>
  <SelectContent>
    {periods.map((item) => <SelectItem key={item.value} {...item} />)}
  </SelectContent>
</Select>
```

Compose with FieldContent, FieldLabel, FieldDescription and FieldError. Set FieldLabel htmlFor to the trigger id, aria-invalid on the trigger, and aria-describedby to the description and any rendered error. FieldHelp sits beside the label. See Components/Field → With Select in Storybook. There is no SelectField wrapper.

## Accessibility

Provide a visible label or aria-label. Group labels are not selectable. Descriptions are associated separately from option names, and typeahead matches the label. SelectItem respects a supplied aria-label or aria-labelledby; aria-labelledby takes precedence when both are supplied. Base UI handles arrow navigation, typeahead, selection, Escape dismissal and focus restoration. Disabled options cannot be committed. Keyboard focus stays visible in read-only mode while preserving its subtle background. Use native name/required for form integration.

## Design

Matches the v2 Select and Dropdown Menu tokens: 36px control, 12px horizontal padding, 8px gap/radius, 14px chevrons/checkmark. Default minimum width is 240px capped at the container width. The menu follows trigger width, opens 4px below with viewport collision handling, and scrolls at available height up to 320px. Its 4px padding, 12px radius, label rows, zero inter-item gaps and edge-to-edge separators follow Dropdown Menu. Descriptions wrap; long labels use end ellipsis with full accessible text.

State order: Empty, Filled, Hover, Focus, Disabled, Read-only, Invalid, Invalid + Hover, Invalid + Focus. Standalone invalid styling does not require Field. Field preserves 8px text-to-control and 4px control-to-error spacing. Label hover affects its Select only. Read-only hides the chevron. Light/dark portals inherit ColorTheme and use the existing floating shadow token.

## References

- [Field](field.md)
- [Dropdown Menu](dropdown-menu.md)
- [Combobox](combobox.md)
- [Figma Select](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=375-815)
- [Figma Select Content](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=375-870)
- [Base UI Select](https://base-ui.com/react/components/select)
