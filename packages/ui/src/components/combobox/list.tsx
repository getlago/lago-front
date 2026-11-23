import { Combobox as Primitive } from '@base-ui/react/combobox'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'

import { ComboboxContext } from '../combobox-context'

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
}: ComboboxListProps<Value>): React.ReactElement {
  const items = Primitive.useFilteredItems<Value>()
  const context = React.useContext(ComboboxContext)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const rows = React.useMemo(() => {
    const result: Array<{
      key: string
      label?: string
      group?: string
      item?: Value
      index: number
    }> = []
    let previous: string | undefined

    items.forEach((item, index) => {
      const group = groupBy?.(item)

      if (group !== undefined && group !== previous)
        result.push({ key: `group:${group}:${index}`, label: group, group, index })
      result.push({ key: `item:${getItemKey(item)}`, item, group, index })
      previous = group
    })
    return result
  }, [items, getItemKey, groupBy])
  const virtualizer = useVirtualizer({
    count: rows.length,
    enabled: context?.virtualized,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => rows[index].key,
    estimateSize: (index) =>
      rows[index].label !== undefined ? 24 : (estimateSize?.(rows[index].item as Value) ?? 36) + 4,
    overscan: 5,
    rangeExtractor: (range) => {
      const visible = defaultRangeExtractor(range)
      const active = rows.findIndex(
        (row) => row.label === undefined && row.index === context?.highlightedIndex.current,
      )

      return active < 0 ? visible : [...new Set([...visible, active])].sort((a, b) => a - b)
    },
  })

  const initialScroll = React.useRef(true)

  React.useLayoutEffect(() => {
    if (!context?.virtualized) return
    const scroll = (index: number): void => {
      const row = rows.findIndex((entry) => entry.label === undefined && entry.index === index)

      if (row >= 0) virtualizer.scrollToIndex(row, { align: 'auto' })
    }

    context.scrollToIndex.current = scroll
    if (initialScroll.current && context.highlightedIndex.current !== undefined)
      scroll(context.highlightedIndex.current)
    initialScroll.current = false
    return () => {
      context.scrollToIndex.current = undefined
    }
  }, [context, rows, virtualizer])
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
    const previous = groups[groups.length - 1]

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

    if (row.label !== undefined)
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
        {React.cloneElement(children(row.item as Value, row.index), {
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
        {groups.map((group, index) => (
          <div
            key={group.label ?? index}
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
