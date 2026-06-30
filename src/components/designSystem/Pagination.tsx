import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

const DOTS = 'dots' as const

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Disable all controls (e.g. while a page is being fetched) */
  disabled?: boolean
  className?: string
}

const SIBLING_COUNT = 1
// first + last + current + 2 siblings + 2 ellipsis slots → the control always renders
// this many slots once it overflows, so its width is constant across pages.
const MAX_SLOTS = SIBLING_COUNT * 2 + 5
// pages shown on the side that has no ellipsis (e.g. the `1 2 3 4 5` run)
const EDGE_RUN_LENGTH = 3 + 2 * SIBLING_COUNT

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i)

/**
 * Builds a CONSTANT-length list of page tokens so the control's width never changes
 * as the user pages: the ellipsis slides between the two sides but the number of
 * slots stays the same (no content layout shift). e.g. for 10 pages it is always
 * 7 slots — `1 2 3 4 5 … 10`, `1 … 4 5 6 … 10`, `1 … 6 7 8 9 10`.
 */
const getPageWindow = (currentPage: number, totalPages: number): Array<number | typeof DOTS> => {
  // Few enough pages → show them all (count is naturally stable here)
  if (totalPages <= MAX_SLOTS) {
    return range(1, totalPages)
  }

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1)
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 2

  // Near the start → long left run, ellipsis, last page
  if (!showLeftDots && showRightDots) {
    return [...range(1, EDGE_RUN_LENGTH), DOTS, totalPages]
  }

  // Near the end → first page, ellipsis, long right run
  if (showLeftDots && !showRightDots) {
    return [1, DOTS, ...range(totalPages - EDGE_RUN_LENGTH + 1, totalPages)]
  }

  // Middle → ellipsis on both sides
  return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, totalPages]
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
  className,
}: PaginationProps) => {
  // Nothing to paginate
  if (!totalPages || totalPages <= 1) {
    return null
  }

  const pages = getPageWindow(currentPage, totalPages)

  return (
    <nav
      aria-label="pagination"
      className={tw('flex items-center justify-center gap-1 py-4', className)}
      data-test="pagination"
    >
      <Button
        variant="quaternary"
        size="small"
        icon="chevron-left"
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      />

      {pages.map((page, index) =>
        page === DOTS ? (
          <Typography
            key={`pagination-dots-${index}`}
            className="w-9 text-center"
            variant="body"
            color="grey500"
          >
            …
          </Typography>
        ) : (
          // Fixed width so single- vs double-digit pages (1 vs 10) don't shift the row
          <Button
            key={`pagination-page-${page}`}
            className="min-w-9 justify-center"
            variant={page === currentPage ? 'secondary' : 'quaternary'}
            size="small"
            disabled={disabled}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="quaternary"
        size="small"
        icon="chevron-right"
        disabled={disabled || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    </nav>
  )
}
