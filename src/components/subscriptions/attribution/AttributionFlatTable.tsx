import { CSSProperties, ReactNode } from 'react'

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
export const ATTRIBUTION_SHOW_LESS_TEST_ID = 'attribution-show-less'
export const ATTRIBUTION_LOADING_CELL_TEST_ID = 'attribution-loading-cell'
export const ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID = 'attribution-load-more-rows'

const LOADING_ROWS_COUNT = 3

export type AttributionTableRow = {
  id: string
  typeLabel: string
  label: string
  isUnattributed: boolean
  amountCents?: string | null
  chargesUsageByFilterPage: AttributionChargeUsageFragment[][]
}

export type AttributionColumnsToggle = {
  showMore?: { isLoading: boolean; isDisabled?: boolean; onClick: () => void }
  showLess?: { isDisabled: boolean; onClick: () => void }
}

export type AttributionTableSharedProps = {
  totals: Pick<AttributionTableRow, 'amountCents' | 'chargesUsageByFilterPage'>
  columns: AttributionColumn[]
  chargeLabel: string | null
  columnsToggle: AttributionColumnsToggle
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

const ATTRIBUTION_CELL_PADDING_CLASSNAME = 'px-1 py-0'

const ATTRIBUTION_CELL_CLASSNAME = tw(
  'h-12 w-px min-w-24 whitespace-nowrap border-b border-grey-300 text-right',
  ATTRIBUTION_CELL_PADDING_CLASSNAME,
)

export const ATTRIBUTION_ENTITY_CELL_CLASSNAME = tw(
  'sticky left-0 z-10 h-12 whitespace-nowrap border-b border-r border-grey-300 bg-white text-left',
  ATTRIBUTION_CELL_PADDING_CLASSNAME,
)
const ATTRIBUTION_TOTAL_CELL_CLASSNAME = tw(
  'sticky right-0 z-10 h-12 w-px whitespace-nowrap border-b border-l border-grey-300 bg-grey-100 text-right',
  ATTRIBUTION_CELL_PADDING_CLASSNAME,
  'pl-6',
)

type AttributionValueCellsProps = Pick<
  AttributionTableSharedProps,
  'columns' | 'basis' | 'currency'
> & {
  usage: Pick<AttributionTableRow, 'amountCents' | 'chargesUsageByFilterPage'>
  cellClassName?: string
}

export const AttributionValueCells = ({
  usage,
  columns,
  basis,
  currency,
  cellClassName,
}: AttributionValueCellsProps): JSX.Element => {
  const { translate } = useInternationalization()

  const formatValue = (value: number | null): string => {
    if (value === null) return '—'

    if (basis === AttributedUsageBasisEnum.Amount) {
      return intlFormatNumber(deserializeAmount(value, currency), { currency })
    }

    return `${intlFormatNumber(value, { style: 'decimal' })} ${translate('text_6282085b4f283b0102655884')}`
  }

  const renderCellValue = (column: AttributionColumn): ReactNode => {
    const chargesUsage = usage.chargesUsageByFilterPage[column.filterPage]

    if (!chargesUsage) return <Skeleton variant="text" className="ml-auto w-16" />

    return (
      <Typography variant="body" color="grey700" noWrap>
        {formatValue(
          getAttributionDisplayedValue({
            basis,
            usage: getAttributionCellUsage(chargesUsage, column),
          }),
        )}
      </Typography>
    )
  }

  return (
    <>
      {columns.map((column) => (
        <td
          key={column.key}
          className={tw(ATTRIBUTION_CELL_CLASSNAME, cellClassName)}
          data-test={
            usage.chargesUsageByFilterPage[column.filterPage]
              ? undefined
              : ATTRIBUTION_LOADING_CELL_TEST_ID
          }
        >
          {renderCellValue(column)}
        </td>
      ))}
      <td className={ATTRIBUTION_TOTAL_CELL_CLASSNAME}>
        <Typography variant="body" color="grey700" noWrap>
          {formatValue(
            getAttributionDisplayedValue({
              basis,
              usage: getAttributionTotalUsage({
                amountCents: usage.amountCents,
                chargesUsage: usage.chargesUsageByFilterPage[0] ?? [],
              }),
            }),
          )}
        </Typography>
      </td>
    </>
  )
}

export const AttributionEmptyCells = ({
  columns,
}: Pick<AttributionTableSharedProps, 'columns'>): JSX.Element => (
  <>
    {columns.map((column) => (
      <td key={column.key} className={ATTRIBUTION_CELL_CLASSNAME} />
    ))}
    <td className={ATTRIBUTION_TOTAL_CELL_CLASSNAME} />
  </>
)

const ATTRIBUTION_INDENT_STEP_PX = 16

const getAttributionIndentStyle = (depth: number): CSSProperties => ({
  paddingLeft: depth * ATTRIBUTION_INDENT_STEP_PX,
})

type AttributionEntityCellProps = Pick<
  AttributionTableRow,
  'typeLabel' | 'label' | 'isUnattributed'
> & {
  depth?: number
  toggle?: ReactNode
}

export const AttributionEntityCell = ({
  typeLabel,
  label,
  isUnattributed,
  depth = 0,
  toggle,
}: AttributionEntityCellProps): JSX.Element => (
  <td className={ATTRIBUTION_ENTITY_CELL_CLASSNAME}>
    <div className="flex items-center gap-2" style={getAttributionIndentStyle(depth)}>
      {toggle}
      <Chip label={typeLabel} variant="captionCode" size="small" />
      <Typography variant="body" color={isUnattributed ? 'grey600' : 'grey700'} noWrap>
        {label}
      </Typography>
    </div>
  </td>
)

type AttributionLoadMoreRowProps = Pick<AttributionTableSharedProps, 'columns'> & {
  isLoading: boolean
  onLoadMore: () => void
  depth?: number
  toggle?: ReactNode
  'data-test': string
}

export const AttributionLoadMoreRow = ({
  columns,
  isLoading,
  onLoadMore,
  depth = 0,
  toggle,
  'data-test': dataTest,
}: AttributionLoadMoreRowProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <tr>
      <td className={ATTRIBUTION_ENTITY_CELL_CLASSNAME}>
        <div className="flex items-center gap-2" style={getAttributionIndentStyle(depth)}>
          {toggle}
          <Button
            variant="inline"
            size="small"
            loading={isLoading}
            disabled={isLoading}
            onClick={onLoadMore}
            data-test={dataTest}
          >
            {translate('text_1792668632007fulz8omi190')}
          </Button>
        </div>
      </td>
      <AttributionEmptyCells columns={columns} />
    </tr>
  )
}

export const AttributionTableLayout = ({
  totals,
  columns,
  chargeLabel,
  columnsToggle,
  basis,
  currency,
  isLoading,
  children,
  'data-test': dataTest,
}: AttributionTableSharedProps & { children: ReactNode; 'data-test': string }): JSX.Element => {
  const { translate } = useInternationalization()
  const hasChargeColumns = columns.length > 0
  const { showMore, showLess } = columnsToggle

  const renderBody = (): ReactNode => {
    if (!isLoading) return children

    return Array.from({ length: LOADING_ROWS_COUNT }, (_, index) => (
      <tr key={`loading-${index}`}>
        <td className={ATTRIBUTION_ENTITY_CELL_CLASSNAME}>
          <Skeleton variant="text" className="w-40" />
        </td>
        {columns.map((column) => (
          <td key={column.key} className={ATTRIBUTION_CELL_CLASSNAME}>
            <Skeleton variant="text" className="ml-auto w-16" />
          </td>
        ))}
        <td className={ATTRIBUTION_TOTAL_CELL_CLASSNAME}>
          <Skeleton variant="text" color="dark" className="ml-auto w-16" />
        </td>
      </tr>
    ))
  }

  return (
    <div className="w-full overflow-x-auto" data-test={dataTest}>
      {/* eslint-disable-next-line lago/use-design-system -- DS `Table` lacks lazy tree rows, two-row headers and sticky columns; a TanStack Table base for the DS is under evaluation */}
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className={ATTRIBUTION_ENTITY_CELL_CLASSNAME}>
              <Typography variant="captionHl" color="grey600">
                {translate('text_1792668632006w5a1kxhzpz2')}
              </Typography>
            </th>
            {hasChargeColumns && (
              <th className={tw(ATTRIBUTION_CELL_CLASSNAME, 'text-left')} colSpan={columns.length}>
                <div className="flex items-center justify-between gap-4">
                  <Typography variant="captionHl" color="grey600" noWrap>
                    {chargeLabel}
                  </Typography>
                  <div className="flex items-center gap-2">
                    {showMore && (
                      <Button
                        variant="inline"
                        size="small"
                        loading={showMore.isLoading}
                        disabled={showMore.isLoading || showMore.isDisabled}
                        onClick={showMore.onClick}
                        data-test={ATTRIBUTION_SHOW_MORE_TEST_ID}
                      >
                        {translate('text_1792668632007fulz8omi190')}
                      </Button>
                    )}
                    {showLess && (
                      <Button
                        variant="inline"
                        size="small"
                        disabled={showLess.isDisabled}
                        onClick={showLess.onClick}
                        data-test={ATTRIBUTION_SHOW_LESS_TEST_ID}
                      >
                        {translate('text_1792668632007s3b89z21nto')}
                      </Button>
                    )}
                  </div>
                </div>
              </th>
            )}
            <th className={ATTRIBUTION_TOTAL_CELL_CLASSNAME}>
              <Typography variant="captionHl" color="grey600">
                {translate('text_1738063764295zomiafl8b4s')}
              </Typography>
            </th>
          </tr>
          {hasChargeColumns && (
            <tr>
              <th className={ATTRIBUTION_ENTITY_CELL_CLASSNAME} />
              {columns.map((column) => (
                <th key={column.key} className={ATTRIBUTION_CELL_CLASSNAME}>
                  <Typography variant="captionHl" color="grey600" noWrap>
                    {column.label ?? translate('text_65281f686a80b400c8e2f6d1')}
                  </Typography>
                </th>
              ))}
              <th className={ATTRIBUTION_TOTAL_CELL_CLASSNAME} />
            </tr>
          )}
        </thead>
        <tbody>{renderBody()}</tbody>
        {!isLoading && (
          <tfoot>
            <tr data-test={ATTRIBUTION_TABLE_FOOTER_TEST_ID}>
              <td className={tw(ATTRIBUTION_ENTITY_CELL_CLASSNAME, 'bg-grey-100')}>
                <Typography variant="body" color="grey600">
                  {translate('text_1738063764295zomiafl8b4s')}
                </Typography>
              </td>
              <AttributionValueCells
                usage={totals}
                columns={columns}
                basis={basis}
                currency={currency}
                cellClassName="bg-grey-100"
              />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export const AttributionFlatTable = ({
  rows,
  loadMore,
  ...tableProps
}: AttributionFlatTableProps): JSX.Element => {
  const { columns, basis, currency } = tableProps

  const renderRow = (row: AttributionTableRow): ReactNode => (
    <tr key={row.id} data-test={ATTRIBUTION_TABLE_ROW_TEST_ID}>
      <AttributionEntityCell
        typeLabel={row.typeLabel}
        label={row.label}
        isUnattributed={row.isUnattributed}
      />
      <AttributionValueCells usage={row} columns={columns} basis={basis} currency={currency} />
    </tr>
  )

  const renderLoadMoreRow = (): ReactNode => {
    if (!loadMore) return null

    return (
      <AttributionLoadMoreRow
        key="load-more"
        columns={columns}
        isLoading={loadMore.isLoading}
        onLoadMore={loadMore.onLoadMore}
        data-test={ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID}
      />
    )
  }

  return (
    <AttributionTableLayout {...tableProps} data-test={ATTRIBUTION_TABLE_TEST_ID}>
      {rows.filter((row) => !row.isUnattributed).map(renderRow)}
      {renderLoadMoreRow()}
      {rows.filter((row) => row.isUnattributed).map(renderRow)}
    </AttributionTableLayout>
  )
}
