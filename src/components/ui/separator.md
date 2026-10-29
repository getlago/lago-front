# Separator

Import `Separator` from `~/components/ui/separator` for v2 components.

```tsx
<Separator />
<div className="flex h-10 items-center gap-4">
  <span>Details</span>
  <Separator orientation="vertical" />
  <span>Activity</span>
</div>
```

The line is 1px thick and uses `border-divider`, inherited from the surrounding color theme. It has no margin, padding, radius, or shadow. The parent owns spacing and must provide a height for a full-height vertical separator.

Separators are decorative by default. Set `decorative={false}` when the division should be exposed to assistive technology. They are not interactive or focusable.

Dropdown menus retain `DropdownMenuSeparator` from the dropdown primitives, with the same color and thickness and menu-specific spacing. Do not nest the standalone Separator inside it.

Preview: `/design-system/shadcn-separator`. Existing production dividers are unchanged.
