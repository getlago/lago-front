import {
  cellSpanningFeature,
  Column,
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
  cellSpanningFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta: {} as DataTableColumnMeta,
})

type DataTableFeatures = typeof dataTableFeatures

export type DataTableInstance<TData extends RowData> = Table<DataTableFeatures, TData>
export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>
export type DataTableColumn<TData extends RowData> = Column<DataTableFeatures, TData, unknown>

export const { useAppTable: useDataTable, createAppColumnHelper: createDataTableColumnHelper } =
  createTableHook({
    features: dataTableFeatures,
    // TanStack resets `expanded` on every data change; lazy children are a data change.
    autoResetExpanded: false,
  })
