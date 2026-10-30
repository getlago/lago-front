# Badge

Static, single-line labels based on the [Figma Badge](https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb/v2---Desktop-components?node-id=77-809).

```tsx
import { CircleCheck } from 'lucide-react'
import { Badge } from '~/components/ui/badge'

<Badge variant="success" size="sm">
  <CircleCheck size={14} strokeWidth={2} aria-hidden="true" />
  Active
</Badge>
```

`variant` defaults to `neutral`; `size` is `sm` (20px) or `default` (24px). Uses caption typography (12px/16px) with medium weight (500), 6px radius, 4px gap and 14px icons. Small uses a 20px minimum width and 4px horizontal padding; Default uses a 24px minimum width and 8px horizontal padding. The 1px border is additional to that padding. Text labels fill the remaining space and are center-aligned. No shadow or interaction states.

| Variant | Background | Text / icon | Border |
| --- | --- | --- | --- |
| neutral | surface-subtle | text-default | border-divider |
| info | info | info-foreground | info-border |
| success | success | success-foreground | success-border |
| warning | warning | warning-foreground | warning-border |
| danger | danger | danger-foreground | danger-border |
| disabled | surface-subtle | disabled-foreground | border-divider |
| outline | surface-subtle | text-subtle | border-divider |

Theme colors inherit existing semantic tokens. Use `ColorTheme` for a locally selected light/dark theme. See `/design-system/shadcn-badge` in the development app for every variant and size.

Badge renders a span and forwards its ref, HTML attributes and className. It adds no tab stop, live region or disabled semantics. Disabled is only a visual tone. Keep icons decorative when text already communicates their meaning. For changing announcements, apply live-region semantics at the appropriate containing region.

Use a dedicated interactive chip for removal or selection; do not nest icon buttons into this static Badge. Legacy Chip, Status and other production badges are unchanged.

Subdued text is not automatically exempt from contrast requirements. Outline and Disabled preserve the approved Figma mappings; review contrast before using either for essential information.

Measured text contrast against the badge fill: Outline light 3.09:1 / dark 6.54:1; Disabled light 3.09:1 / dark 3.75:1. Outline light and both Disabled themes are below 4.5:1 for normal text. All other variants exceed 4.5:1 in both themes.
