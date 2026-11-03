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
- Return the bare string or number for a plain value. JSX is rendered as is, so a
  formatted value wrapped in JSX (a fragment included) loses the table typography.
- `header` and `footer` take a string or a function, never a JSX value (TS2322). A
  header with an action is a function returning `ComposableTableGroupHeader`.

**Column meta is semantic only.** `meta: { variant: 'numeric' }` for every value
column, totals included (right aligned, shrunk, `min-w-24`). There is no `align`,
`shrink` or `className` escape hatch: a new look is a new variant in the kit.

**Tree cells** use `ComposableTableRowTreeCell`: indent from `row.depth`, toggle from
`getCanExpand` / `getIsExpanded`, spacer only when another row can expand. The toggle
renders only when `toggle` is passed (its `label` is the `aria-label`): without it an
expandable row gets the spacer.

**Lazy trees keep their expansion in their own cache.** Derive `state.expanded`
from the cache and route each toggle through `toggle.onToggle`; do not diff the
updater in `onExpandedChange`. An in-memory tree omits `onToggle` and lets TanStack
hold the state. Set `getRowCanExpand` from the row data: an unloaded node has no sub
rows yet, so TanStack's default reports it as not expandable and no toggle renders.
Reference: the `TreeExample` of `src/pages/__devOnly/tabs/ComposableTableTest.tsx`.
