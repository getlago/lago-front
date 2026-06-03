import MUITable from '@mui/material/Table'
import MUITableBody from '@mui/material/TableBody'
import MUITableCell from '@mui/material/TableCell'
import MUITableHead from '@mui/material/TableHead'
import MUITableRow from '@mui/material/TableRow'
import { ReactNode } from 'react'

import { theme } from '~/styles'
import { tw } from '~/styles/utils'

import TableInnerCell from './TableInnerCell'
import type { Align } from './types'

export type PreviewTableColumn<T> = {
  key: string
  title: string | ReactNode
  content: (item: T, index: number) => ReactNode
  textAlign?: Align
  maxSpace?: boolean
}

export interface PreviewTableProps<T> {
  name: string
  data: T[]
  columns: PreviewTableColumn<T>[]
  containerClassName?: string
  footer?: ReactNode
}

const countMaxSpaceColumns = <T,>(columns: PreviewTableColumn<T>[]) =>
  columns.reduce((acc, column) => (column.maxSpace ? acc + 1 : acc), 0)

export const PreviewTable = <T,>({
  name,
  data,
  columns,
  containerClassName,
  footer,
}: PreviewTableProps<T>) => {
  const TABLE_ID = `preview-table-${name}`
  const maxSpaceColumns = countMaxSpaceColumns(columns)

  return (
    <div className={tw('w-0 min-w-full overflow-auto', containerClassName)}>
      <MUITable
        className="border-separate"
        data-test={TABLE_ID}
        sx={{
          '& .lago-table-cell:first-of-type .lago-table-inner-cell': {
            paddingLeft: 0,
          },
          '& .lago-table-cell:last-of-type .lago-table-inner-cell': {
            paddingRight: 0,
          },
        }}
      >
        <MUITableHead>
          <tr>
            {columns.map((column, i) => (
              <MUITableCell
                className={tw('lago-table-cell', 'w-auto whitespace-nowrap p-0')}
                key={`${TABLE_ID}-head-${i}`}
                align={column.textAlign || 'left'}
                style={{
                  width:
                    column.maxSpace && maxSpaceColumns > 0
                      ? `${100 / maxSpaceColumns}%`
                      : 'auto',
                  borderBottom: `1px solid ${theme.palette.grey[300]}`,
                }}
                sx={{
                  '& > div': { paddingRight: '32px' },
                  '&:first-of-type > div': { paddingLeft: 0 },
                  '&:last-of-type > div': { paddingRight: 0 },
                }}
              >
                <TableInnerCell
                  className="min-h-10 text-grey-600"
                  align={column.textAlign}
                  style={{
                    fontSize: theme.typography.captionHl.fontSize,
                    fontWeight: theme.typography.captionHl.fontWeight,
                    lineHeight: theme.typography.captionHl.lineHeight,
                  }}
                >
                  {column.title}
                </TableInnerCell>
              </MUITableCell>
            ))}
          </tr>
        </MUITableHead>

        <MUITableBody>
          {data.map((item, i) => (
            <MUITableRow key={`${TABLE_ID}-row-${i}`} data-test={`${TABLE_ID}-row-${i}`}>
              {columns.map((column, j) => (
                <MUITableCell
                  className={tw('lago-table-cell', 'w-auto whitespace-nowrap p-0')}
                  key={`${TABLE_ID}-cell-${i}-${j}`}
                  align={column.textAlign || 'left'}
                  style={{
                    width:
                      column.maxSpace && maxSpaceColumns > 0
                        ? `${100 / maxSpaceColumns}%`
                        : 'auto',
                    borderBottom: `1px solid ${theme.palette.grey[300]}`,
                  }}
                  sx={{
                    '& > div': { paddingRight: '32px' },
                    '&:first-of-type > div': { paddingLeft: 0 },
                    '&:last-of-type > div': { paddingRight: 0 },
                  }}
                >
                  <TableInnerCell align={column.textAlign}>
                    {column.content(item, i)}
                  </TableInnerCell>
                </MUITableCell>
              ))}
            </MUITableRow>
          ))}
        </MUITableBody>
      </MUITable>
      {footer}
    </div>
  )
}
