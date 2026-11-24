import { Combobox as Primitive } from '@base-ui/react/combobox'
import { defaultRangeExtractor, Range, useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'

import { ComboboxContext } from './context'

export interface ComboboxListProps<Value> {
  children: (item: Value, index: number) => React.ReactElement<Primitive.Item.Props>
  getItemKey: (item: Value) => string
  groupBy?: (item: Value) => string
  estimateSize?: (item: Value) => number
}

export function ComboboxList<Value>({
  children,
  getItemKey,
  groupBy,
  estimateSize,
}: Readonly<ComboboxListProps<Value>>): React.ReactElement {
  const items = Primitive.useFilteredItems<Value>()
  const context = React.useContext(ComboboxContext)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const rows = React.useMemo(() => {
    const result: Array<
      | { kind: 'group'; key: string; label: string; group: string; index: number }
      | { kind: 'item'; key: string; item: Value; group?: string; index: number }
    > = []
    let previous: string | undefined

    items.forEach((item, index) => {
      const group = groupBy?.(item)

      if (group !== undefined && group !== previous)
        result.push({ kind: 'group', key: `group:${getItemKey(item)}`, label: group, group, index })
      result.push({ kind: 'item', key: `item:${getItemKey(item)}`, item, group, index })
      previous = group
    })
    return result
  }, [items, getItemKey, groupBy])
  const rowByOption = React.useMemo(() => {
    const indexes = new Map<number, number>()

    rows.forEach((row, index) => {
      if (row.kind === 'item') indexes.set(row.index, index)
    })
    return indexes
  }, [rows])
  const getScrollElement = React.useCallback((): HTMLDivElement | null => scrollRef.current, [])
  const getRowKey = React.useCallback((index: number): string => rows[index].key, [rows])
  const estimateRow = React.useCallback(
    (index: number): number => {
      const row = rows[index]

      return row.kind === 'group' ? 24 : (estimateSize?.(row.item) ?? 36) + 4
    },
    [rows, estimateSize],
  )
  const rangeExtractor = React.useCallback(
    (range: Range): number[] => {
      const visible = defaultRangeExtractor(range)
      const active = rowByOption.get(context?.highlightedIndex.current ?? -1)

      return active === undefined
        ? visible
        : [...new Set([...visible, active])].sort((a, b) => a - b)
    },
    [rowByOption, context],
  )
  const virtualizer = useVirtualizer({
    count: rows.length,
    enabled: context?.virtualized,
    getScrollElement,
    getItemKey: getRowKey,
    estimateSize: estimateRow,
    overscan: 5,
    rangeExtractor,
  })

  const initialScroll = React.useRef(true)

  React.useLayoutEffect(() => {
    if (!context?.virtualized) return
    const scroll = (index: number): void => {
      const row = rowByOption.get(index)

      if (row !== undefined) virtualizer.scrollToIndex(row, { align: 'auto' })
    }

    context.scrollToIndex.current = scroll
    if (initialScroll.current && context.highlightedIndex.current !== undefined)
      scroll(context.highlightedIndex.current)
    initialScroll.current = false
    return () => {
      context.scrollToIndex.current = undefined
    }
  }, [context, rowByOption, virtualizer])
  const previousKeys = React.useRef<string[]>([])

  React.useLayoutEffect(() => {
    const keys = items.map(getItemKey)
    const previous = previousKeys.current
    const appended = previous.length > 0 && previous.every((key, index) => keys[index] === key)

    if (previous.length > 0 && !appended && context?.virtualized) virtualizer.scrollToOffset(0)
    previousKeys.current = keys
  }, [items, getItemKey, context?.virtualized, virtualizer])
  const visible: Array<{ index: number; start: number }> = context?.virtualized
    ? virtualizer.getVirtualItems()
    : rows.map((_, index) => ({ index, start: 0, key: rows[index].key }))

  const groups: Array<{ label?: string; rows: typeof visible }> = []

  visible.forEach((row) => {
    const label = rows[row.index].group
    const previous = groups.at(-1)

    if (previous && previous.label === label) previous.rows.push(row)
    else groups.push({ label, rows: [row] })
  })
  const renderRow = (virtualRow: (typeof visible)[number]): React.ReactElement => {
    const row = rows[virtualRow.index]
    const style: React.CSSProperties = context?.virtualized
      ? {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
        }
      : {}

    if (row.kind === 'group')
      return (
        <div
          key={row.key}
          ref={context?.virtualized ? virtualizer.measureElement : undefined}
          data-index={virtualRow.index}
          style={style}
          className="v2-text-caption px-2 py-1 text-text-muted"
          role="presentation"
        >
          {row.label}
        </div>
      )
    return (
      <div
        key={row.key}
        style={style}
        ref={context?.virtualized ? virtualizer.measureElement : undefined}
        data-index={virtualRow.index}
        className="pb-1"
        role="presentation"
      >
        {React.cloneElement(children(row.item, row.index), {
          index: row.index,
          'aria-posinset': row.index + 1,
          'aria-setsize': items.length,
        })}
      </div>
    )
  }

  return (
    <Primitive.List ref={scrollRef} className="v2-combobox-list">
      <div
        style={
          context?.virtualized
            ? { height: virtualizer.getTotalSize(), position: 'relative' }
            : undefined
        }
      >
        {groups.map((group) => (
          <div
            key={rows[group.rows[0].index].key}
            role={group.label === undefined ? 'presentation' : 'group'}
            aria-label={group.label}
          >
            {group.rows.map(renderRow)}
          </div>
        ))}
      </div>
    </Primitive.List>
  )
}
