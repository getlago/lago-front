# V2 Breadcrumb

Compose Breadcrumb → BreadcrumbList → BreadcrumbItem, using BreadcrumbLink for ancestors and BreadcrumbPage for the current page. Separate items with BreadcrumbSeparator. Use BreadcrumbLink asChild with Link from ~/core/router for application navigation. The current page is plain text with aria-current="page".

This component is available for v2 adoption only. Existing MainHeader breadcrumbs and production pages are unchanged.

## Collapsing

- One to four levels: show every level.
- Five or more: first → ellipsis → immediate parent → current.
- The ellipsis opens the existing v2 DropdownMenu with the hidden middle ancestors in hierarchy order.
- A constrained layout may explicitly collapse earlier, only if at least one middle ancestor is hidden.
- Long labels truncate; they do not automatically collapse the trail.
- No resize measurement or automatic collapsing is built into the primitives.

Compose BreadcrumbLink asChild with DropdownMenuTrigger, labelled “Show hidden ancestors”, containing the decorative BreadcrumbEllipsis. Menu links use DropdownMenuItem asChild and the slug-aware Link. Wrap their text in a min-w-0 truncate span. See the dev showcase for a complete example. Localize accessible labels when adopting in product pages.

## Styling

Use untrimmed v2-text-body with font-medium, p-1, gap-1 and rounded-lg. Ancestors use text-muted, hover uses interactive-hover, pressed uses interactive-pressed while keeping text-muted. Current text uses disabled-foreground. ChevronRight uses icon-subtle, size 14 and strokeWidth 2. Keyboard focus uses the existing 4px focus-ring with no offset. Dropdown styling and keyboard behavior come from the shared menu.

The overflow trigger uses a decorative text ellipsis in a 20px box plus 4px padding (28px total). Menu labels retain the shared Dropdown Menu body regular typography.

Constrain the surrounding layout to truncate long labels. Prefer shrinking middle ancestors before the current page; this is controlled by the composing layout. Keep the full text in the DOM so assistive technology reads it. BreadcrumbPage truncates directly; wrap long link text in a truncate span. Add a tooltip explicitly only where needed.
