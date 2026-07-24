import { ReactNode, useEffect, useRef } from 'react'

import { Pagination } from '~/components/designSystem/Pagination/Pagination'
import { getScrollableAncestor } from '~/components/designSystem/Pagination/utils'
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
  /** Indent the pager's controls by the standard page gutter (`px-4 md:px-12`). Pass `true`
   *  ONLY for full-page lists rendered directly in the unpadded main scroll area, where the
   *  table fakes the gutter via `containerSize`. Leave `false` (default) inside an already-padded
   *  container (settings, customer detail) — otherwise the gutter is applied twice. Only takes
   *  effect together with `sticky` (a non-sticky pager already sits in a padded wrapper). */
  insetPager?: boolean
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
  insetPager = false,
  children,
}: PaginatedContentProps) => {
  const pagerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Out-of-range page (e.g. a stale/typed `?page=200000`): the collection comes back empty and
  // reads like a "no data" empty state even though data exists. Clamp to the last real page —
  // standard pager behaviour — but only when there IS data (a truly empty list keeps its empty
  // state). `currentPage` echoes the requested page, so this converges after one correction.
  const currentPage = metadata?.currentPage
  const totalPages = metadata?.totalPages
  const totalCount = metadata?.totalCount

  useEffect(() => {
    if (
      !loading &&
      totalCount &&
      totalCount > 0 &&
      totalPages &&
      totalPages >= 1 &&
      currentPage &&
      currentPage > totalPages
    ) {
      onPageChange(totalPages)
    }
  }, [loading, currentPage, totalPages, totalCount, onPageChange])

  // After a page change, reposition the list so the new page isn't opened scrolled to its end
  // (e.g. paging from the bottom of a 100-row page):
  //  - sticky (single full-page list): reset the page scroll container to the top.
  //  - non-sticky (nested lists, often several on one page): re-align only THIS list's top, and
  //    only when it has scrolled above the fold — so short, fully-visible lists and the other
  //    pagers on the same page don't cause a jump to the top.
  const handlePageChange = (page: number) => {
    onPageChange(page)

    if (sticky) {
      getScrollableAncestor(pagerRef.current)?.scrollTo({ top: 0 })
      return
    }

    const list = contentRef.current
    const scroller = getScrollableAncestor(list)

    if (!list || !scroller) {
      return
    }

    const listTop = list.getBoundingClientRect().top
    const scrollerTop = scroller.getBoundingClientRect().top

    // Only when the list's top is above the visible area do we pull it back up to the top;
    // if it's already visible we leave the scroll position untouched.
    if (listTop < scrollerTop) {
      scroller.scrollTo({ top: scroller.scrollTop + listTop - scrollerTop })
    }
  }

  const pager = (
    <Pagination
      ref={pagerRef}
      className={tw(
        'border-t border-grey-300 bg-white',
        // sticky: mt-auto pushes the pager to the bottom of the flex-col scroll area when the list
        //   is short; it stays visible once the page scrolls.
        // non-sticky: nested lists live inside an already-padded wrapper, so -mt-px just overlaps
        //   the last row's bottom border with the pager's top border.
        sticky ? 'sticky bottom-0 z-10 mt-auto' : '-mt-px',
        // insetPager: only full-page STICKY lists (bare siblings in the unpadded main scroll area)
        //   need the page gutter on the pager to align its controls with the table content — the
        //   border stays full-width, only the controls indent. Gated on `sticky` because a
        //   non-sticky pager sits in an already-padded wrapper (its gutter would double).
        sticky && insetPager && 'px-4 md:px-12',
      )}
      currentPage={metadata?.currentPage ?? 1}
      totalPages={metadata?.totalPages ?? 0}
      totalCount={metadata?.totalCount ?? 0}
      pageSize={pageSize}
      onPageChange={handlePageChange}
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
      <div ref={contentRef}>
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
