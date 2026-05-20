import { AmountCentsCell } from '~/components/customers/usage/sections/AmountCentsCell'
import { BreakdownNameCell } from '~/components/customers/usage/sections/BreakdownNameCell'
import {
  isBreakdownRow,
  makeBreakdownRows,
  NO_ID_FILTER_DEFAULT_VALUE,
  SubscriptionUsageDetailDrawerUsage,
  sumBreakdownUnits,
} from '~/components/customers/usage/usageDetailsHelpers'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { MixedCharge } from '~/components/subscriptions/SubscriptionCurrentUsageTable'
import { composeChargeFilterDisplayName } from '~/core/formats/formatInvoiceItemsMap'
import { LocaleEnum } from '~/core/translations'
import { CurrencyEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

type FiltersOnlyTableProps = {
  usage: SubscriptionUsageDetailDrawerUsage | undefined
  currency: CurrencyEnum
  locale?: LocaleEnum
  showProjected: boolean
  translate: TranslateFunc
  unitsHeader: string
  amountHeader: string
}

export const FiltersOnlyTable = ({
  usage,
  currency,
  locale,
  showProjected,
  translate,
  unitsHeader,
  amountHeader,
}: FiltersOnlyTableProps) => {
  const displayName = usage?.charge.invoiceDisplayName || usage?.billableMetric.name
  const pricingUnitShortName = usage?.charge.appliedPricingUnit?.pricingUnit?.shortName
  const unitsKey = showProjected ? 'projectedUnits' : 'units'

  return (
    <Table
      name="filters-table"
      containerSize={0}
      rowSize={!!pricingUnitShortName ? 72 : 48}
      data={
        showProjected
          ? (usage?.filters || []).map((f) => ({
              ...f,
              id: f.id || NO_ID_FILTER_DEFAULT_VALUE,
            }))
          : [
              ...(usage?.filters || []).flatMap((rawFilter) => {
                const f = {
                  ...rawFilter,
                  // Table component expect all elements to have an ID
                  id: rawFilter.id || NO_ID_FILTER_DEFAULT_VALUE,
                }

                return [f, ...makeBreakdownRows(`filter-${f.id}`, f.presentationBreakdowns)]
              }),
              // Tail breakdowns for fees on this charge that are not tied to a
              // filter (backend builder excludes filter-related fees from
              // ChargeUsage.presentationBreakdowns).
              ...makeBreakdownRows('charge', usage?.presentationBreakdowns),
            ]
      }
      columns={[
        {
          key: 'invoiceDisplayName',
          title: translate('text_1725983967306dtwnapp4mw9'),
          maxSpace: true,
          truncateOverflow: true,
          content: (row) => {
            if (isBreakdownRow(row)) {
              return <BreakdownNameCell presentationBy={row.presentationBy} />
            }

            const mappedFilterDisplayName =
              row.id === NO_ID_FILTER_DEFAULT_VALUE
                ? translate('text_64e620bca31226337ffc62ad')
                : composeChargeFilterDisplayName(row)

            return (
              <Typography variant="body" color="grey700" noWrap>
                {row.invoiceDisplayName || mappedFilterDisplayName || displayName}
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
            // parent stays consistent with the rows below it.
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
