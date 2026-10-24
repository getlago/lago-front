# Shadcn Button

The v2 Button lives in `src/components/ui/button.tsx`. The legacy production
`src/components/designSystem/Button.tsx` is unchanged. Adoption is explicit; this
change only uses the Button on development design-system pages.

## API

Use `variant="default"` (primary), `secondary`, `outline`, `ghost`, `link`, or
`destructive`. Text sizes are `sm` (32px), `default` (36px), and `lg` (40px), with
horizontal padding of 12px, 16px, and 20px respectively. Icon-only sizes are
`icon-sm`, `icon`, and `icon-lg`: square 32px, 36px, and 40px controls. All use
full radius. Link hugs its content and ignores size-based padding/dimensions.

```tsx
<Button variant="secondary" size="lg">Create customer</Button>
<Button variant="ghost" size="icon-sm" aria-label="Copy API key">
  <Copy size={14} strokeWidth={2} aria-hidden="true" />
</Button>
<Button variant="link" asChild><Link to="/customers">Customers</Link></Button>
```

Icons use 14px and stroke width 2 at every button size, with a 4px gap between
icon and label (`gap-1`). Icon-only buttons require
an accessible name, normally `aria-label`. Decorative icons should be hidden
from assistive technology. Native buttons default to `type="button"`; supply
`type="submit"` for form submission.

## Appearance

Colors follow the surrounding v2 color theme. Use `ColorTheme` when an explicit
light/dark region is needed. Primary/destructive use their action state tokens.
Secondary uses surface-raised at rest, surface-inset for focus/loading and as the
base for hover/pressed feedback, border-subtle and shadow-v2-interactive. Outline
uses surface and border-default. Ghost is transparent at rest. Alpha interactive
feedback overlays secondary/outline surfaces and fills ghost controls.

Focus uses a 4px focus-ring with no gap; outline buttons also use focus-border.
Link uses link/link-hover, stays underlined, and has no padding or surface.
Place standalone links with sufficient surrounding clickable space; do not
assume trimmed label height is a suitable touch target. Text trimming falls
back to the existing line-height when the browser does not support it.

## Loading and disabled

`loading` preserves the original label/icons in layout, makes them invisible,
and centers a spinner over them. The accessible name and width remain stable.
It sets aria-busy and prevents activation without adopting disabled colors.
`disabled` applies disabled tokens. Both block native buttons and slotted anchor
activation. Spinner animation respects reduced motion.

## Preview and validation

Open `/design-system/shadcn-button` within the current organization. The page
shows both themes, six variants, three text/icon sizes, leading/trailing icons,
disabled/loading states and navigation links. Toggle loading to check geometry;
use Tab, Enter and Space to check keyboard behavior.

Tests cover native form behavior, refs/attributes, loading, slotted navigation,
blocked activation and direct showcase routing. Existing v2 color and legacy
isolation tests also run. No Tailwind version, manifest or lockfile changes are
required.

Design source: https://www.figma.com/design/B3QfPQpQfNXlBOu6hjvQUb/v2---Desktop-components?node-id=0-1
