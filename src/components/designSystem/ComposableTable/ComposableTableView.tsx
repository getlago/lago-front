import { flexRender, RowData } from '@tanstack/react-table'
import { ReactNode } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography, TypographyProps } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

import {
  ComposableTableCellVariants,
  ComposableTableRoot,
  ComposableTableTd,
  ComposableTableTh,
  ComposableTableTone,
} from './ComposableTablePrimitives'
import {
  ComposableTableColumn,
  ComposableTableInstance,
  ComposableTableRow,
} from './useComposableTable'

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

const getColumnVariants = <TData extends RowData>(
  column: ComposableTableColumn<TData>,
): ComposableTableCellVariants & { className?: string } => ({
  pinned: column.getIsPinned(),
  align: column.columnDef.meta?.align,
  shrink: column.columnDef.meta?.shrink,
  className: column.columnDef.meta?.className,
})

export type ComposableTableFooterRow = {
  id: string
  cells: Partial<Record<string, ReactNode>>
}

type ComposableTableViewProps<TData extends RowData> = {
  table: ComposableTableInstance<TData>
  isLoading?: boolean
  loadingRowCount?: number
  hasError?: boolean
  placeholder?: TablePlaceholder
  hasFooter?: boolean
  footerRows?: ComposableTableFooterRow[]
  getRowTone?: (row: ComposableTableRow<TData>) => ComposableTableTone
  getRowDataTest?: (row: ComposableTableRow<TData>) => string | undefined
  footerDataTest?: string
  'data-test'?: string
}

export const ComposableTableView = <TData extends RowData>({
  table,
  isLoading = false,
  loadingRowCount = DEFAULT_LOADING_ROW_COUNT,
  hasError = false,
  placeholder,
  hasFooter = false,
  footerRows,
  getRowTone,
  getRowDataTest,
  footerDataTest,
  'data-test': dataTest,
}: ComposableTableViewProps<TData>): JSX.Element => {
  const { translate } = useInternationalization()
  const leafColumns = table.getAllLeafColumns()
  const rows = table.getRowModel().rows

  const renderPlaceholder = (): ReactNode => {
    const state = hasError ? placeholder?.errorState : placeholder?.emptyState

    return (
      <tr>
        <td colSpan={leafColumns.length}>
          <GenericPlaceholder
            noMargins
            className="mx-auto py-12 [&>svg]:w-[136px]"
            title={state?.title || translate('text_62b31e1f6a5b8b1b745ece48')}
            subtitle={state?.subtitle || translate('text_62bb102b66ff57dbfe7905c2')}
            image={state?.image || (hasError ? <ErrorImage /> : <EmptyImage />)}
            buttonAction={state?.buttonAction}
            buttonTitle={state?.buttonTitle}
            buttonVariant={state?.buttonVariant}
          />
        </td>
      </tr>
    )
  }

  const renderBody = (): ReactNode => {
    if (isLoading) {
      return Array.from({ length: loadingRowCount }, (_, index) => (
        <tr key={`loading-${index}`}>
          {leafColumns.map((column) => (
            <ComposableTableTd key={column.id} {...getColumnVariants(column)}>
              <Skeleton
                variant="text"
                className={column.getIsPinned() === 'start' ? 'w-40' : 'ml-auto w-16'}
              />
            </ComposableTableTd>
          ))}
        </tr>
      ))
    }

    if (hasError || !rows.length) return renderPlaceholder()

    return rows.map((row) => (
      <tr key={row.id} data-test={getRowDataTest?.(row)}>
        {row.getAllCells().map((cell) => {
          if (cell.getIsCovered()) return null

          return (
            <ComposableTableTd
              key={cell.id}
              colSpan={cell.getColSpan()}
              tone={getRowTone?.(row)}
              {...getColumnVariants(cell.column)}
            >
              {renderText(
                flexRender(cell.column.columnDef.cell, cell.getContext()),
                'body',
                'grey700',
              )}
            </ComposableTableTd>
          )
        })}
      </tr>
    ))
  }

  const renderFooter = (): ReactNode => {
    if (isLoading || hasError || !rows.length) return null

    if (footerRows) {
      return (
        <tfoot data-test={footerDataTest}>
          {footerRows.map(({ id, cells }) => (
            <tr key={id}>
              {leafColumns.map((column) => (
                <ComposableTableTd key={column.id} tone="muted" {...getColumnVariants(column)}>
                  {renderText(cells[column.id], 'body', 'grey700')}
                </ComposableTableTd>
              ))}
            </tr>
          ))}
        </tfoot>
      )
    }

    if (!hasFooter) return null

    const [leafFooterGroup] = table.getFooterGroups()

    return (
      <tfoot>
        <tr data-test={footerDataTest}>
          {leafFooterGroup.headers.map((footer) => (
            <ComposableTableTd key={footer.id} tone="muted" {...getColumnVariants(footer.column)}>
              {renderText(
                flexRender(footer.column.columnDef.footer, footer.getContext()),
                'body',
                'grey700',
              )}
            </ComposableTableTd>
          ))}
        </tr>
      </tfoot>
    )
  }

  return (
    <ComposableTableRoot data-test={dataTest}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              if (header.rowSpan === 0) return null

              const isGroup = header.subHeaders.length > 0
              const variants = getColumnVariants(header.column)

              return (
                <ComposableTableTh
                  key={header.id}
                  colSpan={header.colSpan}
                  rowSpan={header.rowSpan}
                  pinned={variants.pinned}
                  align={isGroup ? 'left' : variants.align}
                  shrink={!isGroup && variants.shrink}
                  className={isGroup ? undefined : variants.className}
                >
                  {renderText(
                    flexRender(header.column.columnDef.header, header.getContext()),
                    'captionHl',
                    'grey600',
                  )}
                </ComposableTableTh>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody>{renderBody()}</tbody>
      {renderFooter()}
    </ComposableTableRoot>
  )
}
