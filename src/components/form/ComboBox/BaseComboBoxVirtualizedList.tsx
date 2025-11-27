import { useVirtualizer } from '@tanstack/react-virtual'
import { ReactElement, useEffect, useRef } from 'react'

import { COMBOBOX_CONFIG } from './comboBoxConfig'

type BaseComboBoxVirtualizedListProps = {
  elements: ReactElement[]
  value: unknown
  groupItemKey: string
}

export const BaseComboBoxVirtualizedList = ({
  elements,
  value,
  groupItemKey,
}: BaseComboBoxVirtualizedListProps) => {
  const itemCount = elements?.length
  const parentRef = useRef<HTMLDivElement>(null)

  const getItemHeight = (index: number) => {
    const element = elements[index]

    if ((element.key as string)?.includes(groupItemKey)) {
      // Header height (44px) + top margin for non-first headers
      // First header: mt-0 (0px) = 44px
      // Other headers: mt-2 (8px) = 52px
      return COMBOBOX_CONFIG.GROUP_HEADER_HEIGHT + (index === 0 ? 0 : 8)
    }

    // All items have consistent my-2 (8px top + 8px bottom) = 16px total spacing
    return (
      COMBOBOX_CONFIG.ITEM_HEIGHT +
      COMBOBOX_CONFIG.ITEM_MARGIN_TOP +
      COMBOBOX_CONFIG.ITEM_MARGIN_BOTTOM
    )
  }

  const rowVirtualizer = useVirtualizer({
    count: elements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getItemHeight,
    overscan: 5,
  })

  useEffect(() => {
    const index = elements.findIndex((el) => el.props?.children?.props?.option?.value === value)

    if (index !== -1) {
      rowVirtualizer.scrollToIndex(index, { align: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const getContainerHeight = () => {
    const itemsToShow = Math.min(itemCount, COMBOBOX_CONFIG.MAX_VISIBLE_ITEMS)

    let height = 0
    let consecutiveItemCount = 0
    let previousWasItem = false

    for (let i = 0; i < itemsToShow; i++) {
      const isHeader = (elements[i].key as string)?.includes(groupItemKey)

      if (isHeader) {
        // Header height: base height + top margin (if not first)
        let headerHeight = COMBOBOX_CONFIG.GROUP_HEADER_HEIGHT

        if (i === 0) {
          // First header: no top margin
          headerHeight += 0
        } else if (previousWasItem) {
          // Header after item: item's bottom margin already accounted for, no overlap
          headerHeight += 8 // header's mt-2
        } else {
          // Header after header: add top margin
          headerHeight += 8
        }

        height += headerHeight
        consecutiveItemCount = 0
        previousWasItem = false
      } else {
        // For items: add base height + margins, but account for overlapping margins
        const itemBaseHeight = COMBOBOX_CONFIG.ITEM_HEIGHT
        const topMargin = COMBOBOX_CONFIG.ITEM_MARGIN_TOP
        const bottomMargin = COMBOBOX_CONFIG.ITEM_MARGIN_BOTTOM

        if (consecutiveItemCount === 0) {
          // First item (or first after header): add full height with both margins
          height += topMargin + itemBaseHeight + bottomMargin
        } else {
          // Subsequent consecutive items: margins overlap, so only add item + one margin
          height += itemBaseHeight + bottomMargin
        }

        consecutiveItemCount++
        previousWasItem = true
      }
    }

    // Subtract the last element's bottom margin (it extends beyond visible container)
    const lastIndex = itemsToShow - 1
    const lastIsHeader = (elements[lastIndex].key as string)?.includes(groupItemKey)

    if (!lastIsHeader && itemCount > COMBOBOX_CONFIG.MAX_VISIBLE_ITEMS) {
      // Last visible element is an item and there are more items to scroll
      // Subtract its bottom margin
      height -= COMBOBOX_CONFIG.ITEM_MARGIN_BOTTOM
    }

    return height
  }

  const containerHeight = getContainerHeight()

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{
        height: `${containerHeight}px`,
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: rowVirtualizer.getTotalSize(),
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute left-0 top-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              // Use the translate property for performance reasons
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {elements[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
