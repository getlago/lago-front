import { useVirtualizer } from '@tanstack/react-virtual'
import { Icon } from 'lago-design-system'
import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

import { Align } from './Table'
import TableInnerCell from './tableComponents/TableInnerCell'

// Constants
const DEFAULT_COLUMN_WIDTH = 160
const DEFAULT_COLUMN_MIN_WIDTH = 120
const DEFAULT_FIRST_COLUMN_WIDTH = 200
const ROW_HEIGHT = 48
const HEADER_ROW_HEIGHT = 40

// --------------------------------
// Type Definitions
// --------------------------------

export type ColumnConfig = {
  key: string
  label: string
  minWidth?: number // Minimum width for this column
  isFullWidth?: boolean // If true, this column will expand to fill remaining space (only one column should have this)
  align?: Align // Text alignment for the column (default: 'right')
}

export type RowConfig<T> = {
  key: string
  label: string | ReactNode
  content: (item: T, column: ColumnConfig) => ReactNode
} & ({ type: 'group' } | { type: 'line'; groupKey?: string })

export type TableWithGroupsRef = {
  expandAll: () => void
  collapseAll: () => void
  toggleGroup: (groupKey: string) => void
  isGroupExpanded: (groupKey: string) => boolean
}

export type TableWithGroupsProps<T> = {
  rows: RowConfig<T>[]
  columns: ColumnConfig[]
  data: T[]
  isLoading?: boolean
  columnWidth?: number
  firstColumnLabel?: string
  firstColumnWidth?: number
}

// --------------------------------
// Helper Functions
// --------------------------------

// Get all group keys from rows configuration
const getGroupKeys = <T,>(rows: RowConfig<T>[]): string[] => {
  return rows.filter((row) => row.type === 'group').map((row) => row.key)
}

// --------------------------------
// Component
// --------------------------------

const TableWithGroupsInner = <T,>(
  {
    rows,
    columns,
    data,
    isLoading = false,
    columnWidth = DEFAULT_COLUMN_WIDTH,
    firstColumnLabel = '',
    firstColumnWidth = DEFAULT_FIRST_COLUMN_WIDTH,
  }: TableWithGroupsProps<T>,
  ref: React.ForwardedRef<TableWithGroupsRef>,
) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  // Track container width for flex column calculation
  const [containerWidth, setContainerWidth] = useState(0)

  // All groups start collapsed (empty object means all collapsed)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    expandAll: () => {
      const allGroups = getGroupKeys(rows)
      const expanded = allGroups.reduce(
        (acc, key) => {
          acc[key] = true
          return acc
        },
        {} as Record<string, boolean>,
      )

      setExpandedGroups(expanded)
    },
    collapseAll: () => {
      setExpandedGroups({})
    },
    toggleGroup: (groupKey: string) => {
      setExpandedGroups((prev) => ({
        ...prev,
        [groupKey]: !prev[groupKey],
      }))
    },
    isGroupExpanded: (groupKey: string) => {
      return !!expandedGroups[groupKey]
    },
  }))

  // Filter visible rows (hide lines whose group is collapsed)
  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (row.type === 'group') return true
      if (row.type === 'line' && row.groupKey) {
        return !!expandedGroups[row.groupKey]
      }
      return true // Standalone lines are always visible
    })
  }, [rows, expandedGroups])

  // Calculate total table height
  const tableHeight = useMemo(() => {
    return HEADER_ROW_HEIGHT + visibleRows.length * ROW_HEIGHT
  }, [visibleRows.length])

  // Calculate column widths, accounting for flex column
  const getColumnWidth = useCallback(
    (index: number): number => {
      const column = columns[index]

      if (!column) return columnWidth

      // If this column has flex, calculate remaining space
      if (column.isFullWidth) {
        const availableWidth = containerWidth - firstColumnWidth
        const fixedColumnsWidth = columns.reduce((sum, col) => {
          if (col.isFullWidth) return sum

          return sum + (col.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH)
        }, 0)

        const flexWidth = Math.max(
          availableWidth - fixedColumnsWidth,
          column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH,
        )

        return flexWidth
      }

      return column.minWidth ?? DEFAULT_COLUMN_MIN_WIDTH
    },
    [columns, columnWidth, containerWidth, firstColumnWidth],
  )

  // Horizontal virtualizer for columns
  const columnVirtualizer = useVirtualizer({
    count: isLoading ? 12 : columns.length,
    horizontal: true,
    estimateSize: getColumnWidth,
    getScrollElement: () => parentRef.current,
  })

  // Re-measure columns when container width changes (for flex column)
  useEffect(() => {
    columnVirtualizer.measure()
  }, [containerWidth, columnVirtualizer])

  // Vertical virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: visibleRows.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  })

  // Handle group row click
  const handleRowClick = useCallback((row: RowConfig<T>) => {
    if (row.type !== 'group') return

    setExpandedGroups((prev) => ({
      ...prev,
      [row.key]: !prev[row.key],
    }))
  }, [])

  // Check if horizontal scroll is active (for sticky column shadow)
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false)

  // Track hovered row index for group row hover effect
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (parentRef.current) {
        setHasHorizontalScroll(parentRef.current.scrollLeft > 0)
      }
    }

    const element = parentRef.current

    element?.addEventListener('scroll', handleScroll)
    return () => element?.removeEventListener('scroll', handleScroll)
  }, [])

  // Track container width for flex column calculation
  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(container)
    setContainerWidth(container.offsetWidth)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative size-full overflow-hidden">
      {/* Sticky First Column */}
      <div
        className={tw('absolute left-0 top-0 z-20 bg-white', hasHorizontalScroll && 'shadow-r')}
        style={{ width: firstColumnWidth }}
      >
        {/* Sticky Header Cell */}
        <div
          className="flex bg-white"
          style={{
            height: HEADER_ROW_HEIGHT,
            borderBottom: `1px solid ${theme.palette.grey[300]}`,
          }}
        >
          <TableInnerCell align="left" className="min-h-10 px-4 text-grey-600">
            {isLoading ? (
              <Skeleton className="w-3/4" variant="text" />
            ) : (
              <Typography variant="captionHl" color="grey600">
                {firstColumnLabel}
              </Typography>
            )}
          </TableInnerCell>
        </div>

        {/* Sticky Row Labels */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = visibleRows[virtualRow.index]
          const isGroup = row.type === 'group'
          const isExpanded = isGroup && expandedGroups[row.key]
          const isChildLine = row.type === 'line' && 'groupKey' in row && row.groupKey
          const isHovered = isGroup && hoveredRowIndex === virtualRow.index

          return (
            <div
              key={`sticky-row-${virtualRow.index}`}
              role={isGroup ? 'button' : undefined}
              tabIndex={isGroup ? 0 : -1}
              className={tw(
                'absolute left-0 flex',
                isGroup && 'cursor-pointer',
                isHovered ? 'bg-grey-100' : 'bg-white',
              )}
              style={{
                height: ROW_HEIGHT,
                width: firstColumnWidth,
                top: HEADER_ROW_HEIGHT + virtualRow.start,
                borderBottom: `1px solid ${theme.palette.grey[300]}`,
              }}
              onClick={() => handleRowClick(row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRowClick(row)
                }
              }}
              onMouseEnter={() => isGroup && setHoveredRowIndex(virtualRow.index)}
              onMouseLeave={() => isGroup && setHoveredRowIndex(null)}
            >
              <TableInnerCell align="left" className={tw('px-4', isChildLine && 'pl-10')}>
                {isLoading && <Skeleton className="w-3/4" variant="text" />}
                {!isLoading && (
                  <>
                    {isGroup && (
                      <Icon
                        className={tw('mr-2 transition-transform', isExpanded && 'rotate-90')}
                        name="chevron-right-filled"
                        size="small"
                      />
                    )}
                    {typeof row.label === 'string' ? (
                      <Typography variant={isGroup ? 'bodyHl' : 'body'} color="grey700" noWrap>
                        {row.label}
                      </Typography>
                    ) : (
                      row.label
                    )}
                  </>
                )}
              </TableInnerCell>
            </div>
          )
        })}
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={parentRef}
        className="size-full overflow-auto"
        style={{
          paddingLeft: firstColumnWidth,
        }}
      >
        <div
          className="relative"
          style={{
            width: columnVirtualizer.getTotalSize(),
            height: tableHeight,
          }}
        >
          {/* Header Row */}
          <div className="sticky top-0 z-10 flex bg-white" style={{ height: HEADER_ROW_HEIGHT }}>
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const column = columns[virtualColumn.index]

              return (
                <div
                  key={`header-${virtualColumn.index}`}
                  className="absolute flex"
                  style={{
                    width: virtualColumn.size,
                    height: HEADER_ROW_HEIGHT,
                    left: virtualColumn.start,
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                  }}
                >
                  <TableInnerCell align={column?.align ?? 'left'} className="min-h-10 w-full px-4">
                    {isLoading ? (
                      <Skeleton className="w-3/4" variant="text" />
                    ) : (
                      <Typography variant="captionHl" color="grey600" noWrap>
                        {column?.label}
                      </Typography>
                    )}
                  </TableInnerCell>
                </div>
              )
            })}
          </div>

          {/* Data Cells */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = visibleRows[virtualRow.index]
            const isGroup = row.type === 'group'
            const isHovered = isGroup && hoveredRowIndex === virtualRow.index

            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                key={`row-${virtualRow.index}`}
                className={tw('absolute flex', isGroup && 'cursor-pointer')}
                style={{
                  top: HEADER_ROW_HEIGHT + virtualRow.start,
                  height: ROW_HEIGHT,
                  width: columnVirtualizer.getTotalSize(),
                }}
                onClick={() => handleRowClick(row)}
                onMouseEnter={() => isGroup && setHoveredRowIndex(virtualRow.index)}
                onMouseLeave={() => isGroup && setHoveredRowIndex(null)}
              >
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                  const column = columns[virtualColumn.index]
                  const dataItem = data[virtualColumn.index]

                  return (
                    <div
                      key={`cell-${virtualRow.index}-${virtualColumn.index}`}
                      className={tw('absolute flex', isHovered ? 'bg-grey-100' : 'bg-white')}
                      style={{
                        width: virtualColumn.size,
                        height: ROW_HEIGHT,
                        left: virtualColumn.start,
                        borderBottom: `1px solid ${theme.palette.grey[300]}`,
                      }}
                    >
                      <TableInnerCell align={column?.align ?? 'left'} className="w-full px-4">
                        {isLoading ? (
                          <Skeleton className="w-3/4" variant="text" />
                        ) : (
                          dataItem && column && row.content(dataItem, column)
                        )}
                      </TableInnerCell>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Use forwardRef with generics
export const TableWithGroups = forwardRef(TableWithGroupsInner) as <T>(
  props: TableWithGroupsProps<T> & { ref?: React.ForwardedRef<TableWithGroupsRef> },
) => React.ReactElement
