import { useComposableTable } from '~/components/designSystem/ComposableTable'

import { AttributionTableView } from './AttributionTableView'
import {
  ATTRIBUTION_COLUMN_PINNING,
  AttributionTableRow,
  AttributionTableRowModel,
  AttributionTableSharedProps,
  useAttributionTableColumns,
} from './useAttributionTableColumns'

export const ATTRIBUTION_TABLE_TEST_ID = 'attribution-flat-table'
export const ATTRIBUTION_TABLE_ROW_TEST_ID = 'attribution-flat-table-row'
export const ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID = 'attribution-load-more-rows'

type AttributionFlatTableProps = AttributionTableSharedProps & {
  rows: AttributionTableRow[]
  loadMore?: {
    isLoading: boolean
    isDisabled: boolean
    onLoadMore: () => void
  }
}

export const AttributionFlatTable = ({
  rows,
  loadMore,
  isLoading,
  ...columnsProps
}: AttributionFlatTableProps): JSX.Element => {
  const tableColumns = useAttributionTableColumns({
    ...columnsProps,
    loadMoreDataTest: ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID,
  })

  const toDataRow = (row: AttributionTableRow): AttributionTableRowModel => ({
    ...row,
    kind: 'data',
    expansion: { canExpand: false },
    subRows: [],
  })

  const loadMoreRows: AttributionTableRowModel[] = loadMore
    ? [{ kind: 'loadMore', id: 'load-more', ...loadMore }]
    : []

  const table = useComposableTable({
    data: [
      ...rows.filter((row) => !row.isUnattributed).map(toDataRow),
      ...loadMoreRows,
      ...rows.filter((row) => row.isUnattributed).map(toDataRow),
    ],
    columns: tableColumns,
    getRowId: (row) => row.id,
    initialState: { columnPinning: ATTRIBUTION_COLUMN_PINNING },
  })

  return (
    <AttributionTableView
      table={table}
      isLoading={isLoading}
      rowDataTest={ATTRIBUTION_TABLE_ROW_TEST_ID}
      data-test={ATTRIBUTION_TABLE_TEST_ID}
    />
  )
}
