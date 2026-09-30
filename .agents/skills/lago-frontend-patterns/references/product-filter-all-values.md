## Product filter "all values" encoding

Catalog **product filters** and usage-**charge** filters both let you select a
parent filter key on its own to mean "all values" (which disables the individual
value sub-options - bidirectional mutual-exclusion via `disabled` on combobox
options plus MUI `getOptionDisabled`). They encode "all values" differently, and
copying one pattern into the other is wrong:

- **Usage charge** (`src/components/plans/chargeAccordion/ChargeFilter.tsx`,
  `src/components/plans/utils.ts`'s `transformFilterObjectToString`,
  `hooks/plans/utils.ts`): uses the sentinel string `ALL_FILTER_VALUES`
  (`'__ALL_FILTER_VALUES__'`, `src/core/constants/form.ts`) - `transformFilterObjectToString`
  is what actually writes it (`value || ALL_FILTER_VALUES`), because
  `ChargeFilterInput.values` is the loose `{ [key]: string[] }` scalar - every
  array element must be a string, so absence can't be expressed any other way.
- **Product filter** (`src/pages/catalog/drawers/productFilter/`): uses a
  genuinely nullable value - a parent-key selection is an entry with `value`
  undefined/null. `ProductFilterValue.value` and `ProductFilterValueInput.value`
  are nullable `String` after codegen. Do not copy the charge sentinel here.

Implementation anchors (product-filter side): `ProductFilterValuesEditor.tsx`
exports the pure `buildProductFilterComboBoxData(billableMetricFilters, values)`
(parent option + children + disable logic) and `decodeFilterOptionValue`; the
parent option encodes as `{ id }` with no value. `useProductFilterDrawer.tsx`'s
seed maps a backend null to undefined. `ProductFilterDetailsOverview.tsx`'s
read-only chip shows the bare key when the value is null. The combobox is
virtualized (options don't render in jsdom) - test the pure builder function,
not the rendered DOM options.
