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

import { ComposableTableAlign } from './ComposableTablePrimitives'

export type ComposableTableColumnMeta = {
  align?: ComposableTableAlign
  shrink?: boolean
  className?: string
}

export const composableTableFeatures = tableFeatures({
  rowExpandingFeature,
  columnPinningFeature,
  cellSpanningFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta: {} as ComposableTableColumnMeta,
})

type ComposableTableFeatures = typeof composableTableFeatures

export type ComposableTableInstance<TData extends RowData> = Table<ComposableTableFeatures, TData>
export type ComposableTableRow<TData extends RowData> = Row<ComposableTableFeatures, TData>
export type ComposableTableColumn<TData extends RowData> = Column<
  ComposableTableFeatures,
  TData,
  unknown
>

export const {
  useAppTable: useComposableTable,
  createAppColumnHelper: createComposableTableColumnHelper,
} = createTableHook({
  features: composableTableFeatures,
  // TanStack resets `expanded` on every data change; lazy children are a data change.
  autoResetExpanded: false,
})
