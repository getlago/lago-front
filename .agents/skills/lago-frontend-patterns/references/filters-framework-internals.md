## Filters framework internals

Non-obvious facts about `src/components/Filters/` worth knowing before
converting a single-select filter to multi-select or adding a new filter key.

- `MultipleComboBox` has no `searchQuery` prop (its props type explicitly
  `Omit`s it - `src/components/form/MultipleComboBox/types.ts`). Only single-select
  `ComboBox` supports server-side search. Multi-select filters bulk-load options
  client-side and rely on MUI `createFilterOptions` for text filtering. Precedent:
  `FiltersItemMultipleCustomers` fetches its full customer list up-front.
- A `FILTER_VALUE_MAP[filterKey]` entry that returns a non-array object gets
  spread directly into the query vars by `formatFiltersForQuery`
  (`src/components/Filters/graphql/utils.ts`), bypassing the `keyMap`. This is how
  date filters emit `{ fromDate, toDate }` from one URL key, and how a filter can
  emit multiple query args from a single filter key. When you use this pattern,
  drop that filter's now-dead `keyMap` entry and leave a comment, since the mapping
  is no longer visible in the `keyMap` itself.

To pin a synthetic option (e.g. "Not defined") on top of a `MultipleComboBox`,
set `sortValues={false}` and pre-sort the real options yourself, then prepend the
synthetic one (sentinel value kept free of `,` and the filter's inline separator
so it can't collide with a real value). Active-filter chip labels come from
`formatActiveFilterValueDisplay` - a sentinel needs its own branch there to
render a translated label instead of falling through to the raw value.
