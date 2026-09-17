/** Pure helpers shared by `Pagination` and `PaginatedContent`. */

/**
 * The 1-based item range shown on the current page — e.g. page 2 at 20 rows over 45 items
 * → `{ startNumber: 21, endNumber: 40 }`. The end is clamped to `totalCount` on the last page.
 *
 * Both flags opt out of that clamp, because clamping to a `totalCount` that is only a floor
 * renders nonsense like "11981-10000":
 *  - `hasNextPage`: another page follows, so the current one is necessarily full.
 *  - `totalCountCapped`: the total is a floor, which also covers the last page of a capped
 *    collection (no next page, yet already past the counted range). The end is then a whole page
 *    even if the last one is partial — an overstatement of at most `pageSize - 1`, and the only
 *    approximation available without a row count.
 *
 * Left undefined, both keep the original clamp.
 */
export const getPageRange = ({
  currentPage,
  pageSize,
  totalCount,
  hasNextPage,
  totalCountCapped,
}: {
  currentPage: number
  pageSize: number
  totalCount: number
  hasNextPage?: boolean
  totalCountCapped?: boolean
}): { startNumber: number; endNumber: number } => ({
  startNumber: (currentPage - 1) * pageSize + 1,
  endNumber:
    hasNextPage || totalCountCapped
      ? currentPage * pageSize
      : Math.min(currentPage * pageSize, totalCount),
})

/**
 * Whether the pager footer should render at all.
 *  - With a rows-per-page menu it stays useful on a single page (switch size, read the count),
 *    so it's hidden only when even the smallest option would show everything.
 *  - Without a menu a single page has nothing to act on, so it's hidden.
 */
export const shouldRenderFooter = ({
  hasPageSizeMenu,
  totalCount,
  pageSizeOptions,
  totalPages,
}: {
  hasPageSizeMenu: boolean
  totalCount: number
  pageSizeOptions: number[]
  totalPages: number
}): boolean => (hasPageSizeMenu ? totalCount > Math.min(...pageSizeOptions) : totalPages > 1)

/**
 * Walks up from `node` to the nearest vertically-scrollable ancestor — the list's scroll
 * container (`NavLayout.ContentWrapper` for full-page lists, the tab/section scroll area for
 * nested ones). Returns `null` when nothing scrolls.
 */
export const getScrollableAncestor = (node: HTMLElement | null): HTMLElement | null => {
  let el = node?.parentElement ?? null

  while (el) {
    const { overflowY } = getComputedStyle(el)

    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el
    }
    el = el.parentElement
  }

  return null
}
