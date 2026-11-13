# Dropdown menu

Menu of actions, toggles or choices opened from a trigger, built on Radix Dropdown Menu.

## When to use

- Use it for a list of actions on an object ("Edit", "Duplicate", "Delete") or for checkbox / radio choices in v2 UI.
- Compose it from children: groups, labels, items, checkbox and radio items, submenus. There is no data-driven template API.
- Existing production menus and `Popper` are unchanged and stay on the legacy design system.

## Import

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'lago-ui/dropdown-menu'
```

Also exported: `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuShortcut`.

## API

| Part / prop | Notes |
| --- | --- |
| `DropdownMenuTrigger asChild` | Wrap a [`Button`](./button.md) or an [`IconButton`](./icon-button.md). Never nest another button inside a menu item |
| `DropdownMenuItem onSelect` | Pointer and keyboard activation. The menu closes after selection |
| `DropdownMenuItem variant` | `default` or `destructive` (danger text and icon) |
| `DropdownMenuCheckboxItem` / `DropdownMenuRadioItem` `closeOnSelect` | Default `false`: selection keeps the menu open. Set `true` to close on selection |
| `onCheckedChange` / `onValueChange` | Update application state from checkbox / radio items |
| `textValue` | Typeahead text; set it when the item also has a description |

`onSelect` with `event.preventDefault()` controls dismissal only, not the checked state.

## Examples

```tsx
import { Pencil } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={editCustomer}>
      <Pencil aria-hidden="true" />
      Edit customer
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onSelect={confirmDeletion}>
      Delete customer
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Accessibility

- Radix handles focus, typeahead, arrow keys, collision and Escape.
- Leading icons are decorative: `aria-hidden="true"`.
- An item with a description: set `textValue` and `aria-label` to the action label, and link the description with a unique `aria-describedby` id.
- Shortcut text is decorative: register keyboard shortcuts separately in the application.
- Disabled items cannot activate.
- An `IconButton` trigger needs the shared `TooltipProvider` around the region.

## Design

- Content: width follows content, 132px minimum and 240px maximum, both capped to the available viewport width (8px collision padding). Main menus and submenus share these rules; override with `className`. 12px radius, 4px padding, `surface-floating`, `shadow-v2-floating`, `border-divider`. Constrained to the viewport and scrolls vertically.
- Plain-text item labels and group headings truncate to one line with an ellipsis; icons, shortcuts and indicators keep their space. Full text stays available to assistive technology and typeahead. For custom label/description markup, use a `min-w-0` wrapper and `truncate` on each text line.
- `DropdownMenuItem asChild` (and the checkbox, radio and sub-trigger items) keeps its single child, so a router link renders and activates.
- Rows: minimum 36px high, 8px padding, gap and radius. Hover uses `interactive-hover`, press uses `interactive-pressed`.
- Checkbox and radio indicators sit on the right. Leading Lucide icons use `icon-muted`, 14px, stroke 2.
- `DropdownMenuSeparator` spans the inner menu width; do not put the standalone `Separator` inside a menu.
- Layer 2100: above dialogs (2000), below toasts (2200) and tooltips (2400).
- Wrap the region in [`ColorTheme`](./color-theme.md); the menu and submenu portals inherit it through `ColorThemePortal`.

## References

- Storybook: Components / DropdownMenu
- Figma: [Dropdown template](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=106-1421)
- Tests: `__tests__/dropdown-menu.test.tsx`
