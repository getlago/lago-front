import { AmountCentsCell } from '~/components/customers/usage/sections/AmountCentsCell'
import { BreakdownNameCell } from '~/components/customers/usage/sections/BreakdownNameCell'
import {
  dedupeTailBreakdowns,
  isBreakdownRow,
  isMeaningfulPresentationValue,
  makeBreakdownRows,
  NO_ID_FILTER_DEFAULT_VALUE,
  SubscriptionUsageDetailDrawerUsage,
  sumBreakdownUnits,
} from '~/components/customers/usage/usageDetailsHelpers'
import { Chip } from '~/components/designSystem/Chip'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { ALL_FILTER_VALUES } from '~/core/constants/form'
import { LocaleEnum } from '~/core/translations'
import {
  CurrencyEnum,
  ProjectedChargeFilterUsage,
  ProjectedGroupedChargeUsage,
} from '~/generated/graphql'
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

// Flatten a filter's `values` map into a chip-friendly value list:
//   { region: ['us', 'eu'], type: ALL_FILTER_VALUES } → ['us', 'eu', 'type']
// `ALL_FILTER_VALUES` means "any value of this dimension counts" so we surface
// the dimension name itself.
const extractFilterChipValues = (filter?: {
  values?: Record<string, string[]> | null
}): string[] => {
  if (!filter?.values) return []
  return Object.entries(filter.values).flatMap(([dimension, values]) => {
    if (Array.isArray(values) && values.includes(ALL_FILTER_VALUES)) return [dimension]
    return Array.isArray(values) ? values : []
  })
}

// Build the chip set for a (group, filter) pair. We dedupe by string equality
// because the QA team saw the same value rendered twice when the groupedBy
// dimension overlaps with the filter dimension (which happens with a single
// pricing group). `Set` preserves first-insertion order.
const buildChipValues = (
  groupedBy: Record<string, string | null> | null | undefined,
  filter: { values?: Record<string, string[]> | null } | undefined,
): string[] => {
  const groupedByValues = Object.values(groupedBy ?? {})
    .filter(isMeaningfulPresentationValue)
    .map((v) => String(v))
  const filterValues = extractFilterChipValues(filter)

  return Array.from(new Set([...groupedByValues, ...filterValues]))
}

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

  // Pick the breakdown list aligned with the active tab. Projected has its own
  // `projectedPresentationBreakdowns` field exposed in 2026-05; using the
  // current-tab field on the projected tab would surface stale data.
  const breakdownsForRow = (row: {
    presentationBreakdowns?: { presentationBy: unknown; units: string }[] | null
    projectedPresentationBreakdowns?: { presentationBy: unknown; units: string }[] | null
  }) =>
    showProjected
      ? (row as ProjectedChargeFilterUsage).projectedPresentationBreakdowns
      : row.presentationBreakdowns

  return (
    <div className="[&_table:not(#table-grouped-usage-with-filters-table-0)_thead]:hidden">
      {sortedGroupedUsage.map((groupedUsage, groupedUsageIndex) => {
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
            data={[
              ...filterRows.flatMap((f) => [
                f,
                ...makeBreakdownRows(
                  `grouped-usage-${groupedUsageIndex}-filter-${f.id}`,
                  breakdownsForRow(f),
                ),
              ]),
              // Tail breakdowns for fees in this group that are not tied to a
              // filter. We dedupe against the filter-level breakdowns because
              // the backend sometimes echoes the same data on both sides
              // (e.g. when a group has a no-id "catch-all" filter); without
              // this we render duplicate breakdown rows.
              ...makeBreakdownRows(
                `grouped-usage-${groupedUsageIndex}`,
                dedupeTailBreakdowns(
                  filterRows.map((f) => breakdownsForRow(f)),
                  breakdownsForRow(groupedUsage as ProjectedGroupedChargeUsage),
                ),
              ),
            ]}
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

                  if (row.id === NO_ID_FILTER_DEFAULT_VALUE) {
                    return (
                      <Typography variant="body" color="grey700" noWrap>
                        {translate('text_64e620bca31226337ffc62ad')}
                      </Typography>
                    )
                  }

                  const chipValues = buildChipValues(groupedUsage?.groupedBy, row)

                  if (chipValues.length === 0) {
                    return null
                  }

                  return (
                    <div className="flex flex-wrap items-center gap-1">
                      {chipValues.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </div>
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

                  // Projected tab: show the raw `projectedUnits` from
                  // GraphQL as the source of truth — non-additive
                  // aggregations like max / unique_count won't equal
                  // sum(projectedPresentationBreakdowns).
                  // Current tab: when breakdowns exist, sum them so the
                  // parent row reconciles with the breakdown rows below it.
                  const rawUnits = showProjected
                    ? (row as ProjectedChargeFilterUsage).projectedUnits
                    : row.units
                  const breakdowns = breakdownsForRow(row)
                  const hasBreakdowns = (breakdowns?.length ?? 0) > 0
                  const displayUnits =
                    !showProjected && hasBreakdowns ? sumBreakdownUnits(breakdowns) : rawUnits

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
