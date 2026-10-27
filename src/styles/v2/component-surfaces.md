# v2 component colors, surfaces, borders and shadows

Use this guide for new shadcn components. It does not migrate existing production components. The tokens already exist; the component recipes below are defaults to apply as each component is built.

## Main rules

- Use semantic colors, not primitive colors or hardcoded hex values.
- Pick the background by the component's purpose. Nesting does not automatically increase elevation.
- Use a **1px solid border** unless specified otherwise.
- Use `border-subtle` for separators and containers; `border-default` for input/control boundaries. Reserve `border-strong` for deliberate high-emphasis boundaries.
- Use shadows for floating content and explicitly elevated interactive controls, not every page block.
- Keep floating backgrounds opaque. Only interaction layers and overlays use alpha.
- Use the same classes in light and dark mode. The theme changes their values.

## Surface palette

| Background role | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `canvas` | `#FFFFFF` | `#1A1A1A` | Application background |
| `surface` | `#FFFFFF` | `#1A1A1A` | Content that blends into the page |
| `surface-inset` | `#FBFBFB` | `#212121` | Navigation, inputs and grouped content |
| `surface-raised` | `#FFFFFF` | `#232323` | A distinct block within the page |
| `surface-floating` | `#FFFFFF` | `#2C2C2C` | Dialogs, menus, popovers and toasts |
| `inverse` | `#1A1A1A` | `#2C2C2C` | Tooltip background |
| `inverse-foreground` | `#FFFFFF` | `#FFFFFF` | Text and icons on the inverse surface |

## Component defaults

Names in the background and border columns are semantic roles. “None” means no visible border or shadow.

| Component | Background | Border | Shadow |
| --- | --- | --- | --- |
| App background | `canvas` | None | None |
| Main content / flat section | `surface` | None | None |
| Navigation background / sidebar | `surface-inset` | `border-subtle` on the edge next to content | None |
| Navigation item | Transparent; `selected` when selected | None | None |
| Raised content block | `surface-raised` | `border-subtle` | None |
| Dialog | `surface-floating` | `border-subtle` | `shadow-v2-dialog` |
| Dialog backdrop | `overlay` | None | None |
| Toast | `surface-floating` | `border-subtle` | `shadow-v2-floating` |
| Tooltip | `inverse` | None | `shadow-v2-floating` |
| Search bar | `surface-inset` | `border-default` | None |
| Text input / textarea | `surface-inset` | `border-default` | None |
| Combo-box trigger / input | `surface-inset` | `border-default` | None |
| Combo-box dropdown | `surface-floating` | `border-subtle` | `shadow-v2-floating` |
| Popover / dropdown menu | `surface-floating` | `border-subtle` | `shadow-v2-floating` |
| Primary button | `action-primary` | None | None |
| Secondary button | `surface` | `border-subtle` | `shadow-v2-interactive` |
| Clickable card (when elevation is appropriate) | `surface-raised` | `border-subtle` | `shadow-v2-interactive` |
| Ghost button | Transparent | None | None |
| Destructive button | `destructive` | None | None |
| Table header | `surface` | Bottom `border-subtle` | None |
| Table sticky header | **Opaque** `surface` | Bottom `border-subtle` | None |
| Table row / line | Transparent over the table's `surface` | Bottom `border-subtle` | None |
| Table cell | Transparent; inherit the row appearance | None; let the row own the separator | None |
| Table group header | `surface-inset` | Bottom `border-subtle` | None |

Sticky headers need an opaque fill and appropriate stacking order so scrolling rows do not show through. Being sticky does not make them a floating surface.

A neutral toast keeps its floating background even for success or error messages. Use the appropriate status foreground for its icon; do not automatically tint the entire toast.

## Text and icon colors

| Use | Role |
| --- | --- |
| Main text, input values, unselected navigation text | `text-default` |
| Secondary text | `text-muted` |
| Tertiary text, placeholder, current breadcrumb and breadcrumb separator | `text-subtle` |
| Standard / secondary / tertiary icons | `icon-default` / `icon-muted` / `icon-subtle` |
| Unselected navigation icon | `icon-subtle` |
| Selected item text and icon | `selected-foreground` |
| Link, text action, active tab label | `link`; `link-hover` on hover |
| Active tab underline | `action-primary` |
| Primary button text and icon | `action-primary-foreground` |
| Secondary / ghost button text and icon | `text-default` |
| Destructive button text and icon | `destructive-foreground` |
| Tooltip text and icon | `inverse-foreground` |
| Status icon | `success-foreground`, `danger-foreground`, `warning-foreground` or `info-foreground` |

## Interaction states

- **Neutral hover:** `interactive-hover` over the existing background.
- **Neutral press:** `interactive-pressed` replaces the hover layer; do not stack both.
- **Selection:** `selected` with `selected-foreground`. Preserve its built-in alpha: black 8% in light, white 10% in dark. Avoid adding another hover layer to selection by default.
- **Primary button:** `action-primary` → `action-primary-hover` → `action-primary-pressed`.
- **Destructive button:** `destructive` → `destructive-hover` → `destructive-pressed`.
- **Disabled control:** `disabled` background, `disabled-border` and `disabled-foreground`; no hover or press feedback.
- **Invalid input:** keep its background and use `danger-border` with `danger-foreground` for the error message.
- **Keyboard focus:** 4px `focus-ring`, no gap. Use `focus-border` on bordered controls. Implement focus per component; do not remove focus visibility.

Alpha interaction fills must retain the correct background beneath them. For a filled button, use an overlay or a layered background; replacing its solid background with alpha alone can expose the wrong parent surface.

## Tailwind examples

```tsx
// Text input: default appearance only; add its states in the component.
className="border border-border-default bg-surface-inset text-text-default"

// Popover or toast.
className="border border-border-subtle bg-surface-floating text-text-default shadow-v2-floating"

// Dialog.
className="border border-border-subtle bg-surface-floating text-text-default shadow-v2-dialog"

// Tooltip.
className="bg-inverse text-inverse-foreground shadow-v2-floating"

// Current breadcrumb.
className="text-text-subtle"
```

`border-border-default` is intentional: the first `border-` selects the Tailwind property; `border-default` is the semantic color name.

## Shadows and themes

| Shadow | Light | Dark |
| --- | --- | --- |
| Interactive | `0 0 0 0.5px` black 12.5% + `0 1px 1px` black 4% + `0 2px 4px` black 4% | Same values |
| Floating | `0 8px 24px` black 12% + `0 2px 6px` black 6% | Same geometry, black 35% + 20% |
| Dialog | `0 16px 48px` black 16% + `0 2px 8px` black 8% | Same geometry, black 40% + 20% |

Floating and dialog shadows have zero spread. Interactive uses a 0.5px spread on its first layer to create a fine edge. The utilities preserve Tailwind focus rings. Do not use a raw `box-shadow` declaration that replaces the focus ring.

Use `ColorTheme` for local themes and `ColorThemePortal` for portalled dialogs, tooltips and dropdowns so they inherit the correct colors and shadows. A popover opened from a dialog still uses `surface-floating` and the floating shadow; it does not automatically receive a lighter background.

Source of truth: `colors.css`, `shadows.css` and `tailwindColors.ts` in this directory. Component-specific exceptions should be decided when designing that component.
