# Tabs

Switches between panels of the same context, horizontally or vertically, built on Radix Tabs.

## When to use

- Use it to split one page or one object into sibling views: Overview, Invoices, Settings.
- Use [`OverflowTabs`](./overflow-tabs.md) for a horizontal list that may not fit its container.
- Do not use it for navigation between pages, or for a list of actions: that is a [`DropdownMenu`](./dropdown-menu.md).

## Import

```tsx
import { Tabs, TabsList, TabsTrigger, TabsCounter, TabsContent } from 'lago-ui/tabs'
```

## API

| Part / prop | Notes |
| --- | --- |
| `Tabs value` / `defaultValue` / `onValueChange` | Controlled or uncontrolled selection |
| `Tabs orientation` | `horizontal` (default) or `vertical` |
| `Tabs activationMode` | Default `manual`: arrow keys move focus, Enter or Space selects |
| `TabsTrigger value` / `disabled` | One trigger per panel |
| `TabsCounter value` | A [`NumericBadge`](./numeric-badge.md) that follows the selected and disabled state of its trigger |
| `TabsContent value` | The panel shown for the matching trigger |

Every part forwards its ref and HTML attributes, and merges `className` with `cn()`.

## Examples

```tsx
import { Settings } from 'lucide-react'

<Tabs defaultValue="overview">
  <TabsList aria-label="Customer sections">
    <TabsTrigger value="overview">
      <span className="v2-text-label">Overview</span>
      <TabsCounter value={12} />
    </TabsTrigger>
    <TabsTrigger value="settings">
      <Settings aria-hidden="true" />
      <span className="v2-text-label">Settings</span>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview panel</TabsContent>
  <TabsContent value="settings">Settings panel</TabsContent>
</Tabs>
```

Vertical: pass `orientation="vertical"`, put the layout on `Tabs` (`className="flex items-start gap-6"`) and `justify-start` on each trigger; wrap the label in `min-w-0 flex-1 text-left` so counters align right.

## Accessibility

- Give `TabsList` an `aria-label`.
- Radix handles roles, arrow keys and focus. Selection is manual: focus alone never switches the panel.
- A counter is part of the trigger's accessible name; set `aria-label` on the trigger to override it.
- Leading icons are decorative: `aria-hidden="true"`.

## Design

- Track: `surface-subtle`, 12px radius, 4px padding, 4px gap; it fits its content.
- Trigger: 32px high, 12px horizontal padding, 8px radius, 4px gap, label medium weight, `text-muted`. Hover `interactive-hover`, press `interactive-pressed`, focus 4px `focus-ring`.
- Active trigger: `surface-raised`, `border-divider`, `shadow-v2-interactive`, `text-default`.
- Icons are 14px with stroke 2, `icon-muted` (`icon-default` when active).
- Vertical: the list stacks, grows with its items and has a 220px minimum width.
- Colors follow the surrounding theme; use [`ColorTheme`](./color-theme.md) for a local light/dark region.

## References

- Storybook: Components / Tabs
- Tests: `__tests__/tabs.test.tsx`
