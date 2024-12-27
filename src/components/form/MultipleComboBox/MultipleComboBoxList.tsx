import _groupBy from 'lodash/groupBy'
import { Children, ForwardedRef, forwardRef, ReactElement, ReactNode, useMemo } from 'react'

import { Typography } from '~/components/designSystem'
import { tw } from '~/styles/utils'

import {
  MULTIPLE_GROUP_ITEM_KEY,
  MultipleComboBoxVirtualizedList,
} from './MultipleComboBoxVirtualizedList'
import { MultipleComboBoxData, MultipleComboBoxProps } from './types'

import { ComboboxListItem } from '../ComboBox/ComboboxList'

const randomKey = Math.round(Math.random() * 100000)

interface MultipleComboBoxVirtualizedListProps
  extends Pick<MultipleComboBoxProps, 'value' | 'renderGroupHeader' | 'virtualized'> {
  children: ReactNode
}

export const MultipleComboBoxList = forwardRef(
  (
    {
      value,
      children,
      virtualized,
      renderGroupHeader,
      ...propsToForward
    }: MultipleComboBoxVirtualizedListProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const isGrouped = !!(children as { props: { option: MultipleComboBoxData } }[])[0]?.props
      ?.option?.group

    const htmlItems = useMemo(() => {
      if (!isGrouped) {
        return Children.toArray(
          (children as ReactElement[]).map((item, i) => (
            <ComboboxListItem
              key={`multipleComboBox-list-item-${randomKey}-${i}`}
              {...propsToForward}
            >
              {item}
            </ComboboxListItem>
          )),
        )
      }

      /**
       * If items are grouped (ie !!item.group)
       * Construct an array with headers followed by there respective items
       */
      const groupedBy = _groupBy(
        children as { props: { option: MultipleComboBoxData } }[],
        (child) => child.props.option.group,
      )

      return Children.toArray(
        Object.keys(groupedBy)
          .sort((a, b) => a.localeCompare(b))
          .reduce<ReactNode[]>((acc, key, i) => {
            return [
              ...acc,
              isGrouped
                ? [
                    // If renderGroupHeader is provided, render the html, otherewise simply render the items
                    <div
                      key={`${MULTIPLE_GROUP_ITEM_KEY}-${key}`}
                      data-type={MULTIPLE_GROUP_ITEM_KEY}
                      className={tw(
                        'mx-0 my-1 flex h-11 w-[inherit] items-center bg-grey-100 px-6 py-0 shadow-[0px_-1px_0px_0px_#D9DEE7_inset,0px_-1px_0px_0px_#D9DEE7]',
                        {
                          '!mt-0': i === 0,
                          'mb-1': virtualized,
                          'sticky top-0 z-toast': !virtualized,
                        },
                      )}
                    >
                      {(!!renderGroupHeader && (renderGroupHeader[key] as ReactNode)) || (
                        <Typography noWrap>{key}</Typography>
                      )}
                    </div>,
                  ]
                : [],
              ...(groupedBy[key] as ReactElement[]).map((item, j) => (
                <ComboboxListItem
                  key={`multipleComboBox-list-item-${randomKey}-${i}-${j}`}
                  className={tw({
                    'mt-1': i === 0 && !isGrouped,
                  })}
                  {...propsToForward}
                >
                  {item}
                </ComboboxListItem>
              )),
            ]
          }, []),
      )
    }, [isGrouped, renderGroupHeader, children, propsToForward, virtualized])

    return (
      <div
        className={tw('relative max-h-[inherit] overflow-auto pb-0', {
          'overflow-hidden': virtualized,
        })}
        ref={ref}
        role="listbox"
      >
        {virtualized ? (
          <MultipleComboBoxVirtualizedList value={value} elements={htmlItems as ReactElement[]} />
        ) : (
          htmlItems
        )}
      </div>
    )
  },
)

MultipleComboBoxList.displayName = 'MultipleComboBoxList'
