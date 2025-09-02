import { useVirtualizer } from '@tanstack/react-virtual'
import { ReactElement, useEffect, useRef } from 'react'

import { ITEM_HEIGHT } from '~/styles'
import { tw } from '~/styles/utils'

import { MultipleComboBoxProps } from './types'

export const MULTIPLE_GROUP_ITEM_KEY = 'multiple-comboBox-group-by'
export const GROUP_HEADER_HEIGHT = 44

type MultipleComboBoxVirtualizedListProps = {
  elements: ReactElement[]
} & Pick<MultipleComboBoxProps, 'value'>

export const MultipleComboBoxVirtualizedList = ({
  elements,
  value,
}: MultipleComboBoxVirtualizedListProps) => {
  const itemCount = elements?.length
  const parentRef = useRef<HTMLDivElement>(null)

  const getHeight = () => {
    const hasAnyGroupHeader = elements.some((el) =>
      (el.key as string).includes(MULTIPLE_GROUP_ITEM_KEY),
    )

    // recommended perf best practice
    if (itemCount > 5) {
      return 5 * (ITEM_HEIGHT + 4) + 4 // Add 4px for margins
    } else if (itemCount <= 2 && hasAnyGroupHeader) {
      return itemCount * (ITEM_HEIGHT + 2) // Add 2px for margins
    }
    return itemCount * (ITEM_HEIGHT + 8) + 4 // Add 4px for margins
  }

  const getItemHeight = (index: number) => {
    const element = elements[index]

    if ((element.key as string)?.includes(MULTIPLE_GROUP_ITEM_KEY)) {
      return GROUP_HEADER_HEIGHT + (index === 0 ? 2 : 6)
    }

    if (index === itemCount - 1) {
      return ITEM_HEIGHT
    }

    return ITEM_HEIGHT + 8
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

  return (
    <div
      ref={parentRef}
      className={tw({ 'mb-1': elements.length > 1 })}
      style={{ height: getHeight(), width: '100%', overflow: 'auto' }}
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
