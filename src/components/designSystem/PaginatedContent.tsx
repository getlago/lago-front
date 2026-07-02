import { ReactNode } from 'react'

import { Pagination } from '~/components/designSystem/Pagination'
import { CollectionMetadata } from '~/generated/graphql'
import { tw } from '~/styles/utils'

interface PaginatedContentProps {
  /** Pagination metadata returned by the list query. `totalCount` is optional — when the
   *  query selects it the footer shows "X-Y of N results", otherwise just the range "X-Y". */
  metadata?:
    | (Pick<CollectionMetadata, 'currentPage' | 'totalPages'> &
        Partial<Pick<CollectionMetadata, 'totalCount'>>)
    | null
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
  return (
    <>
      {children}

      {/* A grow spacer pushes the pager to the bottom of the flex-col content area when the
          list is short (no pager stranded mid-page), leaving margin-top free for the -1px
          overlap below. Only meaningful in the sticky/full-page flex layout. */}
      {sticky && <div className="flex-1" aria-hidden />}

      <Pagination
        className={tw(
          // -mt-px overlaps the last row's bottom border with the pager's top border so they
          // read as a single 1px divider instead of a doubled 2px line when flush.
          '-mt-px border-t border-grey-300 bg-white',
          sticky && 'sticky bottom-0 z-10',
        )}
        currentPage={metadata?.currentPage ?? 1}
        totalPages={metadata?.totalPages ?? 0}
        totalCount={metadata?.totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        loading={loading}
      />
    </>
  )
}
