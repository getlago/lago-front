/* eslint-disable react/prop-types */
import { ReactElement, useEffect, useRef } from 'react'
import { VariableSizeList } from 'react-window'

import { ITEM_HEIGHT } from './ComboBoxItem'
import { ComboBoxProps } from './types'

export const GROUP_ITEM_KEY = 'combobox-group-by'
export const GROUP_HEADER_HEIGHT = 44

function useResetCache(itemCount: number) {
  const ref = useRef<VariableSizeList>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.resetAfterIndex(0, true)
    }
  }, [itemCount])
  return ref
}

type ComboBoxVirtualizedListProps = {
  elements: ReactElement[]
} & Pick<ComboBoxProps, 'value'>

export const ComboBoxVirtualizedList = (props: ComboBoxVirtualizedListProps) => {
  const { elements, value } = props
  const itemCount = elements?.length

  const getHeight = () => {
    // recommended perf best practice
    if (itemCount > 5) {
      return 5 * (ITEM_HEIGHT + 4) - 4 // Last item does not have 4px margin-bottom
    }
    return itemCount * (ITEM_HEIGHT + 4) - 4 // Last item does not have 4px margin-bottom
  }

  // reset the `VariableSizeList` cache if data gets updated
  const gridRef = useResetCache(itemCount)

  // when value gets updated, ensure we tell <VariableSizeList>
  // to scroll to the selected option
  useEffect(
    () => {
      if (gridRef && value && gridRef.current) {
        const valueIndex = elements.findIndex(
          (el) => el.props?.children?.props?.option?.value === value
        )

        if (valueIndex) {
          gridRef.current?.scrollToItem(valueIndex, 'smart')
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  return (
    <VariableSizeList
      itemData={elements}
      height={getHeight()}
      width="100%"
      ref={gridRef}
      innerElementType="div"
      itemSize={(index) => {
        return index === itemCount - 1
          ? ITEM_HEIGHT
          : ((elements[index].key as string) || '').includes(GROUP_ITEM_KEY)
          ? GROUP_HEADER_HEIGHT + (index === 0 ? 8 : 12)
          : ITEM_HEIGHT + 4
      }}
      overscanCount={5}
      itemCount={itemCount}
    >
      {({ style, index }) => <div style={style}>{elements[index]}</div>}
    </VariableSizeList>
  )
}
