# Tooltip

Short, non-interactive hint shown on hover or keyboard focus, built on Radix Tooltip.

## When to use

- Use it to name or briefly explain a control, typically an icon.
- For icon-only buttons prefer [`IconButton`](./icon-button.md), which wires the tooltip and the accessible name together.
- Do not put essential or interactive content in a tooltip: it must stay available without hover.
- The legacy `components/designSystem/Tooltip` is unchanged and production consumers are not migrated.

## Import

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'lago-ui/tooltip'
```

## API

| Part | Notes |
| --- | --- |
| `TooltipProvider` | Mount one around the toolbar or v2 region, not around each trigger. Sets the timings below |
| `Tooltip` | Root of one tooltip |
| `TooltipTrigger asChild` | Wrap the control that shows the tooltip |
| `TooltipContent` | The text. Accepts Radix `side` / `align`; `sideOffset` defaults to 8, `collisionPadding` to 8 |

Timings: the first hover waits 300ms; after a tooltip closes, another trigger in the same provider opens instantly for 500ms. Keyboard focus opens immediately. Do not override timings per tooltip.

## Examples

```tsx
import { Copy } from 'lucide-react'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" aria-label="Copy invoice number">
        <Copy aria-hidden="true" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Copy invoice number</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Accessibility

- The trigger still needs its own accessible name.
- Escape, blur and activation dismiss the tooltip; moving the pointer into the content keeps it open.
- Native disabled buttons cannot receive focus, so their tooltip is not keyboard-reachable. Use an explicit focusable wrapper when an explanation is needed, rather than changing disabled button behavior.

## Design

- `inverse` background, `inverse-foreground` text, body typography (14px / 20px), `px-3 py-2`, `rounded-xl`, `shadow-v2-floating`.
- Hugs short text, wraps at a 240px maximum outer width, shrinks to the viewport, left aligned.
- Default placement top / center with an 8px offset; collisions can flip or shift it.
- Layer `z-tooltip` (2400), above drawers and dialogs. No arrow, no opening animation.
- `ColorThemePortal` keeps the surrounding theme when the content renders in a portal.

## References

- Storybook: Components / Tooltip
- Tests: `__tests__/tooltip.test.tsx`
