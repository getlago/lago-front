/* eslint-disable react/prop-types */
import {
  forwardRef,
  useEffect,
  createContext,
  useContext,
  useRef,
  ReactNode,
  Children,
} from 'react'
import { VariableSizeList } from 'react-window'
import styled from 'styled-components'

import { theme } from '~/styles'

import { ITEM_HEIGHT } from './ComboBoxItem'
import { ComboBoxProps } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRow(props: any) {
  const { data, index, style } = props

  return <div style={style}>{data[index]}</div>
}

const OuterElementContext = createContext({})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OuterElementType = forwardRef<HTMLDivElement, any>((props, ref) => {
  const outerProps = useContext(OuterElementContext)

  return <div ref={ref} {...props} {...outerProps} />
})

OuterElementType.displayName = 'OuterElementType'

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
  children: ReactNode
} & Pick<ComboBoxProps, 'value'> &
  Pick<ComboBoxProps, 'data'>

export const ComboBoxVirtualizedList = forwardRef<HTMLDivElement, ComboBoxVirtualizedListProps>(
  function ListboxComponent(props: ComboBoxVirtualizedListProps, ref) {
    const { children, value, data, ...propsToForward } = props
    const itemData = Children.toArray(children)
    const itemCount = itemData.length

    const getHeight = () => {
      // recommended perf best practice
      if (itemCount > 8) {
        return 8 * (ITEM_HEIGHT + 4) - 4 // Last item does not have 4px margin-bottom
      }
      return itemData.length * (ITEM_HEIGHT + 4) - 4 // Last item does not have 4px margin-bottom
    }

    // reset the `VariableSizeList` cache if data gets updated
    const gridRef = useResetCache(itemCount)

    // when value gets updated, ensure we tell <VariableSizeList>
    //  to scroll to the selected option
    useEffect(
      () => {
        if (gridRef && value && gridRef.current) {
          const valueIndex = data.findIndex((option) => option.value === value)

          if (valueIndex) {
            gridRef.current?.scrollToItem(valueIndex, 'smart')
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [value]
    )

    return (
      <Container ref={ref}>
        <OuterElementContext.Provider value={propsToForward}>
          <StyledVariableSizeList
            itemData={itemData}
            height={getHeight()}
            width="100%"
            ref={gridRef}
            outerElementType={OuterElementType}
            innerElementType="div"
            itemSize={(index) => (index === itemCount - 1 ? ITEM_HEIGHT : ITEM_HEIGHT + 4)}
            overscanCount={5}
            itemCount={itemCount}
          >
            {renderRow}
          </StyledVariableSizeList>
        </OuterElementContext.Provider>
      </Container>
    )
  }
)

const StyledVariableSizeList = styled(VariableSizeList)`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

const Container = styled.div`
  max-height: inherit;

  .MuiAutocomplete-listbox {
    max-height: inherit;
  }
`
