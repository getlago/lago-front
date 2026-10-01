## Selector hover actions

Use `SelectorActions` (exported from `~/components/designSystem/Selector`) for
hover action buttons inside `Selector` cards, instead of manually wrapping each
`Button` in a `Tooltip`. It already handles `stopPropagation`, tooltip wrapping,
and consistent button rendering, so a hand-rolled `Tooltip` + `Button` combo
duplicates that and tends to drift from the rest of the design system's hover
actions.

When building `hoverActions` for a `Selector`, render chips (or other
non-action content) directly, then use `<SelectorActions actions={[...]} />`
for the action buttons (edit, delete, etc.). Each action takes
`{ icon?, tooltipCopy?, onClick, disabled? }` - only `onClick` is required;
`icon` defaults to a horizontal-dots glyph and `tooltipCopy` is omitted (no
tooltip) when absent. Reference: `src/components/plans/CommitmentsSection.tsx`.
