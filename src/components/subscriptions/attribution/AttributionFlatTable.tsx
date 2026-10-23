import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  AttributedUsageBasisEnum,
  AttributionChargeUsageFragment,
  CurrencyEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import {
  AttributionColumn,
  getAttributionCellUsage,
  getAttributionDisplayedValue,
  getAttributionTotalUsage,
} from './buildAttributionColumns'

export const ATTRIBUTION_TABLE_TEST_ID = 'attribution-flat-table'
export const ATTRIBUTION_TABLE_ROW_TEST_ID = 'attribution-flat-table-row'
export const ATTRIBUTION_TABLE_FOOTER_TEST_ID = 'attribution-flat-table-footer'
export const ATTRIBUTION_SHOW_MORE_TEST_ID = 'attribution-show-more'
export const ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID = 'attribution-load-more-rows'

const LOADING_ROWS_COUNT = 3

export type AttributionTableRow = {
  id: string
  typeLabel: string
  label: string
  isUnattributed: boolean
  amountCents?: string | null
  chargesUsage: AttributionChargeUsageFragment[]
}

type AttributionFlatTableProps = {
  rows: AttributionTableRow[]
  totals: Pick<AttributionTableRow, 'amountCents' | 'chargesUsage'>
  columns: AttributionColumn[]
  chargeLabel: string | null
  hiddenColumnsCount: number
  isExpanded: boolean
  basis: AttributedUsageBasisEnum
  currency: CurrencyEnum
  isLoading: boolean
  loadMore?: {
    isLoading: boolean
    onLoadMore: () => void
  }
  onToggleExpanded: () => void
}

const CELL_CLASSNAME = 'h-12 whitespace-nowrap border-b border-grey-300 px-3 text-right'
const ENTITY_CELL_CLASSNAME =
  'sticky left-0 z-10 h-12 min-w-60 whitespace-nowrap border-b border-r border-grey-300 bg-white px-3 text-left'
const TOTAL_CELL_CLASSNAME =
  'sticky right-0 z-10 h-12 whitespace-nowrap border-b border-l border-grey-300 bg-grey-100 px-3 text-right'

export const AttributionFlatTable = ({
  rows,
  totals,
  columns,
  chargeLabel,
  hiddenColumnsCount,
  isExpanded,
  basis,
  currency,
  isLoading,
  loadMore,
  onToggleExpanded,
}: AttributionFlatTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const hasChargeColumns = columns.length > 0
  const canToggleColumns = isExpanded || hiddenColumnsCount > 0

  const formatValue = (value: number | null): string => {
    if (value === null) return '—'

    if (basis === AttributedUsageBasisEnum.Amount) {
      return intlFormatNumber(deserializeAmount(value, currency), { currency })
    }

    return `${intlFormatNumber(value, { style: 'decimal' })} ${translate('text_6282085b4f283b0102655884')}`
  }

  const renderValueCells = (
    usage: Pick<AttributionTableRow, 'amountCents' | 'chargesUsage'>,
    cellClassName?: string,
  ): ReactNode => (
    <>
      {columns.map((column) => (
        <td key={column.key} className={tw(CELL_CLASSNAME, cellClassName)}>
          <Typography variant="body" color="grey700" noWrap>
            {formatValue(
              getAttributionDisplayedValue({
                basis,
                usage: getAttributionCellUsage(usage.chargesUsage, column),
              }),
            )}
          </Typography>
        </td>
      ))}
      <td className={TOTAL_CELL_CLASSNAME}>
        <Typography variant="body" color="grey700" noWrap>
          {formatValue(
            getAttributionDisplayedValue({ basis, usage: getAttributionTotalUsage(usage) }),
          )}
        </Typography>
      </td>
    </>
  )

  const renderRows = (): ReactNode => {
    if (isLoading) {
      return Array.from({ length: LOADING_ROWS_COUNT }, (_, index) => (
        <tr key={`loading-${index}`}>
          <td className={ENTITY_CELL_CLASSNAME}>
            <Skeleton variant="text" className="w-40" />
          </td>
          {columns.map((column) => (
            <td key={column.key} className={CELL_CLASSNAME}>
              <Skeleton variant="text" className="ml-auto w-16" />
            </td>
          ))}
          <td className={TOTAL_CELL_CLASSNAME}>
            <Skeleton variant="text" className="ml-auto w-16" />
          </td>
        </tr>
      ))
    }

    const renderRow = (row: AttributionTableRow): ReactNode => (
      <tr key={row.id} data-test={ATTRIBUTION_TABLE_ROW_TEST_ID}>
        <td className={ENTITY_CELL_CLASSNAME}>
          <div className="flex items-center gap-2">
            <Chip label={row.typeLabel} variant="captionCode" size="small" />
            <Typography variant="body" color={row.isUnattributed ? 'grey600' : 'grey700'} noWrap>
              {row.label}
            </Typography>
          </div>
        </td>
        {renderValueCells(row)}
      </tr>
    )

    const renderLoadMoreRow = (): ReactNode => {
      if (!loadMore) return null

      return (
        <tr key="load-more">
          <td className={ENTITY_CELL_CLASSNAME}>
            <Button
              variant="inline"
              size="small"
              loading={loadMore.isLoading}
              disabled={loadMore.isLoading}
              onClick={loadMore.onLoadMore}
              data-test={ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID}
            >
              {translate('text_1792668632007fulz8omi190')}
            </Button>
          </td>
          {columns.map((column) => (
            <td key={column.key} className={CELL_CLASSNAME} />
          ))}
          <td className={TOTAL_CELL_CLASSNAME} />
        </tr>
      )
    }

    return (
      <>
        {rows.filter((row) => !row.isUnattributed).map(renderRow)}
        {renderLoadMoreRow()}
        {rows.filter((row) => row.isUnattributed).map(renderRow)}
      </>
    )
  }

  return (
    <div className="w-full overflow-x-auto" data-test={ATTRIBUTION_TABLE_TEST_ID}>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className={ENTITY_CELL_CLASSNAME} rowSpan={hasChargeColumns ? 2 : 1}>
              <Typography variant="captionHl" color="grey600">
                {translate('text_1792668632006w5a1kxhzpz2')}
              </Typography>
            </th>
            {hasChargeColumns && (
              <th className={tw(CELL_CLASSNAME, 'text-left')} colSpan={columns.length}>
                <div className="flex items-center justify-between gap-4">
                  <Typography variant="captionHl" color="grey600" noWrap>
                    {chargeLabel}
                  </Typography>
                  {canToggleColumns && (
                    <Button
                      variant="inline"
                      size="small"
                      onClick={onToggleExpanded}
                      data-test={ATTRIBUTION_SHOW_MORE_TEST_ID}
                    >
                      {translate(
                        isExpanded
                          ? 'text_1792668632007s3b89z21nto'
                          : 'text_1792668632007fulz8omi190',
                      )}
                    </Button>
                  )}
                </div>
              </th>
            )}
            <th className={TOTAL_CELL_CLASSNAME} rowSpan={hasChargeColumns ? 2 : 1}>
              <Typography variant="captionHl" color="grey600">
                {translate('text_1738063764295zomiafl8b4s')}
              </Typography>
            </th>
          </tr>
          {hasChargeColumns && (
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={CELL_CLASSNAME}>
                  <Typography variant="captionHl" color="grey600" noWrap>
                    {column.label ?? translate('text_65281f686a80b400c8e2f6d1')}
                  </Typography>
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>{renderRows()}</tbody>
        {!isLoading && (
          <tfoot>
            <tr data-test={ATTRIBUTION_TABLE_FOOTER_TEST_ID}>
              <td className={tw(ENTITY_CELL_CLASSNAME, 'bg-grey-100')}>
                <Typography variant="body" color="grey600">
                  {translate('text_1738063764295zomiafl8b4s')}
                </Typography>
              </td>
              {renderValueCells(totals, 'bg-grey-100')}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
