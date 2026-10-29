# Dropdown menu

Use the shadcn-style Radix exports from `~/components/ui/dropdown-menu` for v2 menus. Existing production menus and `Popper` are unchanged.

[Figma template](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb?node-id=106-1421).

```tsx
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

- Compose groups, labels, actions, checkbox/radio items and submenus as children. No data-driven template API is required.
- Checkbox/radio indicators are on the right; optional leading Lucide icons use `icon-muted`, 14px and stroke 2. Decorative icons need `aria-hidden`.
- Checkbox/radio selection keeps the menu open by default. Set `closeOnSelect` to opt into normal dismissal. Use `onCheckedChange` / `onValueChange` to update application state. `onSelect.preventDefault()` controls dismissal, not the primitive's checked-state update.
- Actions close after selection. Use `onSelect` for pointer and keyboard activation. Disabled items cannot activate.
- Set `textValue` and `aria-label` to the action label when adding a description; associate that description with a unique `aria-describedby` ID. Shortcut text is decorative; applications register keyboard shortcuts separately.
- Trigger supports Button or IconButton through `asChild`. An IconButton needs the existing shared TooltipProvider. Never nest another button inside a menu item.
- Wrap a region in `ColorTheme`. Main and submenu portals carry that theme through `ColorThemePortal`.
- Default menu: 280px width, 12px radius, 4px padding, floating surface/shadow and divider border. Rows: minimum 36px, 8px padding/gap/radius. Separators span the inner menu width. Content is constrained to available viewport space and scrolls vertically.
- Layer 2100 sits above existing dialogs (2000) and below toasts (2200) and tooltips (2400), without changing global stacking tokens.
- Radix controls focus, typeahead, arrow keys, collision handling and Escape. Highlight uses `interactive-hover`; pointer press uses `interactive-pressed`. The trigger retains its existing focus ring.

Preview: `/design-system/shadcn-dropdown-menu`. This is a development-only tab. No production imports are introduced.
