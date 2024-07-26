import {
  Table as MUITable,
  TableBody as MUITableBody,
  TableCell as MUITableCell,
  TableContainer as MUITableContainer,
  TableHead as MUITableHead,
  TableRow as MUITableRow,
} from '@mui/material'
import { MouseEvent, ReactNode, useRef } from 'react'
import styled from 'styled-components'

import { Button, ButtonProps, Popper, Skeleton, Typography } from '~/components/designSystem'
import { GenericPlaceholder, GenericPlaceholderProps } from '~/components/GenericPlaceholder'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, theme } from '~/styles'

type ContainerSize = 'sm' | 'md' | 'lg'

type DataItem = {
  id: string
}

type Column<T> = {
  key: keyof T
  title: string | ReactNode
  content: (item: T) => ReactNode
  textAlign?: 'left' | 'center' | 'right'
  maxSpace?: boolean
  minWidth?: number
}

interface TableProps<T> {
  name: string
  data: T[]
  columns: Column<T>[]
  isFullWidth?: boolean
  isLoading?: boolean
  hasError?: boolean
  placeholder?: {
    emptyState?: Partial<GenericPlaceholderProps>
    errorState?: Partial<GenericPlaceholderProps>
  }
  onRowAction?: (item: T) => void
  actionColumn?: Array<{
    title: string | ReactNode
    startIcon?: ButtonProps['startIcon']
    onAction: (item: T) => void
  }>
  /**
   * 'sm' = 4px ; 'md' = 16px ; 'lg' = 48px
   * @default 'lg'
   * */
  containerSize?: ContainerSize
}

const ACTION_COLUMN_ID = 'actionColumn'
const ROW_MIN_HEIGHT = 56
const LOADING_ROW_COUNT = 3

const getContainerSize = (containerSize: ContainerSize) => {
  switch (containerSize) {
    case 'sm':
      return 4
    case 'md':
      return 16
    case 'lg':
      return 48
  }
}

const countMaxSpaceColumns = <T,>(columns: Column<T>[]) =>
  columns.reduce((acc, column) => {
    if (column.maxSpace) {
      acc += 1
    }

    return acc
  }, 0)

export const Table = <T extends DataItem>({
  name,
  data,
  columns,
  isLoading,
  hasError,
  isFullWidth = true,
  containerSize = 'lg',
  placeholder,
  onRowAction,
  actionColumn,
}: TableProps<T>) => {
  const TABLE_ID = `table-${name}`
  const maxSpaceColumns = countMaxSpaceColumns(columns)
  const tableRef = useRef<HTMLTableElement>(null)
  const { translate } = useInternationalization()

  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `${TABLE_ID}-row-${i}`,
    navigate: (id) => {
      const item = data.find((dataItem) => dataItem.id === id)

      if (item) {
        onRowAction?.(item)
      }
    },
  })

  const isClickable = !!onRowAction && !isLoading
  const shouldDisplayActionColumn = !!actionColumn && actionColumn.length > 0
  const isEmpty = !isLoading && data.length === 0
  const colSpan = columns.length + (actionColumn ? 1 : 0)

  const handleRowClick = (e: MouseEvent<HTMLTableRowElement>, item: T) => {
    // Prevent row action when clicking on button or link in cell
    if (e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement) {
      return
    }

    // Prevent row action when clicking on action column button
    const popper = tableRef.current?.querySelector(`[data-id=${TABLE_ID}-popper]`)

    if (popper) {
      return
    }

    if (e.target instanceof HTMLElement) {
      const actionColumnButton = e.target.closest('button')?.dataset.id

      if (actionColumnButton !== ACTION_COLUMN_ID) {
        onRowAction?.(item)
      }
    }
  }

  const renderPlaceholder = () => {
    if (isLoading) {
      return Array.from({ length: LOADING_ROW_COUNT }).map((_, i) => (
        <TableRow key={`${TABLE_ID}-loading-row-${i}`}>
          {columns.map((col, j) => (
            <TableCell key={`${TABLE_ID}-loading-cell-${i}-${j}`}>
              <TableInnerCell $minWidth={col.minWidth}>
                <Skeleton variant="text" width="100%" />
              </TableInnerCell>
            </TableCell>
          ))}
          {shouldDisplayActionColumn && (
            <TableActionCell>
              <TableInnerCell>
                <Button disabled icon="dots-horizontal" variant="quaternary" />
              </TableInnerCell>
            </TableActionCell>
          )}
        </TableRow>
      ))
    }

    if (hasError) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan}>
            <StyledGenericPlaceholder
              noMargins
              title={placeholder?.errorState?.title || translate('text_62b31e1f6a5b8b1b745ece48')}
              subtitle={
                placeholder?.errorState?.subtitle || translate('text_62bb102b66ff57dbfe7905c2')
              }
              image={placeholder?.errorState?.image || <ErrorImage />}
              buttonAction={placeholder?.errorState?.buttonAction}
              buttonTitle={placeholder?.errorState?.buttonTitle}
              buttonVariant={placeholder?.errorState?.buttonVariant}
            />
          </TableCell>
        </TableRow>
      )
    }

    if (isEmpty) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan}>
            <StyledGenericPlaceholder
              noMargins
              title={placeholder?.emptyState?.title || translate('text_62b31e1f6a5b8b1b745ece48')}
              subtitle={
                placeholder?.emptyState?.subtitle || translate('text_62bb102b66ff57dbfe7905c2')
              }
              image={placeholder?.emptyState?.image || <EmptyImage />}
              buttonAction={placeholder?.emptyState?.buttonAction}
              buttonTitle={placeholder?.emptyState?.buttonTitle}
              buttonVariant={placeholder?.emptyState?.buttonVariant}
            />
          </TableCell>
        </TableRow>
      )
    }
  }

  return (
    <MUITableContainer>
      <StyledTable
        ref={tableRef}
        $isFullWidth={!!isFullWidth}
        $containerSize={getContainerSize(containerSize)}
      >
        <TableHead>
          <TableRow>
            <>
              {columns.map((column, i) => (
                <TableCell
                  key={`${TABLE_ID}-head-${i}`}
                  align={column.textAlign || 'left'}
                  $maxSpace={column.maxSpace ? 100 / maxSpaceColumns : undefined}
                >
                  <TableInnerCell>{column.title}</TableInnerCell>
                </TableCell>
              ))}
              {shouldDisplayActionColumn && <TableActionCell />}
            </>
          </TableRow>
        </TableHead>

        <MUITableBody>
          {renderPlaceholder() ??
            data.map((item, i) => (
              <TableRow
                key={`${TABLE_ID}-row-${i}`}
                id={`${TABLE_ID}-row-${i}`}
                data-id={item.id}
                $isClickable={isClickable}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? onKeyDown : undefined}
                onClick={isClickable ? (e) => handleRowClick(e, item) : undefined}
              >
                {columns.map((column, j) => (
                  <TableCell
                    key={`${TABLE_ID}-cell-${i}-${j}`}
                    align={column.textAlign || 'left'}
                    $maxSpace={column.maxSpace ? 100 / maxSpaceColumns : undefined}
                  >
                    <TableInnerCell $minWidth={column.minWidth}>
                      <Typography color="textSecondary" noWrap>
                        {column.content(item)}
                      </Typography>
                    </TableInnerCell>
                  </TableCell>
                ))}
                {shouldDisplayActionColumn && (
                  <TableActionCell>
                    <TableInnerCell>
                      <Popper
                        popperGroupName={`${TABLE_ID}-action-cell`}
                        PopperProps={{ placement: 'bottom-end' }}
                        opener={
                          <Button
                            data-id={ACTION_COLUMN_ID}
                            icon="dots-horizontal"
                            variant="quaternary"
                          />
                        }
                      >
                        {({ closePopper }) => (
                          <MenuPopper data-id={`${TABLE_ID}-popper`}>
                            {actionColumn.map((action, j) => (
                              <Button
                                fullWidth
                                key={`${TABLE_ID}-action-${i}-${j}`}
                                startIcon={action.startIcon}
                                variant="quaternary"
                                align="left"
                                onClick={async () => {
                                  await action.onAction(item)
                                  closePopper()
                                }}
                              >
                                {action.title}
                              </Button>
                            ))}
                          </MenuPopper>
                        )}
                      </Popper>
                    </TableInnerCell>
                  </TableActionCell>
                )}
              </TableRow>
            ))}
        </MUITableBody>
      </StyledTable>
    </MUITableContainer>
  )
}

const TableInnerCell = styled.div<{ $minWidth?: number }>`
  min-height: ${ROW_MIN_HEIGHT}px;
  min-width: ${({ $minWidth }) => ($minWidth ? `${$minWidth}px` : 'auto')};
  display: flex;
  align-items: center;
`

const StyledGenericPlaceholder = styled(GenericPlaceholder)`
  margin: 0 auto;
  padding: ${theme.spacing(12)} 0;

  svg {
    width: 136px;
  }
`

const TableCell = styled(MUITableCell)<{
  $isBlurred?: boolean
  $maxSpace?: number
}>`
  width: ${({ $maxSpace }) => ($maxSpace ? `${$maxSpace}%` : 'auto')};
  padding: 0;
  box-sizing: border-box;
  white-space: nowrap;
  border-bottom: 1px solid ${theme.palette.grey[300]};

  ${TableInnerCell} {
    padding-left: ${theme.spacing(3)};
    padding-right: ${theme.spacing(5)};
  }

  &:first-of-type ${TableInnerCell} {
    padding-left: 0;
  }

  &:last-of-type ${TableInnerCell} {
    padding-right: 0;
  }

  :has(${StyledGenericPlaceholder}) {
    border-bottom: none;
  }
`

const StyledTable = styled(MUITable)<{
  $isFullWidth: boolean
  $containerSize: number
}>`
  border-collapse: collapse;
  width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'auto')};

  ${TableCell}:first-of-type ${TableInnerCell} {
    padding-left: ${({ $containerSize }) => `${$containerSize}px`};
  }

  ${TableCell}:last-of-type ${TableInnerCell} {
    padding-right: ${({ $containerSize }) => `${$containerSize}px`};
  }
`

const TableHead = styled(MUITableHead)`
  ${TableInnerCell} {
    font-size: ${theme.typography.captionHl.fontSize};
    font-weight: ${theme.typography.captionHl.fontWeight};
    line-height: ${theme.typography.captionHl.lineHeight};
    color: ${theme.palette.grey[600]};
    min-height: 40px;
  }
`

const TableActionCell = styled(TableCell)`
  width: 40px;
  position: sticky;
  right: 0;
  z-index: 1;
  animation-name: shadow;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-timeline: scroll(inline);

  ${TableInnerCell} {
    justify-content: center;
    padding-left: ${theme.spacing(3)};
  }

  @keyframes shadow {
    0% {
      box-shadow: ${theme.shadows[8]};
      background-color: ${theme.palette.background.paper};
    }

    90% {
      box-shadow: ${theme.shadows[8]};
      background-color: ${theme.palette.background.paper};
    }

    99% {
      box-shadow: none;
      background-color: transparent;
    }
  }
`

const TableRow = styled(MUITableRow)<{ $isClickable?: boolean }>`
  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'initial')};

  &:hover:not(:active),
  &:focus:not(:active),
  &:hover:not(:active) ${TableActionCell}, &:focus:not(:active) ${TableActionCell} {
    background-color: ${({ $isClickable }) =>
      $isClickable ? `${theme.palette.grey[100]} !important` : 'unset'};
  }

  &:active,
  &:active ${TableActionCell} {
    background-color: ${({ $isClickable }) =>
      $isClickable ? `${theme.palette.grey[200]} !important` : 'unset'};
  }

  // Remove hover effect when action column is hovered
  &:has([data-id='${ACTION_COLUMN_ID}']:hover) {
    background-color: unset !important;

    ${TableActionCell} {
      background-color: ${theme.palette.background.paper} !important;
    }
  }
`
