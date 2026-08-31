---
name: lago-pagination
description: 'Numbered pagination rules for every list and table in lago-front: PaginatedContent, Pagination, usePageSearchParam, the mandatory createSinglePageFieldPolicy cache registration, and the sticky / insetPager / pageSize / page-reset choices. TRIGGER — read BEFORE writing the code whenever the task adds or changes a list, table or paginated query; whenever the diff mentions PaginatedContent, Pagination, usePageSearchParam, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, loadingRowCount, queryFieldPolicies, createSinglePageFieldPolicy, createPaginatedFieldPolicy or src/core/apolloClient/cache.ts; whenever a GraphQL field returns { collection, metadata } or takes $page / $limit; and whenever the report is that page 2 is empty, the pager is missing, the X-Y of N label disagrees with the rows, or a previously-viewed page flashes when re-entering a tab.'
---

# Pagination (numbered lists & tables)

All lists use numbered pagination via `PaginatedContent` + `Pagination`
(`src/components/designSystem/Pagination/`, prop docs inline). Infinite scroll is gone.
Reference sites: `SubscriptionsPage.tsx` (full-page, sticky),
`CustomerPaymentsTab.tsx` (nested, non-sticky). The **developer-tool** lists
(`src/components/developers/*`: API logs, activity logs, events, webhook logs, API keys) keep
numbered pagination but stay `fetchMore`-based (no URL page) — `usePageSearchParam` is
intentionally not wired there (`onPageChange={(page) => fetchMore({ variables: { page } })}`).

Adding a paginated list:

1. Query the `{ collection, metadata }` root field with `$page`/`$limit`, select
   `metadata { currentPage totalPages totalCount }`, then `pnpm codegen`.
2. Register the field in `queryFieldPolicies` (`cache.ts`) with
   `createSinglePageFieldPolicy()` (replace merge). **Skipping this makes page 2
   silently stop** — `cache.test.ts` guard fails CI. Never use
   `createPaginatedFieldPolicy()` (legacy append/infinite-scroll).
3. Query hook: `notifyOnNetworkStatusChange: true`, `limit: DEFAULT_PAGE_SIZE`. The page lives in
   the URL — `const { page, goToPage } = usePageSearchParam()` — so pass `page` in the variables.
4. Wrap the table:
   ```tsx
   <PaginatedContent
     metadata={data?.<field>.metadata}   // MUST pass, else totalCount=0 → pager hidden
     loading={loading}
     onPageChange={goToPage}              // URL-driven: deep-linkable + survives refresh
     sticky={/* full-page: true (default) · list inside a scrolling tab: false */}
     insetPager={/* true ONLY for full-page lists · see below */}
   >
     <Table data={rows} isLoading={loading} ... />
   </PaginatedContent>
   ```
   - `Table` auto-blanks data rows while `isLoading` → skeletons render in place (never
     stacked below existing rows). Pass `data={rows}` directly — no `loading ? [] : rows`
     ternary needed.
   - `loadingRowCount` defaults to `DEFAULT_PAGE_SIZE` on `Table` — only pass when the
     list uses a custom page size (e.g. `loadingRowCount={pageSize}` for rows-per-page menu).
   - `pageSize` on `PaginatedContent` defaults to `DEFAULT_PAGE_SIZE` and **must match the
     query `limit`** — mismatch makes the "X-Y of N" label lie. Pass explicitly ONLY when
     using a custom limit (e.g. `pageSize={pageSize}` for rows-per-page menu, or
     `pageSize={PORTAL_INVOICES_PAGE_SIZE}` for fixed non-default sizes). Omit for the
     default 20.
   - **URL page** via `usePageSearchParam(prefix?)` (`~/components/designSystem/Pagination`):
     bare `page` for a single list on the route; pass a `prefix` (`usePageSearchParam('draft')`
     → `draft_page`) **only** when 2+ paginated lists share one view (customer invoices,
     invoice-sections). Out-of-range pages auto-clamp to the last page (in `PaginatedContent`).
   - **Reset to page 1** on search (`goToPage(1)` before the debounced search) and on page-size
     change. Filter changes reset it centrally in `useFilters` — don't handle those.
   - **Customer-detail tabs** (route-based → the tab subtree remounts on switch and resets to
     page 1) additionally set `fetchPolicy: 'network-only'` on the list query. Leaving a tab drops
     `?page`, so on re-entry the single-page cache would briefly flash the previously-viewed page
     before the page-1 refetch; `network-only` skips that stale read → clean skeleton → page 1.
     Applied to the 7 customer tabs (subscriptions, payments, creditNotes, appliedCoupons,
     activityLogs, wallets, customerInvoices). Full-page lists don't need it (they don't remount).
   - Pager inside a child component (e.g. `InvoicesList`, `CreditNotesTable`, `CustomerInvoicesList`)
     → thread an optional `onPageChange` prop down and pass `goToPage` (fallback: `fetchMore`).
   - `sticky` → table `containerClassName="h-auto shrink-0 -mb-px border-t border-grey-300"`
     (`-mb-px` overlaps the last-row border with the pager → single divider, no doubled line);
     `sticky={false}` → `containerClassName="border-t border-grey-300"`.
   - `insetPager` → pass **only** for full-page lists rendered directly in the unpadded main
     scroll area (they fake the page gutter via `containerSize` 16/48). Padded containers
     (settings, customer detail) already have the gutter — passing it there doubles it.
   - Rows-per-page menu only if you pass `onPageSizeChange` + local
     `useState(DEFAULT_PAGE_SIZE)`.

Constants in `~/core/constants/pagination`: `DEFAULT_PAGE_SIZE = 20`,
`PAGE_SIZE_OPTIONS = [20, 50, 100]`.
