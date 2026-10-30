import { flexRender, RowData } from '@tanstack/react-table'
import { ReactNode } from 'react'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography, TypographyProps } from '~/components/designSystem/Typography'

import { DataTableRoot, DataTableTd, DataTableTh } from './DataTablePrimitives'
import { DataTableInstance, DataTableRow } from './useDataTable'

const DEFAULT_LOADING_ROW_COUNT = 3

const renderText = (
  content: ReactNode,
  variant: TypographyProps['variant'],
  color: TypographyProps['color'],
): ReactNode => {
  if (typeof content !== 'string' && typeof content !== 'number') return content

  return (
    <Typography variant={variant} color={color} noWrap>
      {content}
    </Typography>
  )
}

type DataTableViewProps<TData extends RowData> = {
  table: DataTableInstance<TData>
  isLoading?: boolean
  loadingRowCount?: number
  hasFooter?: boolean
  getRowDataTest?: (row: DataTableRow<TData>) => string | undefined
  footerDataTest?: string
  'data-test'?: string
}

export const DataTableView = <TData extends RowData>({
  table,
  isLoading = false,
  loadingRowCount = DEFAULT_LOADING_ROW_COUNT,
  hasFooter = false,
  getRowDataTest,
  footerDataTest,
  'data-test': dataTest,
}: DataTableViewProps<TData>): JSX.Element => {
  const leafColumns = table.getAllLeafColumns()

  const renderBody = (): ReactNode => {
    if (isLoading) {
      return Array.from({ length: loadingRowCount }, (_, index) => (
        <tr key={`loading-${index}`}>
          {leafColumns.map((column) => (
            <DataTableTd
              key={column.id}
              pinned={column.getIsPinned()}
              align={column.columnDef.meta?.align}
              shrink={column.columnDef.meta?.shrink}
              className={column.columnDef.meta?.className}
            >
              <Skeleton
                variant="text"
                className={column.getIsPinned() === 'start' ? 'w-40' : 'ml-auto w-16'}
              />
            </DataTableTd>
          ))}
        </tr>
      ))
    }

    return table.getRowModel().rows.map((row) => (
      <tr key={row.id} data-test={getRowDataTest?.(row)}>
        {row.getAllCells().map((cell) => (
          <DataTableTd
            key={cell.id}
            pinned={cell.column.getIsPinned()}
            align={cell.column.columnDef.meta?.align}
            shrink={cell.column.columnDef.meta?.shrink}
            className={cell.column.columnDef.meta?.className}
          >
            {renderText(
              flexRender(cell.column.columnDef.cell, cell.getContext()),
              'body',
              'grey700',
            )}
          </DataTableTd>
        ))}
      </tr>
    ))
  }

  const renderFooter = (): ReactNode => {
    if (!hasFooter || isLoading) return null

    const [leafFooterGroup] = table.getFooterGroups()

    return (
      <tfoot>
        <tr data-test={footerDataTest}>
          {leafFooterGroup.headers.map((footer) => (
            <DataTableTd
              key={footer.id}
              tone="muted"
              pinned={footer.column.getIsPinned()}
              align={footer.column.columnDef.meta?.align}
              shrink={footer.column.columnDef.meta?.shrink}
              className={footer.column.columnDef.meta?.className}
            >
              {renderText(
                flexRender(footer.column.columnDef.footer, footer.getContext()),
                'body',
                'grey700',
              )}
            </DataTableTd>
          ))}
        </tr>
      </tfoot>
    )
  }

  return (
    <DataTableRoot data-test={dataTest}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              if (header.rowSpan === 0) return null

              const isGroup = header.subHeaders.length > 0

              return (
                <DataTableTh
                  key={header.id}
                  colSpan={header.colSpan}
                  rowSpan={header.rowSpan}
                  pinned={header.column.getIsPinned()}
                  align={isGroup ? 'left' : header.column.columnDef.meta?.align}
                  shrink={!isGroup && header.column.columnDef.meta?.shrink}
                  className={isGroup ? undefined : header.column.columnDef.meta?.className}
                >
                  {renderText(
                    flexRender(header.column.columnDef.header, header.getContext()),
                    'captionHl',
                    'grey600',
                  )}
                </DataTableTh>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody>{renderBody()}</tbody>
      {renderFooter()}
    </DataTableRoot>
  )
}
