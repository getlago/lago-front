import { CellContext, ColumnDef } from '@tanstack/react-table'
import { createContext, ReactNode, useCallback, useContext } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import {
  ComposableTableExpandToggle,
  composableTableFeatures,
  ComposableTableGroupHeader,
  ComposableTableInstance,
  ComposableTableLoadMore,
  ComposableTableSkeletonCell,
  ComposableTableToggleSpacer,
  ComposableTableTreeCell,
  ComposableTableView,
  createComposableTableColumnHelper,
  useComposableTable,
} from '~/components/designSystem/ComposableTable'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { AttributedUsageBasisEnum, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  AttributionChargesUsageByFilterPage,
  AttributionColumn,
  getAttributionCellUsage,
  getAttributionDisplayedValue,
  getAttributionTotalUsage,
} from './buildAttributionColumns'

export const ATTRIBUTION_TABLE_TEST_ID = 'attribution-flat-table'
export const ATTRIBUTION_TABLE_ROW_TEST_ID = 'attribution-flat-table-row'
export const ATTRIBUTION_TABLE_FOOTER_TEST_ID = 'attribution-flat-table-footer'
export const ATTRIBUTION_SHOW_MORE_TEST_ID = 'attribution-show-more'
export const ATTRIBUTION_LOADING_CELL_TEST_ID = 'attribution-loading-cell'
export const ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID = 'attribution-load-more-rows'

export type AttributionTableRow = {
  id: string
  typeLabel: string
  label: string
  isUnattributed: boolean
  amountCents?: string | null
  splitChargeUnits?: number | null
  chargesUsageByFilterPage: AttributionChargesUsageByFilterPage
}

export type AttributionShowMoreColumns = { onClick: () => void } & (
  { isExpanded: false } | { isExpanded: true; isLoading: boolean; isDisabled: boolean }
)

export type AttributionTableSharedProps = {
  totals: Pick<AttributionTableRow, 'amountCents' | 'splitChargeUnits' | 'chargesUsageByFilterPage'>
  columns: AttributionColumn[]
  chargeLabel: string | null
  showMoreColumns?: AttributionShowMoreColumns
  basis: AttributedUsageBasisEnum
  currency: CurrencyEnum
  isLoading: boolean
}

type AttributionFlatTableProps = AttributionTableSharedProps & {
  rows: AttributionTableRow[]
  loadMore?: {
    isLoading: boolean
    onLoadMore: () => void
  }
}

type AttributionTableUsage = AttributionTableSharedProps['totals']

type AttributionTableToggle =
  { kind: 'none' } | { kind: 'spacer' } | { kind: 'expand'; isLoading: boolean }

export type AttributionTableRowModel =
  | (AttributionTableRow & {
      kind: 'data'
      toggle: AttributionTableToggle
      subRows: AttributionTableRowModel[]
    })
  | {
      kind: 'loadMore'
      id: string
      toggle: Exclude<AttributionTableToggle, { kind: 'expand' }>
      isLoading: boolean
      onLoadMore: () => void
    }

type AttributionTableColumnDef = ColumnDef<
  typeof composableTableFeatures,
  AttributionTableRowModel,
  unknown
>

type AttributionTableCellContext = CellContext<
  typeof composableTableFeatures,
  AttributionTableRowModel,
  unknown
>

type UseAttributionTableColumnsParams = Pick<
  AttributionTableSharedProps,
  'totals' | 'columns' | 'chargeLabel' | 'basis' | 'currency'
> & {
  loadMoreDataTest: string
  toggleDataTest?: string
}

const columnHelper = createComposableTableColumnHelper<AttributionTableRowModel>()

const VALUE_COLUMN_META = { align: 'right', shrink: true, className: 'min-w-24' } as const

export const ATTRIBUTION_COLUMN_PINNING = { start: ['entity'], end: ['total'] }

// Read from context, not captured by the header: a new header function would remount this
// button and drop its focus.
const AttributionShowMoreColumnsContext = createContext<AttributionShowMoreColumns | undefined>(
  undefined,
)

const AttributionShowMoreColumnsButton = (): JSX.Element | null => {
  const { translate } = useInternationalization()
  const showMoreColumns = useContext(AttributionShowMoreColumnsContext)

  if (!showMoreColumns) return null

  return (
    <ComposableTableLoadMore
      label={translate('text_1792668632007fulz8omi190')}
      isLoading={showMoreColumns.isExpanded && showMoreColumns.isLoading}
      disabled={showMoreColumns.isExpanded && showMoreColumns.isDisabled}
      onLoadMore={showMoreColumns.onClick}
      data-test={ATTRIBUTION_SHOW_MORE_TEST_ID}
    />
  )
}

export const useAttributionTableColumns = ({
  totals,
  columns,
  chargeLabel,
  basis,
  currency,
  loadMoreDataTest,
  toggleDataTest,
}: UseAttributionTableColumnsParams): AttributionTableColumnDef[] => {
  const { translate } = useInternationalization()

  // `flexRender` mounts a function cell as a component: a new identity remounts every entity
  // cell, and the focused toggle or load-more button with it.
  const renderEntityCell = useCallback(
    ({ row }: AttributionTableCellContext): ReactNode => {
      const { original } = row

      const renderToggle = (): ReactNode => {
        if (original.toggle.kind === 'none') return null
        if (original.toggle.kind === 'spacer' || original.kind === 'loadMore') {
          return <ComposableTableToggleSpacer />
        }

        return (
          <ComposableTableExpandToggle
            label={original.label}
            isExpanded={row.getIsExpanded()}
            isLoading={original.toggle.isLoading}
            onToggle={row.getToggleExpandedHandler()}
            data-test={toggleDataTest}
          />
        )
      }

      if (original.kind === 'loadMore') {
        return (
          <ComposableTableTreeCell depth={row.depth} toggle={renderToggle()}>
            <ComposableTableLoadMore
              label={translate('text_1792668632007fulz8omi190')}
              isLoading={original.isLoading}
              onLoadMore={original.onLoadMore}
              data-test={loadMoreDataTest}
            />
          </ComposableTableTreeCell>
        )
      }

      return (
        <ComposableTableTreeCell depth={row.depth} toggle={renderToggle()}>
          <Chip label={original.typeLabel} variant="captionCode" size="small" />
          <Typography variant="body" color={original.isUnattributed ? 'grey600' : 'grey700'} noWrap>
            {original.label}
          </Typography>
        </ComposableTableTreeCell>
      )
    },
    [loadMoreDataTest, toggleDataTest, translate],
  )

  const formatValue = (value: number | null): string => {
    if (value === null) return '-'

    if (basis === AttributedUsageBasisEnum.Amount) {
      return intlFormatNumber(deserializeAmount(value, currency), { currency })
    }

    return `${intlFormatNumber(value, { style: 'decimal' })} ${translate('text_6282085b4f283b0102655884')}`
  }

  const renderFormattedValue = (value: number | null): JSX.Element => (
    <Typography variant="body" color="grey700" noWrap>
      {formatValue(value)}
    </Typography>
  )

  const renderValue = (usage: AttributionTableUsage, column: AttributionColumn): ReactNode => {
    const chargesUsage = usage.chargesUsageByFilterPage[column.filterPage]

    if (!chargesUsage)
      return <ComposableTableSkeletonCell data-test={ATTRIBUTION_LOADING_CELL_TEST_ID} />

    return renderFormattedValue(
      getAttributionDisplayedValue({ basis, usage: getAttributionCellUsage(chargesUsage, column) }),
    )
  }

  const renderTotal = (usage: AttributionTableUsage): JSX.Element =>
    renderFormattedValue(
      getAttributionDisplayedValue({
        basis,
        usage: getAttributionTotalUsage({
          amountCents: usage.amountCents,
          splitChargeUnits: usage.splitChargeUnits,
          chargesUsage: usage.chargesUsageByFilterPage[0] ?? [],
        }),
      }),
    )

  const renderChargeHeader = useCallback(
    (): ReactNode => (
      <ComposableTableGroupHeader
        label={chargeLabel}
        action={<AttributionShowMoreColumnsButton />}
      />
    ),
    [chargeLabel],
  )

  const entityColumn = columnHelper.display({
    id: 'entity',
    header: translate('text_1792668632006w5a1kxhzpz2'),
    footer: () => (
      <Typography variant="body" color="grey600">
        {translate('text_1738063764295zomiafl8b4s')}
      </Typography>
    ),
    cell: renderEntityCell,
  })

  const chargeColumn = columnHelper.group({
    id: 'charge',
    header: renderChargeHeader,
    columns: columns.map((column) =>
      columnHelper.display({
        id: column.key,
        meta: VALUE_COLUMN_META,
        header: column.label ?? translate('text_65281f686a80b400c8e2f6d1'),
        footer: () => renderValue(totals, column),
        cell: ({ row }) =>
          row.original.kind === 'data' ? renderValue(row.original, column) : null,
      }),
    ),
  })

  const totalColumn = columnHelper.display({
    id: 'total',
    meta: { align: 'right' },
    header: translate('text_1738063764295zomiafl8b4s'),
    footer: () => renderTotal(totals),
    cell: ({ row }) => (row.original.kind === 'data' ? renderTotal(row.original) : null),
  })

  if (!columns.length) return [entityColumn, totalColumn]

  return [entityColumn, chargeColumn, totalColumn]
}

type AttributionTableViewProps = Pick<
  AttributionTableSharedProps,
  'showMoreColumns' | 'isLoading'
> & {
  table: ComposableTableInstance<AttributionTableRowModel>
  rowDataTest: string
  'data-test': string
}

export const AttributionTableView = ({
  table,
  showMoreColumns,
  isLoading,
  rowDataTest,
  'data-test': dataTest,
}: AttributionTableViewProps): JSX.Element => (
  <AttributionShowMoreColumnsContext.Provider value={showMoreColumns}>
    <ComposableTableView
      table={table}
      isLoading={isLoading}
      hasFooter
      footerDataTest={ATTRIBUTION_TABLE_FOOTER_TEST_ID}
      getRowDataTest={(row) => (row.original.kind === 'data' ? rowDataTest : undefined)}
      data-test={dataTest}
    />
  </AttributionShowMoreColumnsContext.Provider>
)

export const AttributionFlatTable = ({
  rows,
  loadMore,
  isLoading,
  showMoreColumns,
  ...columnsProps
}: AttributionFlatTableProps): JSX.Element => {
  const tableColumns = useAttributionTableColumns({
    ...columnsProps,
    loadMoreDataTest: ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID,
  })

  const toDataRow = (row: AttributionTableRow): AttributionTableRowModel => ({
    ...row,
    kind: 'data',
    toggle: { kind: 'none' },
    subRows: [],
  })

  const loadMoreRows: AttributionTableRowModel[] = loadMore
    ? [{ kind: 'loadMore', id: 'load-more', toggle: { kind: 'none' }, ...loadMore }]
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
      showMoreColumns={showMoreColumns}
      rowDataTest={ATTRIBUTION_TABLE_ROW_TEST_ID}
      data-test={ATTRIBUTION_TABLE_TEST_ID}
    />
  )
}
