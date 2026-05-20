import { AmountCentsCell } from '~/components/customers/usage/sections/AmountCentsCell'
import { BreakdownNameCell } from '~/components/customers/usage/sections/BreakdownNameCell'
import {
  isBreakdownRow,
  makeBreakdownRows,
  SubscriptionUsageDetailDrawerUsage,
  sumBreakdownUnits,
} from '~/components/customers/usage/usageDetailsHelpers'
import { Chip } from '~/components/designSystem/Chip'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { MixedCharge } from '~/components/subscriptions/SubscriptionCurrentUsageTable'
import { composeGroupedByDisplayName } from '~/core/formats/formatInvoiceItemsMap'
import { LocaleEnum } from '~/core/translations'
import { CurrencyEnum, GroupedChargeUsage } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

type GroupedUsageTableProps = {
  usage: SubscriptionUsageDetailDrawerUsage | undefined
  currency: CurrencyEnum
  locale?: LocaleEnum
  showProjected: boolean
  translate: TranslateFunc
  unitsHeader: string
  amountHeader: string
}

export const GroupedUsageTable = ({
  usage,
  currency,
  locale,
  showProjected,
  translate,
  unitsHeader,
  amountHeader,
}: GroupedUsageTableProps) => {
  const displayName = usage?.charge.invoiceDisplayName || usage?.billableMetric.name
  const pricingUnitShortName = usage?.charge.appliedPricingUnit?.pricingUnit?.shortName
  const unitsKey = showProjected ? 'projectedUnits' : 'units'

  return (
    <Table
      name="grouped-usage-table"
      containerSize={0}
      rowSize={!!pricingUnitShortName ? 72 : 48}
      data={
        showProjected
          ? (usage?.groupedUsage as GroupedChargeUsage[]) || []
          : ((usage?.groupedUsage as GroupedChargeUsage[]) || []).flatMap((row) => [
              row,
              ...makeBreakdownRows(row.id, row.presentationBreakdowns),
            ])
      }
      columns={[
        {
          key: 'id',
          title: translate('text_1725983967306dtwnapp4mw9'),
          maxSpace: true,
          truncateOverflow: true,
          content: (row) => {
            if (isBreakdownRow(row)) {
              return <BreakdownNameCell presentationBy={row.presentationBy} />
            }

            const currentGroupedByDisplayName = composeGroupedByDisplayName(row?.groupedBy)
            const groupedByKeys =
              row?.groupedBy && typeof row.groupedBy === 'object' ? Object.keys(row.groupedBy) : []

            // When the groupedBy values are all null `composeGroupedByDisplayName`
            // returns "". Falling back to the billable-metric name is misleading
            // (it reads as if there's no grouping at all). Render the groupedBy
            // KEYS as chips so the user can still tell which pricing-group
            // dimension they're looking at.
            if (!currentGroupedByDisplayName && groupedByKeys.length > 0) {
              return (
                <div className="flex flex-wrap items-center gap-1">
                  {groupedByKeys.map((key) => (
                    <Chip key={key} label={key} size="small" />
                  ))}
                </div>
              )
            }

            return (
              <Typography variant="body" color="grey700" noWrap>
                {currentGroupedByDisplayName || displayName}
              </Typography>
            )
          },
        },
        {
          key: 'units',
          title: unitsHeader,
          textAlign: 'right',
          minWidth: 70,
          content: (row) => {
            if (isBreakdownRow(row)) {
              return (
                <Typography variant="body" color="grey600">
                  {row.breakdownUnits}
                </Typography>
              )
            }

            // Projected tab: use GraphQL values as-is (breakdowns are hidden).
            // Current tab: when breakdowns exist, display their sum so the
            // parent stays consistent with the listed breakdown rows below it.
            // Note that the underlying `units` from GraphQL is the aggregated
            // billing value (which for non-additive aggregations like
            // max/unique_count does not equal sum(breakdowns)).
            const hasBreakdowns = (row.presentationBreakdowns?.length ?? 0) > 0
            const displayUnits =
              !showProjected && hasBreakdowns
                ? sumBreakdownUnits(row.presentationBreakdowns)
                : (row as MixedCharge)[unitsKey]

            return (
              <Typography variant="body" color="grey700">
                {displayUnits}
              </Typography>
            )
          },
        },
        {
          key: 'amountCents',
          title: amountHeader,
          textAlign: 'right',
          minWidth: 100,
          content: (row) => {
            if (isBreakdownRow(row)) {
              return null
            }

            return (
              <AmountCentsCell
                row={row}
                currency={currency}
                locale={locale}
                pricingUnitShortName={pricingUnitShortName}
                showProjected={showProjected}
              />
            )
          },
        },
      ]}
    />
  )
}
