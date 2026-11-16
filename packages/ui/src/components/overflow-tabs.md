# OverflowTabs

Horizontal [`Tabs`](./tabs.md) whose triggers that do not fit move into a More menu.

## When to use

- Use it for a horizontal tab list whose width depends on the container or on the content: many sections, long labels, narrow layouts.
- Use plain [`Tabs`](./tabs.md) when every trigger always fits, or for a vertical list.

## Import

```tsx
import { OverflowTabs, OverflowTabsList, OverflowTabsTrigger } from 'lago-ui/overflow-tabs'
import { TabsContent, TabsCounter } from 'lago-ui/tabs'
```

## API

| Part / prop | Notes |
| --- | --- |
| `OverflowTabs` | Same props as `Tabs`, always horizontal |
| `OverflowTabsList aria-label` | Measures its triggers and moves the ones that do not fit into More |
| `OverflowTabsTrigger value` / `disabled` | Must be a direct child of `OverflowTabsList` |
| `OverflowTabsTrigger textValue` | Required: the menu item text, used for typeahead in More |

Panels are regular `TabsContent` from [`Tabs`](./tabs.md).

## Examples

```tsx
<OverflowTabs defaultValue="Overview">
  <OverflowTabsList aria-label="Customer sections">
    {sections.map((label) => (
      <OverflowTabsTrigger key={label} value={label} textValue={label}>
        <span className="v2-text-label truncate">{label}</span>
        {label === 'Invoices' && <TabsCounter value={12} />}
      </OverflowTabsTrigger>
    ))}
  </OverflowTabsList>
  {sections.map((label) => (
    <TabsContent key={label} value={label}>
      {label} panel
    </TabsContent>
  ))}
</OverflowTabs>
```

## Accessibility

- Selecting a hidden item from More replaces the last visible slot and moves focus to the selected tab.
- When a resize hides the focused trigger, focus moves to More.
- The More trigger is labelled "More tabs". Disabled triggers stay disabled in the menu.

## Design

- Same track and trigger styles as [`Tabs`](./tabs.md); More uses the trigger style with a chevron.
- The list takes the full width of its container; visible triggers can shrink, so wrap labels in `truncate`.
- More menu items fill the row, with counters aligned right.

## References

- Storybook: Components / OverflowTabs
- Tests: `__tests__/overflow-tabs.test.tsx`
