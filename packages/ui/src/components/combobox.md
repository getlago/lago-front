# Combobox

Searchable single or multiple selection. Search lives in the popup; selections appear as a value or chips inside/above the trigger.

## When to use

Use for selecting existing records from a searchable list: quote owners, customers, plans or metrics. Use Select for short lists without search, SearchInput for searching content without selecting a value, and Input for free text. Existing v1 usages and form adapters remain unchanged.

## Import

```tsx
import { Combobox, type ComboboxOption } from 'lago-ui/combobox'
import { TooltipProvider } from 'lago-ui/tooltip'
```

## API

| Prop                                                                         | Behavior                                                                                                                                                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options`                                                                    | Ordered `{ value, label?, description?, group?, disabled?, hidden? }[]`. Values are unique string IDs. Label falls back to ID. Keep each group's options contiguous.                       |
| `multiple`                                                                   | Defaults to false. Single value is `string \| null`; multiple value is `string[]`.                                                                                                         |
| `value`, `onValueChange`, `defaultValue`                                     | Controlled or uncontrolled selection; uncontrolled values reset with their native form.                                                                                                    |
| `placement`                                                                  | Multi only: `inside` (default) or `above`. No collapsing or selection limit.                                                                                                               |
| `placeholder`, `searchLabel`, `clearSearchLabel`, `emptyText`, `loadingText` | Required localized copy. Search label is also its placeholder.                                                                                                                             |
| `chipsLabel`, `removeLabel(label)`                                           | Required for multiple selection; label the selected-values toolbar and removal actions.                                                                                                    |
| `query`, `onQueryChange`                                                     | Controlled or uncontrolled search. Dismissal clears query; multi selection retains it and keeps the popup open.                                                                            |
| `filter`                                                                     | `local` (default) matches normalized label/ID without reordering; `server` renders supplied results unchanged. Caller owns fetching, debounce, cancellation and stale-response protection. |
| `selectedOptions`                                                            | Metadata for selected IDs outside the current result page. Supply it for remote results; missing results never clear selection.                                                            |
| `loading`, `errorText`                                                       | Replace results with one status line. Empty text only appears after a successful empty result.                                                                                             |
| `createAction`                                                               | Optional `{ label, onClick, disabled?, loading? }`. Fixed full-width Ghost button with Plus below the scrolling results. Opens caller-owned creation flow; never invents a selected ID.    |
| `renderOption(option)`                                                       | Optional custom label rendering. Caller owns accessible custom content; standard string labels retain built-in truncation.                                                                 |
| `disabled`, `readOnly`                                                       | Disabled retains the control/chips without remove buttons. Read-only multi renders default Badges with no trigger.                                                                         |
| `id`, ARIA label/description/invalid props                                   | Associate a standalone label or compose with Field. Error presentation works without Field.                                                                                                |
| `name`                                                                       | Native form submission sends selected IDs; multi repeats the name.                                                                                                                         |
| `portalContainer`                                                            | Portal destination for a modal's focus/top-layer boundary.                                                                                                                                 |
| `onOpenChange`, `className`, forwarded ref                                   | Observe opening, size the surface, and focus the trigger. Read-only multi has no trigger ref.                                                                                              |

`ComboboxChip` and `ComboboxChips` are shared parts used by Combobox, not independent selection controls. Applications should normally use the composed Combobox.

## Examples

```tsx
<TooltipProvider>
  <Combobox
    multiple
    options={owners}
    value={ownerIds}
    onValueChange={setOwnerIds}
    placeholder="Select quote owners"
    searchLabel="Search owners"
    clearSearchLabel="Clear search"
    emptyText="No owners found"
    loadingText="Loading owners…"
    chipsLabel="Quote owners"
    removeLabel={(label) => `Remove ${label}`}
    aria-label="Quote owners"
  />
</TooltipProvider>
```

Use one TooltipProvider around the region. With Field, render `FieldContent` (label, help, description), `Combobox`, then `FieldError` as siblings. Connect `htmlFor` to `id`, pass `aria-describedby` for description/error and `aria-invalid` for errors. For read-only multi's badge group, also use `aria-labelledby` referencing the label. Field owns the existing 8px/4px spacing. See Components / Field / With Combobox and both chip placements.

In modal dialogs pass a container inside the dialog as `portalContainer`. In native `<dialog>`, this keeps the popup within the browser's top layer. Form adapters and production migrations are deferred until a real form adopts v2.

## Accessibility

Base UI owns combobox/listbox semantics, active descendants, keyboard navigation, selection, dismissal and focus return. Opening focuses popup search; Escape closes and returns to the trigger. Single selection closes; multi selection stays open. Left/right keys edit the search caret. Disabled/hidden options cannot be selected. Enter does not create unmatched text. Creation is an explicit button.

Chip removal is a native button, a sibling of the trigger rather than nested inside it. Removal preserves focus on the next/previous remove action or the trigger and does not submit the form. Use localized action labels. Explicit `disabled` removes chip actions; native disabled fieldsets also hide and block their buttons.

Long standard labels, descriptions and chips truncate in the middle while retaining the final five grapheme clusters. Full labels remain available to assistive technology, copying and a hover/focus tooltip. When even five characters cannot fit, the physical container clips them; give controls enough width. Avoid character-count-only ellipsis or CSS end truncation.

## Design

- Minimum width 240px, capped to the available container width; control minimum height 36px.
- Popup offset 8px. Search and optional creation footer remain fixed while results scroll. Separators span the full menu width; group labels follow Dropdown Menu.
- Chips match the default Badge at 24px height: 8px left padding, 2px right with a remove button or 8px without.
- Remove actions use IconButton `icon-xs` (20×20px, 14px icon). Search clear uses `icon-sm` (32px). All existing button variant names are unchanged.
- Standalone states are documented under Combobox; combinations and their states live under Field. Label and description hover affect the whole control.

## References

- [Design file](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb/)
- [Base UI Combobox](https://base-ui.com/react/components/combobox)
- Storybook: Components / Combobox, Components / Field, Components / IconButton / Extra Small
- Tests: `__tests__/combobox.test.tsx`, `__tests__/combobox-primitive.test.tsx`, `__tests__/middle-truncate.test.ts`
