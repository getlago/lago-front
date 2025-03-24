import { useVirtualizer } from '@tanstack/react-virtual'
import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'

import { useAnalyticsState } from '~/components/analytics/AnalyticsStateContext'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { tw } from '~/styles/utils'

import { Typography } from '../Typography'

const DEFAULT_COLUMN_WIDTH = 160
const DEFAULT_LEFT_COLUMN_WIDTH = 120

type DataItem = {
  [key: string]: unknown
}

type RowType = 'header' | 'data'
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`
type DotNestedKeys<T> = (
  T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<
        keyof T,
        symbol
      >]
    : ''
) extends infer D
  ? Extract<D, string>
  : never

type TRows<T> = {
  content: (item: T) => ReactNode
  key: DotNestedKeys<T>
  label: string | ReactNode
  type: RowType
}[]

type HorizontalDataTableProps<T> = {
  rows: TRows<T>
  columnIdPrefix?: string
  columnWidth?: number
  data?: T[]
  leftColumnWidth?: number
  loading?: boolean
}

const getRowHeight = (rowType: RowType) => {
  if (rowType === 'header') return 40

  return 48
}

export const HorizontalDataTable = <T extends DataItem>({
  columnIdPrefix = 'column-',
  columnWidth = DEFAULT_COLUMN_WIDTH,
  data,
  leftColumnWidth = DEFAULT_LEFT_COLUMN_WIDTH,
  loading,
  rows,
}: HorizontalDataTableProps<T>) => {
  // Get the hover and click state from context
  const { clickedDataIndex, setHoverDataIndex, setClickedDataIndex } = useAnalyticsState()
  const parentRef = useRef(null)

  const columnVirtualizer = useVirtualizer({
    count: loading ? 12 : data?.length || 0,
    horizontal: true,
    paddingStart: leftColumnWidth,
    estimateSize: () => columnWidth,
    getScrollElement: () => parentRef.current,
  })

  const buildColumnId = useCallback(
    (index: number): string => `${columnIdPrefix}${index}`,
    [columnIdPrefix],
  )

  useEffect(() => {
    if (!loading && !!data?.length) {
      // On init, scroll to the last element
      columnVirtualizer.scrollToIndex((data?.length || 1) - 1)
    }
  }, [columnVirtualizer, data?.length, loading])

  useEffect(() => {
    if (typeof clickedDataIndex === 'number') {
      columnVirtualizer.scrollToIndex(clickedDataIndex, { behavior: 'smooth', align: 'center' })
    }
  }, [clickedDataIndex, columnVirtualizer])

  const tableHeight = useMemo(
    () => rows.reduce((acc, item) => acc + getRowHeight(item.type), 0),
    [rows],
  )

  return (
    <div className="relative w-full">
      {!!rows.length && (
        <div
          className={tw('pointer-events-none absolute left-0 top-0 z-10 bg-white', {
            'shadow-r': !!columnVirtualizer?.scrollOffset,
          })}
          style={{ width: leftColumnWidth }}
        >
          {rows.map((item, index) => (
            <div
              key={`left-column-item-${index}`}
              className={tw('flex items-center shadow-b', {
                'shadow-y': index === 0,
              })}
              style={{ height: getRowHeight(item.type) }}
            >
              {!!loading && <Skeleton className="w-5/6" variant="text" />}
              {!loading && (
                <>
                  {typeof item.label === 'string' ? (
                    <Typography
                      variant={item.type === 'header' ? 'captionHl' : 'bodyHl'}
                      color={item.type === 'header' ? 'grey600' : 'grey700'}
                    >
                      {item.label}
                    </Typography>
                  ) : (
                    <>{item.label}</>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        ref={parentRef}
        className="w-full overflow-x-auto no-scrollbar"
        style={{
          height: tableHeight,
        }}
        onMouseEnter={
          !loading
            ? () => {
                if (typeof clickedDataIndex === 'number') {
                  setClickedDataIndex(undefined)
                }
              }
            : undefined
        }
      >
        <div
          className="relative h-full"
          style={{
            width: `${columnVirtualizer.getTotalSize()}px`,
          }}
          onMouseLeave={
            !loading
              ? () => {
                  setHoverDataIndex(undefined)
                }
              : undefined
          }
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
            <div
              id={buildColumnId(virtualColumn.index)}
              key={`key-column-${virtualColumn.index}`}
              className={tw('absolute', {
                'bg-grey-100': virtualColumn.index === clickedDataIndex,
                'hover:bg-grey-100 focus:bg-grey-100': !loading,
              })}
              style={{
                width: `${virtualColumn.size}px`,
                left: `${virtualColumn.start}px`,
              }}
              onMouseEnter={
                !loading
                  ? () => {
                      setHoverDataIndex(virtualColumn.index)
                    }
                  : undefined
              }
            >
              {rows.map((row, index) => {
                return (
                  <div
                    key={`key-column-${virtualColumn.index}-item-${index}-row-${row.key}`}
                    className={tw('flex items-center justify-end px-1 shadow-b', {
                      'shadow-y': index === 0,
                    })}
                    style={{ height: getRowHeight(row.type) }}
                  >
                    {!!loading && <Skeleton className="w-5/6 justify-end" variant="text" />}
                    {!!data?.length && !loading && row.content(data[virtualColumn.index])}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
