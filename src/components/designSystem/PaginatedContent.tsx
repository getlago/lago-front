import { ReactNode } from 'react'

import { Pagination } from '~/components/designSystem/Pagination'
import { CollectionMetadata } from '~/generated/graphql'
import { tw } from '~/styles/utils'

interface PaginatedContentProps {
  /** Pagination metadata returned by the list query. The query must select `currentPage`,
   *  `totalPages` and `totalCount` — the footer always shows "X-Y of N results". */
  metadata?: Pick<CollectionMetadata, 'currentPage' | 'totalPages' | 'totalCount'> | null
  /** Called with the target page when the user navigates */
  onPageChange: (page: number) => void
  /** Rows displayed per page — drives the range label and selected option */
  pageSize?: number
  /** When provided, the footer exposes a rows-per-page menu */
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  /** Disables the controls while a page is being fetched */
  loading?: boolean
  /** Pin the pager to the bottom of the scroll area (default, for full-page lists). Pass
   *  `false` for lists inside a scrolling section/tab (customer detail, portal) so it
   *  doesn't float mid-content. */
  sticky?: boolean
  children: ReactNode
}

/**
 * Wraps content that needs numbered pagination — the pagination counterpart of
 * `InfiniteScroll`. Renders the children, then a `Pagination` control at the bottom of the
 * list, so every paginated list gets the same predictable placement without repeating
 * layout code at each call site.
 *
 * @example
 * <PaginatedContent
 *   metadata={data?.customers?.metadata}
 *   loading={loading}
 *   pageSize={pageSize}
 *   onPageChange={(page) => fetchMore({ variables: { page } })}
 *   onPageSizeChange={setPageSize}
 * >
 *   <Table ... />
 * </PaginatedContent>
 */
export const PaginatedContent = ({
  metadata,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  loading,
  sticky = true,
  children,
}: PaginatedContentProps) => {
  const pager = (
    <Pagination
      className={tw(
        'border-t border-grey-300 bg-white',
        // sticky: mt-auto pushes the pager to the bottom of the flex-col content area when the
        //   list is short (no pager stranded mid-page); it stays visible once the page scrolls.
        // non-sticky: -mt-px overlaps the last row's bottom border with the pager's top border
        //   so they read as a single 1px divider instead of a doubled 2px line.
        sticky ? 'sticky bottom-0 z-10 mt-auto' : '-mt-px',
      )}
      currentPage={metadata?.currentPage ?? 1}
      totalPages={metadata?.totalPages ?? 0}
      totalCount={metadata?.totalCount ?? 0}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={pageSizeOptions}
      loading={loading}
    />
  )

  // sticky: the pager must be a direct flex child of the (flex-col) content area so `mt-auto`
  //   can push it to the viewport bottom → render children + pager as siblings (fragment).
  // non-sticky: wrap the list + pager together so the pager sits flush under the list and
  //   doesn't inherit an ancestor's flex `gap` (e.g. settings cards) as a spurious gap.
  if (!sticky) {
    return (
      <div>
        {children}
        {pager}
      </div>
    )
  }

  return (
    <>
      {children}
      {pager}
    </>
  )
}
