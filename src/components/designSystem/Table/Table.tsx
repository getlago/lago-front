import {
  Table as MUITable,
  TableBody as MUITableBody,
  TableCell as MUITableCell,
  TableContainer as MUITableContainer,
  TableHead as MUITableHead,
  TableRow as MUITableRow,
} from '@mui/material'
import { ReactNode } from 'react'
import styled from 'styled-components'

import { Button, ButtonProps, Popper, Skeleton, Typography } from '~/components/designSystem'
import { MenuPopper, theme } from '~/styles'

type ContainerSize = 'sm' | 'md' | 'lg'

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

export const Table = <T,>({
  name,
  data,
  columns,
  isLoading = false,
  isFullWidth = true,
  containerSize = 'lg',
  onRowAction,
  actionColumn,
}: TableProps<T>) => {
  const maxSpaceColumns = countMaxSpaceColumns(columns)

  return (
    <MUITableContainer>
      <StyledTable $isFullWidth={!!isFullWidth} $containerSize={getContainerSize(containerSize)}>
        <TableHead>
          <TableRow>
            <>
              {columns.map((column, i) => (
                <TableCell
                  key={`table-display-${name}-head-${i}`}
                  align={column.textAlign || 'left'}
                  $maxSpace={column.maxSpace ? 100 / maxSpaceColumns : undefined}
                >
                  <TableInnerCell>{column.title}</TableInnerCell>
                </TableCell>
              ))}
              {actionColumn && <TableActionCell />}
            </>
          </TableRow>
        </TableHead>

        <MUITableBody>
          {isLoading ? (
            <TableRow>
              <TableCell>
                <Skeleton variant="text" width={300} />
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, i) => (
              <TableRow
                $isClickable={!!onRowAction}
                key={`table-display-${name}-row-${i}`}
                onClick={(e) => {
                  const popperElement = document.querySelector(
                    `[data-id=table-display-${name}-popper]`,
                  )

                  if (popperElement) return

                  if (e.target instanceof HTMLElement) {
                    const actionColumnButton = e.target.closest('button')?.dataset.id

                    if (actionColumnButton !== ACTION_COLUMN_ID) {
                      onRowAction?.(item)
                    }
                  }
                }}
              >
                {columns.map((column, j) => (
                  <TableCell
                    key={`table-display-${name}-cell-${i}-${j}`}
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
                {actionColumn && (
                  <TableActionCell>
                    <TableInnerCell>
                      <Popper
                        popperGroupName={`table-display-${name}-cta`}
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
                          <MenuPopper data-id={`table-display-${name}-popper`}>
                            {actionColumn.map((action) => (
                              <Button
                                fullWidth
                                key={`table-display-${name}-action-${i}`}
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
            ))
          )}
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
