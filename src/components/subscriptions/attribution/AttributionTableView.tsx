import {
  ComposableTableInstance,
  ComposableTableView,
} from '~/components/designSystem/ComposableTable'

import { AttributionTableRowModel, AttributionTableSharedProps } from './useAttributionTableColumns'

export const ATTRIBUTION_TABLE_FOOTER_TEST_ID = 'attribution-flat-table-footer'

type AttributionTableViewProps = Pick<AttributionTableSharedProps, 'isLoading'> & {
  table: ComposableTableInstance<AttributionTableRowModel>
  rowDataTest: string
  'data-test': string
}

export const AttributionTableView = ({
  table,
  isLoading,
  rowDataTest,
  'data-test': dataTest,
}: AttributionTableViewProps): JSX.Element => (
  <ComposableTableView
    table={table}
    isLoading={isLoading}
    hasFooter
    footerDataTest={ATTRIBUTION_TABLE_FOOTER_TEST_ID}
    getRowDataTest={(row) => (row.original.kind === 'data' ? rowDataTest : undefined)}
    data-test={dataTest}
  />
)
