## ComposableTable renderers, column meta and lazy trees

`ComposableTable` (`src/components/designSystem/ComposableTable/`) is TanStack Table
v9 plus the DS styling. The kit owns the look; a feature only composes columns and
rows. Reference consumer: `src/components/subscriptions/attribution/`
(`useAttributionTableColumns.tsx`, `AttributionTreeTable.tsx`).

**Renderers are called, not mounted.** `ComposableTableView` calls the column
`cell` / `header` / `footer` functions instead of mounting them with `flexRender`,
so a new column identity never remounts a cell (focus survives) and a plain string
or number gets the DS typography.

- No hooks in a renderer. TanStack's own idiom `cell: MyCell` (a component with
  hooks) breaks here: the hooks run inside `ComposableTableView`'s render and React
  throws "Rendered more hooks than during the previous render" as soon as the row
  count changes. Lint does not catch a PascalCase component passed as `cell`.
  Wrap it: `cell: (context) => <MyCell {...context} />`.
- Return a string or number for plain values; return JSX only for anything else.

**Column meta is semantic only.** `meta: { variant: 'numeric' }` for every value
column, totals included (right aligned, shrunk, `min-w-24`). There is no `align`,
`shrink` or `className` escape hatch: a new look is a new variant in the kit.

**Tree cells** use `ComposableTableRowTreeCell`: indent from `row.depth`, toggle from
`getCanExpand` / `getIsExpanded`, spacer only when another row can expand.

**Lazy trees keep their expansion in their own cache.** Derive `state.expanded`
from the cache and route each toggle through `toggle.onToggle`; do not diff the
updater in `onExpandedChange`. An in-memory tree omits `onToggle` and lets TanStack
hold the state. Reference: the `TreeExample` of `src/pages/__devOnly/tabs/ComposableTableTest.tsx`.
