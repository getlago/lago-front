import {
  Table as MUITable,
  TableBody as MUITableBody,
  TableCell as MUITableCell,
  TableContainer as MUITableContainer,
  TableHead as MUITableHead,
  TableRow as MUITableRow,
  Skeleton,
} from '@mui/material'
import { ReactNode } from 'react'
import styled from 'styled-components'

import { ListClickableItemCss, theme } from '~/styles'

type Column<T> = {
  key: keyof T
  title: string | ReactNode
  content: (item: T) => ReactNode
  size?: number
}

interface TableDisplayProps<T> {
  key: string
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  variant?: 'outline'
  onRowAction?: (item: T) => void
}

export const TableDisplay = <T,>({
  key,
  data,
  columns,
  isLoading,
  onRowAction,
}: TableDisplayProps<T>) => {
  return (
    <TableContainer>
      <MUITable>
        <TableHead>
          <TableRow>
            {isLoading ? (
              <TableCell>
                <Skeleton variant="text" width={300} />
              </TableCell>
            ) : (
              columns.map((column, i) => (
                <TableCell key={`table-display-${key}-head-${i}`}>{column.title}</TableCell>
              ))
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
                key={`table-display-${key}-row-${i}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRowAction?.(item)
                }}
              >
                {columns.map((column, j) => (
                  <TableCell key={`table-display-${key}-cell-${i}-${j}`}>
                    {column.content(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </MUITableBody>
      </MUITable>
    </TableContainer>
  )
}

const TableContainer = styled(MUITableContainer)`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: ${theme.shape.borderRadius}px;
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

const TableCell = styled(MUITableCell)`
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
`
