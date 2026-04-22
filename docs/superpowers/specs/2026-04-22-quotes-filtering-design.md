# Quotes List Filtering

## Overview

Add filtering capabilities to the quotes list page, following the existing `Filters.Provider` system used by invoices, credit notes, and customers. Six filters will be available in a dropdown filter panel (no quick filters). The layout mirrors the invoices page: search input + filter button above the table.

## Filters

| Filter | Component | Enum Value | Type | Data Source |
|--------|-----------|------------|------|-------------|
| Status | `FiltersItemQuoteStatus` | `quoteStatus` | Multi-select | Quote `StatusEnum` (static) |
| Customer | `FiltersItemMultipleCustomers` | `multipleCustomers` | Multi-select with search | Customers lazy query |
| Quote number | `FiltersItemQuoteNumber` | `quoteNumber` | freeSolo multi combobox | User-typed values (chips, no predefined options) |
| Created at | `FiltersItemDate` (existing) | `date` | Date range picker | Two date pickers (from/to) |
| Order type | `FiltersItemQuoteOrderType` | `quoteOrderType` | Multi-select | Order type enum (static) |
| Owner | `FiltersItemMultipleUsers` | `userIds` (existing enum) | Multi-select with search | Users endpoint |

## Approach

Fully leverage the existing `Filters.Provider` / `Filters.Component` system. Register new `AvailableFiltersEnum` entries for quote-specific filters, create their filter panel components in `filtersElements/`, and wire everything through `formatFiltersForQuotesQuery`. Two generic components (`FiltersItemMultipleCustomers`, `FiltersItemMultipleUsers`) are named for reuse across other pages.

## New Filter Components

### FiltersItemQuoteStatus

- Uses `MultipleComboBox` with quote `StatusEnum` values (Draft, Finalized, Voided, etc.)
- Same pattern as existing `FiltersItemStatus` but with quote-specific status values
- Value format: comma-separated string (`"draft,finalized"`)

### FiltersItemMultipleCustomers

- Uses `MultipleComboBox` with `searchQuery` for dynamic customer fetching
- Similar to existing `FiltersItemCustomer` but multi-select instead of single-select
- Data source: same `getCustomersForFilterItemCustomer` lazy query
- Value format: comma-separated `externalId|-_-|displayName` pairs
- Generic name for reuse across other pages

### FiltersItemQuoteNumber

- Uses `MultipleComboBox` with `freeSolo` and `data={[]}`
- Same pattern as email resend to/cc/bcc combobox — user types quote numbers, they appear as chips
- No predefined options, no data fetching
- Value format: comma-separated quote numbers (`"QUO-001,QUO-002"`)

### FiltersItemQuoteOrderType

- Uses `MultipleComboBox` with order type enum values
- Same pattern as `FiltersItemInvoiceType` — static enum options
- Value format: comma-separated string

### FiltersItemMultipleUsers

- Uses `MultipleComboBox` with `searchQuery` for fetching users from users endpoint
- Generic name for reuse across other pages
- Value format: comma-separated user IDs

## Filter Registry Changes

### `AvailableFiltersEnum` (types.ts)

New entries:
- `quoteStatus = 'quoteStatus'`
- `multipleCustomers = 'multipleCustomers'`
- `quoteNumber = 'quoteNumber'`
- `quoteOrderType = 'quoteOrderType'`

Reused entry:
- `userIds` (already exists)
- `date` (already exists)

### `QuoteAvailableFilters` array (types.ts)

```typescript
export const QuoteAvailableFilters = [
  AvailableFiltersEnum.quoteStatus,
  AvailableFiltersEnum.multipleCustomers,
  AvailableFiltersEnum.quoteNumber,
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.quoteOrderType,
  AvailableFiltersEnum.userIds,
]
```

### `FILTER_VALUE_MAP` (utils.ts)

New entries for each new enum value with parsing logic:
- `quoteStatus`: split by comma into array
- `multipleCustomers`: split by comma, extract externalIds (before `|-_-|` separator)
- `quoteNumber`: split by comma into array
- `quoteOrderType`: split by comma into array

Note on `date` filter: the existing `FILTER_VALUE_MAP[date]` returns `{ fromDate, toDate }`, but the quotes GQL query expects `{ createdAtFrom, createdAtTo }`. A custom entry will be added to `FILTER_VALUE_MAP` or the `keyMap` approach adjusted to handle this rename. The simplest approach is to add a dedicated `FILTER_VALUE_MAP` entry for `date` that the `formatFiltersForQuotesQuery` function overrides via a custom parse, or to handle the rename in the format function's post-processing.

Reused entries:
- `userIds`: already maps to comma-split array

### Filter prefix (constants/filters.ts)

```typescript
export const QUOTE_LIST_FILTER_PREFIX = 'qu'
```

### `FiltersPanelItemTypeSwitch` mapping

Add entries for each new enum value pointing to the corresponding component.

## GraphQL Query Changes

### useQuotes hook

New variables added to the `getQuotes` query:

```graphql
query getQuotes(
  $page: Int
  $limit: Int
  $status: [StatusEnum!]
  $customer: [ID!]
  $number: [String!]
  $latestVersionOnly: Boolean
  $createdAtFrom: ISO8601DateTime
  $createdAtTo: ISO8601DateTime
  $orderType: [OrderTypeEnum!]
  $ownerIds: [ID!]
) {
  quotes(
    page: $page
    limit: $limit
    status: $status
    customer: $customer
    number: $number
    latestVersionOnly: $latestVersionOnly
    createdAtFrom: $createdAtFrom
    createdAtTo: $createdAtTo
    orderType: $orderType
    ownerIds: $ownerIds
  ) { ... }
}
```

Hook changes:
- Switch from `useGetQuotesQuery` to `useGetQuotesLazyQuery` to match invoices pattern
- Accept filter variables from `formatFiltersForQuotesQuery` spread into query variables

### formatFiltersForQuotesQuery (utils.ts)

```typescript
export const formatFiltersForQuotesQuery = (searchParams: URLSearchParams) =>
  formatFiltersForQuery({
    searchParams,
    availableFilters: QuoteAvailableFilters,
    filtersNamePrefix: QUOTE_LIST_FILTER_PREFIX,
    keyMap: {
      date: 'createdAt',           // date → createdAtFrom/createdAtTo
      multipleCustomers: 'customer', // multipleCustomers → customer (array of IDs)
      quoteStatus: 'status',        // quoteStatus → status
      quoteNumber: 'number',        // quoteNumber → number
      quoteOrderType: 'orderType',  // quoteOrderType → orderType
      userIds: 'ownerIds',          // userIds → ownerIds
    },
  })
```

## Page Integration

### QuotesList.tsx layout

```
+------------------------------------------+
| [Search input]        [Filters button]   |
+------------------------------------------+
| Quotes table with infinite scroll        |
| ...                                      |
+------------------------------------------+
```

### Filters.Provider config

- `filtersNamePrefix={QUOTE_LIST_FILTER_PREFIX}` (`'qu'`)
- `availableFilters={QuoteAvailableFilters}`
- No `quickFiltersType` (no quick filter chips)

### Filter state flow

1. User selects filters in the dropdown panel
2. URL params update (e.g., `?qu_quoteStatus=draft,finalized&qu_date=2026-01-01,2026-04-01`)
3. `formatFiltersForQuotesQuery(searchParams)` parses URL params into GQL variables
4. Variables spread into the lazy query
5. Table re-renders with filtered results

### Hardcoded defaults

- `latestVersionOnly: true` stays hardcoded (not exposed as a filter)

## Files to Create

- `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteStatus.tsx`
- `src/components/designSystem/Filters/filtersElements/FiltersItemMultipleCustomers.tsx`
- `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteNumber.tsx`
- `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteOrderType.tsx`
- `src/components/designSystem/Filters/filtersElements/FiltersItemMultipleUsers.tsx`

## Files to Modify

- `src/components/designSystem/Filters/types.ts` — new enum values + `QuoteAvailableFilters` array
- `src/components/designSystem/Filters/utils.ts` — `FILTER_VALUE_MAP` entries + `formatFiltersForQuotesQuery`
- `src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx` — new component mappings
- `src/core/constants/filters.ts` — `QUOTE_LIST_FILTER_PREFIX`
- `src/pages/quotes/hooks/useQuotes.ts` — new GQL variables + switch to lazy query
- `src/pages/quotes/QuotesList.tsx` — integrate `Filters.Provider`, `SearchInput`, `Filters.Component`
