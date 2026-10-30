import {
  columnPinningFeature,
  createExpandedRowModel,
  createTableHook,
  Row,
  RowData,
  rowExpandingFeature,
  Table,
  tableFeatures,
} from '@tanstack/react-table'

import { DataTableAlign } from './DataTablePrimitives'

export type DataTableColumnMeta = {
  align?: DataTableAlign
  shrink?: boolean
  className?: string
}

export const dataTableFeatures = tableFeatures({
  rowExpandingFeature,
  columnPinningFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta: {} as DataTableColumnMeta,
})

type DataTableFeatures = typeof dataTableFeatures

export type DataTableInstance<TData extends RowData> = Table<DataTableFeatures, TData>
export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>

export const { useAppTable: useDataTable, createAppColumnHelper: createDataTableColumnHelper } =
  createTableHook({ features: dataTableFeatures })
