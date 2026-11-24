# Combobox

## When to use

Free-text accepts arbitrary strings by default, including emails and identifiers. It needs no backend or suggestions: render only `ComboboxAdd` for the typed value. Validation and suggestions remain optional, caller-owned capabilities; email-specific validation belongs to an email use case.

Use Combobox to search and select existing options. Use `multiple` with chips inside the control or in a separate row above. Use `ComboboxFreeText` for email recipients or arbitrary tags that may not exist in the suggestions. Use the popup composition for an action such as assigning an owner from a button; its search lives in the menu. Use Select for a short list that needs no search.

## Import

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from 'lago-ui/combobox'
```

## API

`Combobox` accepts Base UI Combobox Root props, including `items`, controlled/uncontrolled values, `multiple`, `disabled`, `readOnly`, `virtualized`, `filter`, `onInputValueChange`, and item equality/label functions. Multiple selection keeps the menu open. Escape never erases selected values. Keep object identity explicit with `isItemEqualToValue` when fetching new objects.

`ComboboxList` accepts a render function, `getItemKey`, optional `groupBy` and `estimateSize`. Supply the complete loaded collection to Root, never just the visible rows. Virtualisation is enabled on Root. Group options contiguously. Logical option indexes exclude headings; variable-height rows are measured. Use stable keys across query changes and appended pages.

`ComboboxFreeText` is a controlled multiple-selection root: supply `value`, `onValueChange`, `createItem`, `getItemKey`, optional `validate` (message or null), `addLabel` and `duplicateMessage`. Optional `inputValue` and `onInputValueChange` support controlled queries and remote suggestions. Optional `normalize` defaults to trimming; domain-specific normalisation belongs to the caller. `onValidationChange` and `errorId` connect to FieldError. Enter or `ComboboxAdd` commits; blur and Tab do not. Invalid and duplicate values remain editable. A highlighted suggestion takes precedence over free-text creation. IME composition must finish before committing.

`ComboboxChip` requires the complete `label` and accessible `removeLabel`. Disabled chips have no removal button. Read-only chips render as default badges; omit the input shell in that composition. `ComboboxClear` requires `label`. `ComboboxAction` renders an optional full-width creation footer with a plus icon, outside the scrolling list; it does not create a free-text token.

`ComboboxContent` supports `anchor` and portal `container` for nested overlays. `ComboboxText` truncates display labels in the middle, preserving the last five graphemes, and exposes full text to assistive technology and a tooltip. Editable query text is never shortened. In a popup, use a controlled query and an IconButton to clear only that query; ComboboxClear clears the selection.

## Examples

```tsx
<Combobox items={['Alex', 'Sam']}>
  <ComboboxControl>
    <ComboboxInput aria-label="Quote owner" />
  </ComboboxControl>
  <ComboboxContent>
    <ComboboxList getItemKey={(name: string) => name}>
      {(name) => <ComboboxItem value={name}>{name}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

Compose FieldContent, FieldLabel and FieldDescription before the control, and FieldError after it. Set the input's id, aria-describedby and aria-invalid. Field retains its 8px/4px spacing. Standalone invalid styling uses aria-invalid without Field.

Remote search belongs to the caller: control inputValue, debounce requests, cancel stale responses, pass `filter={null}`, retain selected objects, and render ComboboxStatus for loading or pagination. Do not clear selections when results change. No Formik or TanStack adapter is included.

Wrap usage in TooltipProvider, as with IconButton. Combobox Storybook contains standalone controls. Field Storybook contains single, chips inside/above, free-text inside/above and popup combinations, each with empty, filled, disabled, read-only and invalid states.

## Accessibility

Base UI owns keyboard navigation, active descendant, selection and focus restoration. Disabled options may be highlighted but cannot be selected. Keep full option labels and stable identities; headings do not count as options. Provide input labels and translated action labels. Read-only values use badges; disabled controls remain visibly unavailable. Avoid adding an open-state focus ring: only the focused input control receives one.

## Design

Empty and loading messages use `text-subtle` and body typography. Menus use `surface-floating`, `border-divider` and the theme-aware floating shadow; highlighted rows use `interactive-hover`. The chevron uses `icon-default`, switching to `disabled-foreground` when disabled. Dedicated Loading and Empty stories keep those states visible for review in either theme.

Controls have a 36px minimum height and 240px minimum width, shrinking within narrower containers. Chips are 24px with 8px left padding, 2px right padding with a 20px remove IconButton, otherwise 8px. Inside controls use 12px horizontal padding with no chips and 4px padding once chips are present, for both selection and free-text. Placeholder, query and caret share the same inset. Chip rows use 4px gaps; chips above use an 8px gap before the input. Menus match the anchor width; optional creation stays outside the scroll viewport. Existing Radix components remain unchanged.

## References

- [Base UI Combobox](https://base-ui.com/react/components/combobox)
- [Figma Combo-box](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb/?node-id=295-4153)
- [Field](./field.md)
- [IconButton](./icon-button.md)

### Selection identity and Enter

Free-text suggestions default to comparing `getItemKey` values, so typed and suggested values share an identity. An explicit `isItemEqualToValue` overrides this comparison and should agree with `getItemKey`. Selecting an already selected suggestion follows Base UI's toggle behavior.

Enter in an empty normalized free-text query keeps normal form submission behavior. Non-empty values are committed or validated without submitting; IME composition never commits a value.

### Base UI selection patch

Base UI 1.9.0 retains a filtered highlight index when an outside input clears after selecting an item while a controlled multiple popup stays open. The pinned pnpm patch clears that index using Base UI's own index update path. It changes both CommonJS and ESM builds and preserves popup-search behavior. Keep the pointer/keyboard repeated-Enter regressions when upgrading Base UI; remove the patch once an upstream version passes them without it.
