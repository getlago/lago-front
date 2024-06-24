import {
  Table as MUITable,
  TableBody as MUITableBody,
  TableCell as MUITableCell,
  TableContainer as MUITableContainer,
  TableHead as MUITableHead,
  TableRow as MUITableRow,
} from '@mui/material'
import { ReactNode } from 'react'
import styled, { css } from 'styled-components'

import { Button, ButtonProps, Popper, Skeleton } from '~/components/designSystem'
import { ListClickableItemCss, MenuPopper, theme } from '~/styles'

type Variant = 'outline' | 'borderless'

type Column<T> = {
  key: keyof T
  title: string | ReactNode
  content: (item: T) => ReactNode
  size?: number
  textAlign?: 'left' | 'center' | 'right'
}

interface TableDisplayProps<T> {
  name: string
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  variant?: Variant
  onRowAction?: (item: T) => void
  isFullWidth?: boolean
  actionColumn?: Array<{
    title: string | ReactNode
    startIcon?: ButtonProps['startIcon']
    onAction: (item: T) => void
  }>
}

const ACTION_COLUMN_ID = 'actionColumn'

export const TableDisplay = <T,>({
  name,
  data,
  columns,
  variant = 'outline',
  isLoading,
  isFullWidth,
  onRowAction,
  actionColumn,
}: TableDisplayProps<T>) => {
  return (
    <TableContainer $isFullWidth={!!isFullWidth} $variant={variant}>
      <MUITable>
        <TableHead>
          <TableRow>
            {isLoading ? (
              <TableCell>
                <Skeleton variant="text" width={300} />
              </TableCell>
            ) : (
              <>
                {columns.map((column, i) => (
                  <TableCell
                    $size={column.size}
                    key={`table-display-${name}-head-${i}`}
                    align={column.textAlign || 'left'}
                  >
                    {column.title}
                  </TableCell>
                ))}
                <TableCell />
              </>
            )}
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
                    $size={column.size}
                    key={`table-display-${name}-cell-${i}-${j}`}
                    align={column.textAlign || 'left'}
                  >
                    {column.content(item)}
                  </TableCell>
                ))}
                {actionColumn && (
                  <TableCell>
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
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </MUITableBody>
      </MUITable>
    </TableContainer>
  )
}

const TableContainer = styled(MUITableContainer)<{
  $isFullWidth: boolean
  $variant: Variant
}>`
  ${({ $variant }) => {
    if ($variant === 'outline') {
      return css`
        border: 1px solid ${theme.palette.grey[400]};
        border-radius: ${theme.shape.borderRadius}px;
      `
    }

    if ($variant === 'borderless') {
      return css`
        thead {
          background-color: ${theme.palette.grey[100]};
        }
      `
    }

    return css``
  }}

  width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'auto')};
`

const TableHead = styled(MUITableHead)`
  &:not(:last-child) {
    > * {
      box-shadow: ${theme.shadows[7]};
    }
  }

  th {
    padding: 10px ${theme.spacing(4)};
    font-size: ${theme.typography.bodyHl.fontSize}px;
    font-weight: ${theme.typography.bodyHl.fontWeight};
    line-height: ${theme.typography.bodyHl.lineHeight};
    color: ${theme.palette.text.disabled};
  }
`

const TableCell = styled(MUITableCell)<{ $size?: number }>`
  width: ${({ $size }) => $size}px;
  box-sizing: border-box;
  font-family: ${theme.typography.fontFamily};
  color: ${theme.palette.text.secondary};
  font-size: ${theme.typography.body.fontSize}px;
  font-weight: ${theme.typography.body.fontWeight};
  line-height: ${theme.typography.body.lineHeight};
  border: 0;
`

const TableRow = styled(MUITableRow)<{ $isClickable?: boolean }>`
  &:not(:last-child) {
    > * {
      box-shadow: ${theme.shadows[7]};
    }
  }

  ${({ $isClickable }) => $isClickable && ListClickableItemCss}

  // Remove hover effect when action column is hovered
  &:has([data-id='${ACTION_COLUMN_ID}']:hover) {
    background-color: initial;
  }
`
