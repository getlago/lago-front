# Breadcrumb

Navigation trail showing the current page in a hierarchy.

## When to use

Compose Breadcrumb → BreadcrumbList → BreadcrumbItem, using BreadcrumbLink for ancestors and BreadcrumbPage for the current page. Separate items with BreadcrumbSeparator. Use BreadcrumbLink asChild with the application’s router Link for application navigation. The current page is plain text with aria-current="page". Supply a localized aria-label for each Breadcrumb navigation landmark; the primitive requires it and has no English default.

This component is available for v2 adoption only. Existing MainHeader breadcrumbs and production pages are unchanged.

## API

- One to four levels: show every level.
- Five or more: first → ellipsis → immediate parent → current.
- The ellipsis opens the existing v2 DropdownMenu with the hidden middle ancestors in hierarchy order.
- A constrained layout may explicitly collapse earlier, only if at least one middle ancestor is hidden.
- Long labels truncate; they do not automatically collapse the trail.
- No resize measurement or automatic collapsing is built into the primitives.

Compose BreadcrumbLink asChild with DropdownMenuTrigger, labelled “Show hidden ancestors”, containing the decorative BreadcrumbEllipsis. Menu links use DropdownMenuItem asChild and the slug-aware Link. Wrap their text in a min-w-0 truncate span. See the Storybook examples for complete compositions. Localize accessible labels when adopting in product pages.

## Design

Use untrimmed v2-text-label (label medium, 14/20px, 500), p-1, gap-1 and rounded-lg. Ancestors use text-muted, hover uses interactive-hover, pressed uses interactive-pressed while keeping text-muted. Current text uses text-subtle. ChevronRight uses icon-subtle, size 14 and strokeWidth 2. Keyboard focus uses the existing 4px focus-ring with no offset. Dropdown styling and keyboard behavior come from the shared menu.

The overflow trigger uses a decorative text ellipsis in a 20px box plus 4px padding (28px total). Menu labels retain the shared Dropdown Menu inherited v2-text-body typography (14/20px, regular 400), including links inside breadcrumb menus.

Constrain the surrounding layout to truncate long labels. Prefer shrinking middle ancestors before the current page; this is controlled by the composing layout. Keep the full text in the DOM so assistive technology reads it. BreadcrumbPage truncates directly; wrap long link text in a truncate span. Add a tooltip explicitly only where needed.

The current-page text-subtle token is the approved design choice. Its light-mode value (#909090 on white) remains below 4.5:1 contrast for normal text; this typography update does not resolve that accessibility concern.

## Import

```tsx
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'lago-ui/breadcrumb'
```

## Examples

```tsx
<Breadcrumb aria-label="Customer navigation">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#customers">Customers</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Acme</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

For app navigation, compose `BreadcrumbLink asChild` with the app's slug-aware router link. The package does not import the app router. Use the shared [DropdownMenu](./dropdown-menu.md) for hidden ancestors.

## Accessibility

- Supply a localized `aria-label` for the navigation landmark; distinguish multiple trails on a page.
- The trail is an ordered list. The current page is non-interactive text with `aria-current="page"`.
- Separators and the ellipsis glyph are decorative and hidden from assistive technology. Give the overflow trigger an accessible name.
- Links retain native keyboard behavior and visible focus. Overflow uses shared Radix keyboard navigation, Escape and focus restoration.
- Keep full labels in the DOM when truncating.
- The approved current-page `text-subtle` color remains below AA normal-text contrast in light mode; it is not a disabled-control exemption.

## References

- Storybook: Components / Breadcrumb
- Tests: `__tests__/breadcrumb.test.tsx`
- [Typography](../styles/typography.md)
- [DropdownMenu](./dropdown-menu.md)
