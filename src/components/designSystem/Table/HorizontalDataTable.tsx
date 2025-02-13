import { useVirtualizer } from '@tanstack/react-virtual'
import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react'

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
  data: T[]
  clickedDataIndex?: number | undefined
  columnWidth?: number
  leftColumnWidth?: number
  columnIdPrefix?: string
  setClickedDataIndex?: Dispatch<SetStateAction<number | undefined>>
}

const getRowHeight = (rowType: RowType) => {
  if (rowType === 'header') return 40

  return 48
}

export const HorizontalDataTable = <T extends DataItem>({
  clickedDataIndex,
  setClickedDataIndex,
  columnIdPrefix = 'column-',
  leftColumnWidth = DEFAULT_LEFT_COLUMN_WIDTH,
  columnWidth = DEFAULT_COLUMN_WIDTH,
  data = [],
  rows = [],
}: HorizontalDataTableProps<T>) => {
  const parentRef = useRef(null)

  const columnVirtualizer = useVirtualizer({
    count: data.length,
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
    // On init, scroll to the last element
    columnVirtualizer.scrollToIndex(data.length - 1)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        onMouseEnter={() => {
          if (typeof clickedDataIndex === 'number' && !!setClickedDataIndex) {
            setClickedDataIndex(undefined)
          }
        }}
      >
        <div
          className="relative h-full"
          style={{
            width: `${columnVirtualizer.getTotalSize()}px`,
          }}
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
            <div
              id={buildColumnId(virtualColumn.index)}
              key={`key-column-${virtualColumn.index}`}
              className={tw('absolute hover:bg-grey-100 focus:bg-grey-100', {
                'bg-grey-100': virtualColumn.index === clickedDataIndex,
              })}
              style={{
                width: `${virtualColumn.size}px`,
                left: `${virtualColumn.start}px`,
              }}
            >
              {rows.map((row, index) => (
                <div
                  key={`key-column-${virtualColumn.index}-item-${index}-row-${row.key}`}
                  className={tw('flex items-center justify-end px-1 shadow-b', {
                    'shadow-y': index === 0,
                  })}
                  style={{ height: getRowHeight(row.type) }}
                >
                  {row.content(data[virtualColumn.index])}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
