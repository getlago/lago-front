## Selector hover actions

Use `SelectorActions` (exported from `~/components/designSystem/Selector`) for
hover action buttons inside `Selector` cards, instead of manually wrapping each
`Button` in a `Tooltip`.

**Why:** `SelectorActions` already handles `stopPropagation`, tooltip wrapping,
and consistent button rendering. A hand-rolled `Tooltip` + `Button` combo
duplicates that and tends to drift from the rest of the design system's hover
actions.

**How to apply:** when building `hoverActions` for a `Selector`, render chips (or
other non-action content) directly, then use `<SelectorActions actions={[...]} />`
for the action buttons (edit, delete, etc.). Each action takes
`{ icon, tooltipCopy, onClick, disabled? }`.
