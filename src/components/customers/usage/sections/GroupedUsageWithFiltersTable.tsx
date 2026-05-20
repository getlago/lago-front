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
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { LocaleEnum } from '~/core/translations'
import { CurrencyEnum, ProjectedChargeFilterUsage } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

// Sort groupedUsage entries so groups whose filters include a filter with no
// `id` come first — the no-id filter represents the "all other values" bucket
// and reads more clearly at the top.
const sortGroupedUsage = (
  groupedUsage: NonNullable<SubscriptionUsageDetailDrawerUsage['groupedUsage']>,
) =>
  [...groupedUsage].sort((a, b) => {
    if (a?.filters?.some((f) => !f?.id)) return -1
    if (b?.filters?.some((f) => !!f?.id)) return 1
    return 0
  })

type GroupedUsageWithFiltersTableProps = {
  usage: SubscriptionUsageDetailDrawerUsage | undefined
  currency: CurrencyEnum
  locale?: LocaleEnum
  showProjected: boolean
  translate: TranslateFunc
  unitsHeader: string
  amountHeader: string
}

export const GroupedUsageWithFiltersTable = ({
  usage,
  currency,
  locale,
  showProjected,
  translate,
  unitsHeader,
  amountHeader,
}: GroupedUsageWithFiltersTableProps) => {
  const pricingUnitShortName = usage?.charge.appliedPricingUnit?.pricingUnit?.shortName

  // NOTE: We have to make a copy of the array here, otherwise we get an error
  // after usage reload while opening the Drawer.
  const sortedGroupedUsage = sortGroupedUsage(usage?.groupedUsage || [])

  return (
    <div className="[&_table:not(#table-grouped-usage-with-filters-table-0)_thead]:hidden">
      {sortedGroupedUsage.map((groupedUsage, groupedUsageIndex) => {
        const currentGroupedByDisplayName = composeGroupedByDisplayName(groupedUsage?.groupedBy)

        const filterRows =
          groupedUsage.filters?.map((f) => ({
            ...f,
            // Table component expect all elements to have an ID
            id: f.id || NO_ID_FILTER_DEFAULT_VALUE,
          })) || []

        return (
          <Table
            key={`grouped-usage-${groupedUsageIndex}`}
            name={`grouped-usage-with-filters-table-${groupedUsageIndex}`}
            containerSize={0}
            rowSize={!!pricingUnitShortName ? 72 : 48}
            data={
              showProjected
                ? filterRows
                : [
                    ...filterRows.flatMap((f) => [
                      f,
                      ...makeBreakdownRows(
                        `grouped-usage-${groupedUsageIndex}-filter-${f.id}`,
                        f.presentationBreakdowns,
                      ),
                    ]),
                    // Tail breakdowns for fees in this group that are not tied
                    // to a filter (rare; backend builder excludes filter-related
                    // fees from groupedUsage.presentationBreakdowns).
                    ...makeBreakdownRows(
                      `grouped-usage-${groupedUsageIndex}`,
                      groupedUsage.presentationBreakdowns,
                    ),
                  ]
            }
            columns={[
              {
                key: 'invoiceDisplayName',
                title: translate('text_1725983967306dtwnapp4mw9'),
                truncateOverflow: true,
                maxSpace: true,
                content: (row) => {
                  if (isBreakdownRow(row)) {
                    return <BreakdownNameCell presentationBy={row.presentationBy} />
                  }

                  const mappedFilterDisplayName = composeMultipleValuesWithSepator([
                    currentGroupedByDisplayName,
                    row.id === NO_ID_FILTER_DEFAULT_VALUE
                      ? translate('text_64e620bca31226337ffc62ad')
                      : composeChargeFilterDisplayName(row),
                  ])

                  return (
                    <Typography variant="body" color="grey700" noWrap>
                      {mappedFilterDisplayName}
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

                  // Projected tab: use GraphQL values as-is (breakdowns are
                  // hidden, so no need to reconcile with their sum). Current
                  // tab: when breakdowns exist, display their sum so the parent
                  // stays consistent with the listed breakdown rows below it.
                  const rawUnits = showProjected
                    ? (row as ProjectedChargeFilterUsage).projectedUnits
                    : row.units
                  const hasBreakdowns = (row.presentationBreakdowns?.length ?? 0) > 0
                  const displayUnits =
                    !showProjected && hasBreakdowns
                      ? sumBreakdownUnits(row.presentationBreakdowns)
                      : rawUnits

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
      })}
    </div>
  )
}
