import { CellContext, ColumnDef } from '@tanstack/react-table'
import { ReactNode } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import {
  composableTableFeatures,
  ComposableTableGroupHeader,
  ComposableTableLoadMore,
  ComposableTableRowTreeCell,
  ComposableTableSkeletonCell,
  createComposableTableColumnHelper,
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

export const ATTRIBUTION_SHOW_MORE_TEST_ID = 'attribution-show-more'
export const ATTRIBUTION_LOADING_CELL_TEST_ID = 'attribution-loading-cell'

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

type AttributionTableUsage = AttributionTableSharedProps['totals']

export type AttributionTableRowModel =
  | (AttributionTableRow & {
      kind: 'data'
      expansion:
        { canExpand: false } | { canExpand: true; isLoading: boolean; onToggle: () => void }
      subRows: AttributionTableRowModel[]
    })
  | {
      kind: 'loadMore'
      id: string
      isLoading: boolean
      isDisabled: boolean
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

type UseAttributionTableColumnsParams = Omit<AttributionTableSharedProps, 'isLoading'> & {
  loadMoreDataTest: string
  toggleDataTest?: string
}

const columnHelper = createComposableTableColumnHelper<AttributionTableRowModel>()

export const ATTRIBUTION_COLUMN_PINNING = { start: ['entity'], end: ['total'] }

export const useAttributionTableColumns = ({
  totals,
  columns,
  chargeLabel,
  showMoreColumns,
  basis,
  currency,
  loadMoreDataTest,
  toggleDataTest,
}: UseAttributionTableColumnsParams): AttributionTableColumnDef[] => {
  const { translate } = useInternationalization()

  const renderEntityCell = ({ row }: AttributionTableCellContext): ReactNode => {
    const { original } = row

    if (original.kind === 'loadMore') {
      return (
        <ComposableTableRowTreeCell row={row}>
          <ComposableTableLoadMore
            label={translate('text_1792668632007fulz8omi190')}
            isLoading={original.isLoading}
            disabled={original.isDisabled}
            onLoadMore={original.onLoadMore}
            data-test={loadMoreDataTest}
          />
        </ComposableTableRowTreeCell>
      )
    }

    const { expansion } = original
    const toggle = expansion.canExpand
      ? {
          label: original.label,
          isLoading: expansion.isLoading,
          onToggle: expansion.onToggle,
          'data-test': toggleDataTest,
        }
      : undefined

    return (
      <ComposableTableRowTreeCell row={row} toggle={toggle}>
        <Chip label={original.typeLabel} variant="captionCode" size="small" />
        <Typography variant="body" color={original.isUnattributed ? 'grey600' : 'grey700'} noWrap>
          {original.label}
        </Typography>
      </ComposableTableRowTreeCell>
    )
  }

  const formatValue = (value: number | null): string => {
    if (value === null) return '-'

    if (basis === AttributedUsageBasisEnum.Amount) {
      return intlFormatNumber(deserializeAmount(value, currency), { currency })
    }

    return `${intlFormatNumber(value, { style: 'decimal' })} ${translate('text_6282085b4f283b0102655884')}`
  }

  const renderValue = (usage: AttributionTableUsage, column: AttributionColumn): ReactNode => {
    const chargesUsage = usage.chargesUsageByFilterPage[column.filterPage]

    if (!chargesUsage)
      return <ComposableTableSkeletonCell data-test={ATTRIBUTION_LOADING_CELL_TEST_ID} />

    return formatValue(
      getAttributionDisplayedValue({ basis, usage: getAttributionCellUsage(chargesUsage, column) }),
    )
  }

  const renderTotal = (usage: AttributionTableUsage): string =>
    formatValue(
      getAttributionDisplayedValue({
        basis,
        usage: getAttributionTotalUsage({
          amountCents: usage.amountCents,
          splitChargeUnits: usage.splitChargeUnits,
          chargesUsage: usage.chargesUsageByFilterPage[0] ?? [],
        }),
      }),
    )

  const renderShowMoreColumns = (): ReactNode => {
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
    header: () => (
      <ComposableTableGroupHeader label={chargeLabel} action={renderShowMoreColumns()} />
    ),
    columns: columns.map((column) =>
      columnHelper.display({
        id: column.key,
        meta: { variant: 'numeric' },
        header: column.label ?? translate('text_65281f686a80b400c8e2f6d1'),
        footer: () => renderValue(totals, column),
        cell: ({ row }) =>
          row.original.kind === 'data' ? renderValue(row.original, column) : null,
      }),
    ),
  })

  const totalColumn = columnHelper.display({
    id: 'total',
    meta: { variant: 'numeric' },
    header: translate('text_1738063764295zomiafl8b4s'),
    footer: () => renderTotal(totals),
    cell: ({ row }) => (row.original.kind === 'data' ? renderTotal(row.original) : null),
  })

  if (!columns.length) return [entityColumn, totalColumn]

  return [entityColumn, chargeColumn, totalColumn]
}
