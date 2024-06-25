import _groupBy from 'lodash/groupBy'
import { Children, ForwardedRef, forwardRef, ReactElement, ReactNode, useMemo } from 'react'
import styled, { css } from 'styled-components'

import { Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import {
  ComboBoxVirtualizedList,
  GROUP_HEADER_HEIGHT,
  GROUP_ITEM_KEY,
} from './ComboBoxVirtualizedList'
import { ComboBoxData, ComboBoxProps } from './types'

const randomKey = Math.round(Math.random() * 100000)

interface ComboBoxVirtualizedListProps
  extends Pick<ComboBoxProps, 'value' | 'renderGroupHeader' | 'virtualized'> {
  children: ReactNode
}

export const ComboboxList = forwardRef(
  (
    {
      value,
      children,
      virtualized,
      renderGroupHeader,
      ...propsToForward
    }: ComboBoxVirtualizedListProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const isGrouped = !!(children as { props: { option: ComboBoxData } }[])[0]?.props?.option?.group

    const htmlItems = useMemo(() => {
      if (!isGrouped) {
        return Children.toArray(
          (children as ReactElement[]).map((item, i) => (
            <Item key={`combobox-list-item-${randomKey}-${i}`} {...propsToForward}>
              {item}
            </Item>
          )),
        )
      }

      /**
       * If items are grouped (ie !!item.group)
       * Construct an array with headers followed by there respective items
       */
      const groupedBy = _groupBy(
        children as { props: { option: ComboBoxData } }[],
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
                    // If renderGroupHeader is provided, render the html, otherewise simply render the key
                    <GroupHeader
                      key={`${GROUP_ITEM_KEY}-${key}`}
                      $isFirst={i === 0}
                      $virtualized={virtualized}
                    >
                      {(!!renderGroupHeader && (renderGroupHeader[key] as ReactNode)) || (
                        <Typography noWrap>{key}</Typography>
                      )}
                    </GroupHeader>,
                  ]
                : [],
              ...(groupedBy[key] as ReactElement[]).map((item, j) => (
                <Item key={`combobox-list-item-${randomKey}-${i}-${j}`} {...propsToForward}>
                  {item}
                </Item>
              )),
            ]
          }, []),
      )
    }, [isGrouped, renderGroupHeader, children, propsToForward, virtualized])

    return (
      <Container ref={ref} role="listbox" $virtualized={virtualized}>
        {virtualized ? (
          <ComboBoxVirtualizedList value={value} elements={htmlItems as ReactElement[]} />
        ) : (
          htmlItems
        )}
      </Container>
    )
  },
)

ComboboxList.displayName = 'ComboboxList'

const Item = styled.div``

const Container = styled.div<{ $virtualized?: boolean }>`
  max-height: inherit;
  position: relative;
  padding-bottom: 0;
  box-sizing: border-box;
  overflow: ${({ $virtualized }) => ($virtualized ? 'hidden' : 'auto')};

  .MuiAutocomplete-listbox {
    max-height: inherit;
  }

  ${Item}:not(:last-child) {
    margin: ${({ $virtualized }) =>
      $virtualized ? `0 ${theme.spacing(2)}` : `0 0 ${theme.spacing(1)}`};
  }
`

const GroupHeader = styled.div<{ $isFirst?: boolean; $virtualized?: boolean }>`
  height: ${GROUP_HEADER_HEIGHT}px;
  display: flex;
  width: inherit;
  align-items: center;
  padding: 0 ${theme.spacing(6)};
  background-color: ${theme.palette.grey[100]};
  box-sizing: border-box;
  box-shadow:
    ${theme.shadows[7]},
    0px -1px 0px 0px ${theme.palette.divider};

  ${({ $virtualized, $isFirst }) =>
    !$virtualized
      ? css`
          z-index: ${theme.zIndex.dialog + 2};
          position: sticky;
          top: 0;
          margin: ${$isFirst ? 0 : theme.spacing(2)} 0 ${theme.spacing(2)};
        `
      : css`
          margin: ${$isFirst ? 0 : theme.spacing(1)} 0 ${theme.spacing(2)};
        `};
`
