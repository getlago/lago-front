import { Icon } from 'lago-design-system'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '~/core/constants/pagination'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  /** Total number of items across all pages — drives the "X-Y of N results" label */
  totalCount?: number
  /** Rows displayed per page — drives the range label and the selected option */
  pageSize?: number
  onPageChange: (page: number) => void
  /** When provided, the results label becomes a menu that switches the rows-per-page */
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  /** While true the range label shows a skeleton and the prev/next controls are disabled.
   *  The pager stays visible during loading (with this loader) so it doesn't flicker in/out. */
  loading?: boolean
  className?: string
}

// 40x40 control with the 16px chevron centered (→ 12px padding all around), grey-600, and a
// visible hover surface. Reused for prev + next.
const arrowClassName = tw(
  'flex size-10 items-center justify-center rounded-lg text-grey-600 transition-colors',
  'hover:bg-grey-200 disabled:pointer-events-none disabled:text-grey-400',
)

/**
 * Table-footer pager: prev/next chevrons + a "{start}-{end} of {total} results" label.
 * When `onPageSizeChange` is passed the label becomes a menu that switches the number of
 * rows per page (the menu opens upward, matching the sticky-bottom placement).
 *
 * Sizing (per design): each arrow is 40x40 with a 16px icon (12px inset); arrows sit 12px
 * apart and 12px from the label; the label is 40px tall, 12px horizontal padding, 16px,
 * grey-600, centered. During `loading` the label is replaced by a skeleton and the arrows
 * are disabled — the pager stays visible so it doesn't disappear/reappear across fetches.
 */
export const Pagination = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  loading,
  className,
}: PaginationProps) => {
  const { translate } = useInternationalization()

  // Single page (or none) → no pager. While loading we keep it visible (with its loader) so
  // it doesn't flicker in/out as the cached metadata comes and goes.
  if (!loading && (!totalPages || totalPages <= 1)) {
    return null
  }

  const startNumber = (currentPage - 1) * pageSize + 1
  const endNumber =
    totalCount !== undefined ? Math.min(currentPage * pageSize, totalCount) : currentPage * pageSize

  // "{start}-{end} of {total} results" when the total is known, otherwise just "{start}-{end}"
  const rangeLabel =
    totalCount !== undefined
      ? translate(
          'text_1782992964028u0dbq1gbcy4',
          { startNumber, endNumber, count: totalCount },
          totalCount,
        )
      : `${startNumber}-${endNumber}`

  // 40px tall, 12px horizontal padding, 16px, grey-600, centered
  const labelClassName = 'flex h-10 items-center justify-center px-3 text-base text-grey-600'

  // The results label: a rows-per-page menu when `onPageSizeChange` is set, otherwise plain text
  const resultsLabel = onPageSizeChange ? (
    <Popper
      PopperProps={{ placement: 'top-start' }}
      // Always render at z-dialog (not the default z-popper). The pager can live inside the
      // devtools console (z-console, above z-popper); at z-popper the menu would open behind
      // it and clicking would look like a no-op. It's a transient click-menu, so being
      // top-most is fine everywhere (still under toasts/tooltips).
      displayInDialog
      opener={
        <button
          type="button"
          className={tw(labelClassName, 'rounded-lg transition-colors hover:bg-grey-200')}
        >
          {rangeLabel}
        </button>
      }
    >
      {({ closePopper }) => (
        <MenuPopper>
          {pageSizeOptions.map((size) => (
            <Button
              key={`page-size-${size}`}
              align="left"
              variant={size === pageSize ? 'secondary' : 'quaternary'}
              onClick={() => {
                onPageSizeChange(size)
                closePopper()
              }}
            >
              {translate('text_1782992964029cazjloaotl0', { count: size }, size)}
            </Button>
          ))}
        </MenuPopper>
      )}
    </Popper>
  ) : (
    <div className={labelClassName}>{rangeLabel}</div>
  )

  // While loading, the label is replaced by a skeleton
  const labelSlot = loading ? (
    <div className={labelClassName} data-test="pagination-loading">
      <Skeleton variant="text" className="w-36" />
    </div>
  ) : (
    resultsLabel
  )

  return (
    <nav
      aria-label="pagination"
      className={tw('flex items-center gap-3 px-4 py-3', className)}
      data-test="pagination"
    >
      <button
        type="button"
        aria-label="previous page"
        className={arrowClassName}
        disabled={loading || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <Icon name="chevron-left" size="medium" />
      </button>

      <button
        type="button"
        aria-label="next page"
        className={arrowClassName}
        disabled={loading || currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <Icon name="chevron-right" size="medium" />
      </button>

      {labelSlot}
    </nav>
  )
}
