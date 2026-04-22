# Quotes List Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 filters (Status, Customer, Quote number, Created at, Order type, Owner) to the quotes list page using the existing Filters system.

**Architecture:** Extend the shared `Filters.Provider` / `Filters.Component` infrastructure with new enum values, filter components, and a `formatFiltersForQuotesQuery` utility. Wire into `QuotesList.tsx` following the same pattern as the invoices page.

**Tech Stack:** React, TypeScript, Apollo Client (GraphQL), MUI Autocomplete (MultipleComboBox), URL search params for filter state.

---

### Task 1: Generate translation keys

**Files:**
- Modify: `translations/base.json`

- [ ] **Step 1: Generate 4 new translation keys**

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm translations:add 4`

These keys will be used for:
1. Quote number filter label (e.g., "Quote number")
2. Quote order type filter label (e.g., "Order type")
3. Quote created at filter label (e.g., "Created at")
4. Quotes search input placeholder (e.g., "Search quotes...")

- [ ] **Step 2: Set translation values**

Open `translations/base.json` and set the 4 newly generated keys to these values:

```json
"<key1>": "Quote number",
"<key2>": "Order type",
"<key3>": "Created at",
"<key4>": "Search quotes..."
```

Replace `<key1>` through `<key4>` with the actual generated key names (format: `text_XXXX`).

- [ ] **Step 3: Commit**

```bash
git add translations/base.json
git commit -m "feat(quotes): add translation keys for quotes filtering"
```

---

### Task 2: Add filter prefix, enum values, and available filters array

**Files:**
- Modify: `src/core/constants/filters.ts`
- Modify: `src/components/designSystem/Filters/types.ts`

- [ ] **Step 1: Add filter prefix constant**

In `src/core/constants/filters.ts`, add at the end:

```typescript
export const QUOTE_LIST_FILTER_PREFIX = 'qu'
```

- [ ] **Step 2: Add new enum values to AvailableFiltersEnum**

In `src/components/designSystem/Filters/types.ts`, add these entries to the `AvailableFiltersEnum` enum (insert alphabetically):

```typescript
multipleCustomers = 'multipleCustomers',
quoteCreatedAt = 'quoteCreatedAt',
quoteNumber = 'quoteNumber',
quoteOrderType = 'quoteOrderType',
quoteStatus = 'quoteStatus',
```

- [ ] **Step 3: Add translationMap entries for new enum values**

In the `translationMap` record in the same file, add entries for each new enum value:

```typescript
[AvailableFiltersEnum.multipleCustomers]: 'text_65201c5a175a4b0238abf29a',
[AvailableFiltersEnum.quoteCreatedAt]: '<key3>',
[AvailableFiltersEnum.quoteNumber]: '<key1>',
[AvailableFiltersEnum.quoteOrderType]: '<key2>',
[AvailableFiltersEnum.quoteStatus]: 'text_63ac86d797f728a87b2f9fa7',
```

Where `<key1>`, `<key2>`, `<key3>` are the translation keys generated in Task 1 for "Quote number", "Order type", and "Created at" respectively. The `multipleCustomers` and `quoteStatus` entries reuse existing translation keys for "Customer" and "Status".

- [ ] **Step 4: Add QuoteAvailableFilters array**

Add after the existing `SecurityLogsAvailableFilters` array:

```typescript
export const QuoteAvailableFilters = [
  AvailableFiltersEnum.quoteStatus,
  AvailableFiltersEnum.multipleCustomers,
  AvailableFiltersEnum.quoteNumber,
  AvailableFiltersEnum.quoteCreatedAt,
  AvailableFiltersEnum.quoteOrderType,
  AvailableFiltersEnum.userIds,
]
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/allanmichay/Documents/www/lago/front && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: Errors about missing entries in `filterTypeMap` (Record must be exhaustive) and missing entries in `FILTER_VALUE_MAP`. These will be fixed in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add src/core/constants/filters.ts src/components/designSystem/Filters/types.ts
git commit -m "feat(quotes): add filter enum values and QuoteAvailableFilters"
```

---

### Task 3: Add FILTER_VALUE_MAP entries and formatFiltersForQuotesQuery

**Files:**
- Modify: `src/components/designSystem/Filters/utils.ts`

- [ ] **Step 1: Add new entries to FILTER_VALUE_MAP**

In `src/components/designSystem/Filters/utils.ts`, add these entries to the `FILTER_VALUE_MAP` record:

```typescript
[AvailableFiltersEnum.multipleCustomers]: (value: string) =>
  (value as string).split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
[AvailableFiltersEnum.quoteCreatedAt]: (value: string) => {
  return {
    createdAtFrom: (value as string).split(',')[0],
    createdAtTo: (value as string).split(',')[1],
  }
},
[AvailableFiltersEnum.quoteNumber]: (value: string) => (value as string).split(','),
[AvailableFiltersEnum.quoteOrderType]: (value: string) => (value as string).split(','),
[AvailableFiltersEnum.quoteStatus]: (value: string) => (value as string).split(','),
```

- [ ] **Step 2: Add quoteCreatedAt to FiltersItemDates array**

Find the `FiltersItemDates` array export and add `AvailableFiltersEnum.quoteCreatedAt`:

```typescript
export const FiltersItemDates = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.issuingDate,
  AvailableFiltersEnum.loggedDate,
  AvailableFiltersEnum.webhookDate,
  AvailableFiltersEnum.quoteCreatedAt,
]
```

- [ ] **Step 3: Add formatFiltersForQuotesQuery function**

Add after the last existing `formatFiltersFor*` function:

```typescript
export const formatFiltersForQuotesQuery = (searchParams: URLSearchParams) =>
  formatFiltersForQuery({
    searchParams,
    availableFilters: QuoteAvailableFilters,
    filtersNamePrefix: QUOTE_LIST_FILTER_PREFIX,
    keyMap: {
      multipleCustomers: 'customer',
      quoteStatus: 'status',
      quoteNumber: 'number',
      quoteOrderType: 'orderType',
      userIds: 'ownerIds',
    },
  })
```

Add the required imports at the top of the file:

```typescript
import { QUOTE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { QuoteAvailableFilters } from './types'
```

Note: `QUOTE_LIST_FILTER_PREFIX` import may need to be added to an existing import from `~/core/constants/filters`. `QuoteAvailableFilters` may need to be added to the existing import from `./types`.

- [ ] **Step 4: Commit**

```bash
git add src/components/designSystem/Filters/utils.ts
git commit -m "feat(quotes): add FILTER_VALUE_MAP entries and formatFiltersForQuotesQuery"
```

---

### Task 4: Create FiltersItemQuoteStatus component

**Files:**
- Create: `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteStatus.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteStatus.tsx`:

```typescript
import { MultipleComboBox } from '~/components/form'
import { StatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemQuoteStatusProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemQuoteStatus = ({
  value,
  setFilterValue,
}: FiltersItemQuoteStatusProps) => {
  const { translate } = useInternationalization()

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={[
        {
          label: translate('text_63ac86d797f728a87b2f9f91'),
          value: StatusEnum.Draft,
        },
        {
          label: translate('text_1775747115932eu6r3ejjoox'),
          value: StatusEnum.Approved,
        },
        {
          label: translate('text_6376641a2a9c70fff5bddcd5'),
          value: StatusEnum.Voided,
        },
      ]}
      onChange={(statuses) => {
        setFilterValue(String(statuses.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v }))}
    />
  )
}
```

Translation keys used:
- `text_66ab42d4ece7e6b7078993b1` — generic filter placeholder (reused from existing filters)
- `text_63ac86d797f728a87b2f9f91` — "Draft" (reused from invoice status filter)
- `text_1775747115932eu6r3ejjoox` — "Approved" (from quote status mapping)
- `text_6376641a2a9c70fff5bddcd5` — "Voided" (reused from invoice status filter)

- [ ] **Step 2: Commit**

```bash
git add src/components/designSystem/Filters/filtersElements/FiltersItemQuoteStatus.tsx
git commit -m "feat(quotes): create FiltersItemQuoteStatus filter component"
```

---

### Task 5: Create FiltersItemMultipleCustomers component

**Files:**
- Create: `src/components/designSystem/Filters/filtersElements/FiltersItemMultipleCustomers.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/designSystem/Filters/filtersElements/FiltersItemMultipleCustomers.tsx`:

```typescript
import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem, MultipleComboBox } from '~/components/form'
import { useGetCustomersForFilterItemMultipleCustomersLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { filterDataInlineSeparator, FiltersFormValues } from '../types'

gql`
  query getCustomersForFilterItemMultipleCustomers(
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    customers(page: $page, limit: $limit, searchTerm: $searchTerm, withDeleted: true) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        displayName
        externalId
        deletedAt
      }
    }
  }
`

type FiltersItemMultipleCustomersProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemMultipleCustomers = ({
  value,
  setFilterValue,
}: FiltersItemMultipleCustomersProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const [getCustomers, { data, loading }] =
    useGetCustomersForFilterItemMultipleCustomersLazyQuery({
      variables: { page: 1, limit: 10 },
    })

  const comboboxCustomersData = useMemo(() => {
    if (!data?.customers?.collection) return []

    return data.customers.collection.map((customer) => {
      const { externalId } = customer
      const customerName = customer?.displayName

      return {
        label: `${customerName || externalId || ''}${customer.deletedAt ? ` (${translate('text_1743158702704o1juwxmr4ab')})` : ''}`,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {customerName || externalId || ''}
            </Typography>
            {customer.deletedAt && (
              <Typography variant="caption" color="grey600" noWrap>
                {` (${translate('text_1743158702704o1juwxmr4ab')})`}
              </Typography>
            )}
          </ComboboxItem>
        ),
        value: `${externalId}${filterDataInlineSeparator}${customerName}`,
      }
    })
  }, [data?.customers?.collection, translate])

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      searchQuery={getCustomers}
      loading={loading}
      placeholder={translate('text_63befc65efcd9374da45b801')}
      data={comboboxCustomersData}
      onChange={(customers) => {
        setFilterValue(String(customers.map((v) => v.value).join(',')))
      }}
      value={(value ?? '')
        .split(',')
        .filter((v) => !!v)
        .map((v) => ({
          label:
            v.split(filterDataInlineSeparator)[1] || v.split(filterDataInlineSeparator)[0],
          value: v,
        }))}
    />
  )
}
```

- [ ] **Step 2: Run GraphQL codegen**

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm codegen`

Expected: Generates `useGetCustomersForFilterItemMultipleCustomersLazyQuery` hook.

- [ ] **Step 3: Commit**

```bash
git add src/components/designSystem/Filters/filtersElements/FiltersItemMultipleCustomers.tsx src/generated/graphql.tsx
git commit -m "feat(quotes): create FiltersItemMultipleCustomers filter component"
```

---

### Task 6: Create FiltersItemQuoteNumber component

**Files:**
- Create: `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteNumber.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteNumber.tsx`:

```typescript
import { MultipleComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemQuoteNumberProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemQuoteNumber = ({
  value,
  setFilterValue,
}: FiltersItemQuoteNumberProps) => {
  const { translate } = useInternationalization()

  return (
    <MultipleComboBox
      freeSolo
      disableClearable
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={[]}
      onChange={(numbers) => {
        setFilterValue(String(numbers.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v }))}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/designSystem/Filters/filtersElements/FiltersItemQuoteNumber.tsx
git commit -m "feat(quotes): create FiltersItemQuoteNumber freeSolo filter component"
```

---

### Task 7: Create FiltersItemQuoteOrderType component

**Files:**
- Create: `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteOrderType.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/designSystem/Filters/filtersElements/FiltersItemQuoteOrderType.tsx`:

```typescript
import { MultipleComboBox } from '~/components/form'
import { OrderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemQuoteOrderTypeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemQuoteOrderType = ({
  value,
  setFilterValue,
}: FiltersItemQuoteOrderTypeProps) => {
  const { translate } = useInternationalization()

  return (
    <MultipleComboBox
      disableClearable
      disableCloseOnSelect
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={[
        {
          label: translate('text_1775747115932ib2to4erkoo'),
          value: OrderTypeEnum.OneOff,
        },
        {
          label: translate('text_17757471159329jnt7pyy6vr'),
          value: OrderTypeEnum.SubscriptionAmendment,
        },
        {
          label: translate('text_1775747115932u8ttc3l11w1'),
          value: OrderTypeEnum.SubscriptionCreation,
        },
      ]}
      onChange={(orderTypes) => {
        setFilterValue(String(orderTypes.map((v) => v.value).join(',')))
      }}
      value={value
        ?.split(',')
        .filter((v) => !!v)
        .map((v) => ({ value: v }))}
    />
  )
}
```

Translation keys reused from `src/pages/quotes/common/getQuoteOrderTypeTranslationKey.ts`:
- `text_1775747115932ib2to4erkoo` — "One-off"
- `text_17757471159329jnt7pyy6vr` — "Subscription amendment"
- `text_1775747115932u8ttc3l11w1` — "Subscription creation"

- [ ] **Step 2: Commit**

```bash
git add src/components/designSystem/Filters/filtersElements/FiltersItemQuoteOrderType.tsx
git commit -m "feat(quotes): create FiltersItemQuoteOrderType filter component"
```

---

### Task 8: Rename FiltersItemUserIds to FiltersItemMultipleUsers

**Files:**
- Rename: `src/components/designSystem/Filters/filtersElements/FiltersItemUserIds.tsx` → `FiltersItemMultipleUsers.tsx`
- Modify: `src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx`

- [ ] **Step 1: Rename the file**

```bash
cd /Users/allanmichay/Documents/www/lago/front
git mv src/components/designSystem/Filters/filtersElements/FiltersItemUserIds.tsx src/components/designSystem/Filters/filtersElements/FiltersItemMultipleUsers.tsx
```

- [ ] **Step 2: Rename the export inside the file**

In `src/components/designSystem/Filters/filtersElements/FiltersItemMultipleUsers.tsx`:

Change the type name:
```typescript
// Old
type FiltersItemUserIdsProps = {
// New
type FiltersItemMultipleUsersProps = {
```

Change the component export:
```typescript
// Old
export const FiltersItemUserIds = ({ value, setFilterValue }: FiltersItemUserIdsProps) => {
// New
export const FiltersItemMultipleUsers = ({ value, setFilterValue }: FiltersItemMultipleUsersProps) => {
```

- [ ] **Step 3: Update import in FiltersPanelItemTypeSwitch.tsx**

In `src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx`:

Change the import:
```typescript
// Old
import { FiltersItemUserIds } from '~/components/designSystem/Filters/filtersElements/FiltersItemUserIds'
// New
import { FiltersItemMultipleUsers } from '~/components/designSystem/Filters/filtersElements/FiltersItemMultipleUsers'
```

Change the mapping entry:
```typescript
// Old
[AvailableFiltersEnum.userIds]: <FiltersItemUserIds {...props} />,
// New
[AvailableFiltersEnum.userIds]: <FiltersItemMultipleUsers {...props} />,
```

- [ ] **Step 4: Commit**

```bash
git add src/components/designSystem/Filters/filtersElements/FiltersItemMultipleUsers.tsx src/components/designSystem/Filters/filtersElements/FiltersItemUserIds.tsx src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx
git commit -m "refactor: rename FiltersItemUserIds to FiltersItemMultipleUsers"
```

---

### Task 9: Wire new components into FiltersPanelItemTypeSwitch

**Files:**
- Modify: `src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx`

- [ ] **Step 1: Add imports for new filter components**

Add these imports to `src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx`:

```typescript
import { FiltersItemMultipleCustomers } from '~/components/designSystem/Filters/filtersElements/FiltersItemMultipleCustomers'
import { FiltersItemQuoteNumber } from '~/components/designSystem/Filters/filtersElements/FiltersItemQuoteNumber'
import { FiltersItemQuoteOrderType } from '~/components/designSystem/Filters/filtersElements/FiltersItemQuoteOrderType'
import { FiltersItemQuoteStatus } from '~/components/designSystem/Filters/filtersElements/FiltersItemQuoteStatus'
```

- [ ] **Step 2: Add entries to filterTypeMap**

Add these entries to the `filterTypeMap` record:

```typescript
[AvailableFiltersEnum.multipleCustomers]: <FiltersItemMultipleCustomers {...props} />,
[AvailableFiltersEnum.quoteCreatedAt]: <FiltersItemDate {...props} />,
[AvailableFiltersEnum.quoteNumber]: <FiltersItemQuoteNumber {...props} />,
[AvailableFiltersEnum.quoteOrderType]: <FiltersItemQuoteOrderType {...props} />,
[AvailableFiltersEnum.quoteStatus]: <FiltersItemQuoteStatus {...props} />,
```

Note: `quoteCreatedAt` reuses the existing `FiltersItemDate` component (already imported). No new import needed for it.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/allanmichay/Documents/www/lago/front && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors related to filter types (the exhaustive Record check should now pass).

- [ ] **Step 4: Commit**

```bash
git add src/components/designSystem/Filters/FiltersPanelItemTypeSwitch.tsx
git commit -m "feat(quotes): wire filter components into FiltersPanelItemTypeSwitch"
```

---

### Task 10: Update useQuotes GraphQL query and run codegen

**Files:**
- Modify: `src/pages/quotes/hooks/useQuotes.ts`

- [ ] **Step 1: Add new variables to the GraphQL query**

In `src/pages/quotes/hooks/useQuotes.ts`, update the `getQuotes` query definition:

```graphql
query getQuotes(
  $page: Int
  $limit: Int
  $status: [StatusEnum!]
  $customer: [ID!]
  $number: [String!]
  $latestVersionOnly: Boolean
  $searchTerm: String
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
    searchTerm: $searchTerm
    createdAtFrom: $createdAtFrom
    createdAtTo: $createdAtTo
    orderType: $orderType
    ownerIds: $ownerIds
  ) {
    metadata {
      currentPage
      totalPages
      totalCount
    }
    collection {
      ...QuoteListItem
    }
  }
}
```

- [ ] **Step 2: Run GraphQL codegen**

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm codegen`

Expected: Updates `GetQuotesQueryVariables` type to include new fields including `searchTerm`.

- [ ] **Step 3: Verify the hook still works**

The `useQuotes` hook already uses `Omit<GetQuotesQueryVariables, 'limit' | 'page'>` for its variables parameter, so the new variables (including `searchTerm`) will be accepted automatically. No changes needed to the hook's TypeScript types.

- [ ] **Step 4: Commit**

```bash
git add src/pages/quotes/hooks/useQuotes.ts src/generated/graphql.tsx
git commit -m "feat(quotes): add filter variables to getQuotes GraphQL query"
```

---

### Task 11: Integrate filters in QuotesList

**Files:**
- Modify: `src/pages/quotes/QuotesList.tsx`

- [ ] **Step 1: Add imports**

Add these imports to `src/pages/quotes/QuotesList.tsx`:

```typescript
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Filters } from '~/components/designSystem/Filters/Filters'
import { AvailableFiltersEnum } from '~/components/designSystem/Filters/types'
import { formatFiltersForQuotesQuery } from '~/components/designSystem/Filters/utils'
import { SearchInput } from '~/components/SearchInput'
import { QUOTE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
```

Note: `useMemo` might need to be added to an existing `react` import. `useSearchParams` might need to be added to the existing `react-router-dom` import. Check the exact import path of `useDebouncedSearch` — search the codebase with `grep -r "useDebouncedSearch" --include="*.ts" --include="*.tsx"` to find the correct import path and usage pattern.

- [ ] **Step 2: Add filter state and search in the component**

Inside the `QuotesList` component, before the `columns` definition, add:

```typescript
const [searchParams] = useSearchParams()
const { debouncedSearch, isLoading: searchLoading } = useDebouncedSearch()

const filtersForQuotesQuery = useMemo(
  () => formatFiltersForQuotesQuery(searchParams),
  [searchParams],
)
```

Note: The `useDebouncedSearch` hook API may differ from what's shown here. Check how it's used in `src/pages/InvoicesPage.tsx` or other list pages and follow the same pattern. The hook typically returns a debounced search function or value that plugs into `SearchInput.onChange`.

- [ ] **Step 3: Update the useQuotes call to include filters**

Replace the existing `useQuotes` call:

```typescript
// Old
const { quotes, loading, error, fetchMore, metadata } = useQuotes({ latestVersionOnly: true })

// New
const { quotes, loading, error, fetchMore, metadata } = useQuotes({
  latestVersionOnly: true,
  ...filtersForQuotesQuery,
})
```

The `searchTerm` variable was added to the GraphQL query in Task 10. Wire it into the query variables based on how `useDebouncedSearch` exposes the search term. Check the InvoicesPage for the exact pattern — the search term may come from the debounced hook's return value or from a callback that updates a state variable passed to the query.

- [ ] **Step 4: Wrap the table with Filters.Provider and add filter UI**

Update the return JSX. Replace the current return block:

```typescript
return (
  <DetailsPage.Container>
    <Filters.Provider
      filtersNamePrefix={QUOTE_LIST_FILTER_PREFIX}
      availableFilters={[
        AvailableFiltersEnum.quoteStatus,
        AvailableFiltersEnum.multipleCustomers,
        AvailableFiltersEnum.quoteNumber,
        AvailableFiltersEnum.quoteCreatedAt,
        AvailableFiltersEnum.quoteOrderType,
        AvailableFiltersEnum.userIds,
      ]}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          onChange={debouncedSearch}
          placeholder={translate('<key4>')}
        />
        {/* Note: verify the SearchInput onChange prop matches the useDebouncedSearch return.
            Check InvoicesPage for the exact wiring pattern. */}
        <Filters.Component />
      </div>
    </Filters.Provider>

    <InfiniteScroll onBottom={createQuotesPaginationHandler(metadata, loading, fetchMore)}>
      <Table
        name="quotes-list"
        data={quotes}
        isLoading={loading}
        hasError={!!error}
        onRowActionLink={({ id }) =>
          generatePath(QUOTE_DETAILS_ROUTE, {
            quoteId: id,
            tab: QuoteDetailsTabsOptionsEnum.overview,
          })
        }
        containerSize={0}
        columns={columns}
        placeholder={{
          emptyState: {
            title: translate('text_17757391860814p20fr87x9g'),
            subtitle: translate('text_177573918608169w9wthupaz'),
          },
        }}
      />
    </InfiniteScroll>
  </DetailsPage.Container>
)
```

Replace `<key4>` with the actual translation key generated in Task 1 for "Search quotes...".

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/allanmichay/Documents/www/lago/front && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/quotes/QuotesList.tsx
git commit -m "feat(quotes): integrate Filters.Provider and SearchInput in QuotesList"
```

---

### Task 12: Run code style checks and fix

**Files:**
- All modified/created files

- [ ] **Step 1: Run lint and prettier**

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm code:style`

- [ ] **Step 2: Fix any issues**

If there are lint/prettier errors, fix them:

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm lint:fix`

- [ ] **Step 3: Verify everything passes**

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm code:style`

Expected: No errors.

- [ ] **Step 4: Commit any style fixes**

```bash
git add -A
git commit -m "style: fix lint/prettier issues in quotes filtering"
```

---

### Task 13: Manual verification

- [ ] **Step 1: Start the dev server**

Run: `cd /Users/allanmichay/Documents/www/lago/front && pnpm dev`

- [ ] **Step 2: Navigate to quotes page and verify**

Open the quotes page in the browser and verify:
1. The search input and "Filters" button appear above the table
2. Clicking the filter button opens the filter panel
3. All 6 filters are listed: Status, Customer, Quote number, Created at, Order type, Owner
4. Each filter renders its correct component type (multi-select, date range, freeSolo)
5. Selecting filters updates the URL params with `qu_` prefix
6. The table updates when filters are applied
7. Removing filters restores the full list
