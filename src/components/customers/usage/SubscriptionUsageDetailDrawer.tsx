import { gql } from '@apollo/client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Drawer, DrawerRef } from '~/components/designSystem/Drawer'
import { NavigationTab, TabManagedBy } from '~/components/designSystem/NavigationTab'
import { Table } from '~/components/designSystem/Table/Table'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import {
  getPricingUnitAmountCents,
  MixedCharge,
} from '~/components/subscriptions/SubscriptionCurrentUsageTable'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import { LocaleEnum } from '~/core/translations'
import {
  ChargeUsage,
  CurrencyEnum,
  GroupedChargeUsage,
  ProjectedChargeFilterUsage,
  ProjectedChargeUsage,
  TimezoneEnum,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

const NO_ID_FILTER_DEFAULT_VALUE = 'NO_ID_FILTER_DEFAULT_VALUE'

export type PresentationBreakdownRow = {
  id: string
  __isBreakdown: true
  presentationBy: Record<string, unknown>
  breakdownUnits: string
}

export const isBreakdownRow = (row: unknown): row is PresentationBreakdownRow =>
  typeof row === 'object' && row !== null && '__isBreakdown' in row

export const sumBreakdownUnits = (
  breakdowns: ReadonlyArray<{ units: string }> | null | undefined,
): number => (breakdowns ?? []).reduce((acc, b) => acc + (Number(b.units) || 0), 0)

export const makeBreakdownRows = (
  parentId: string,
  breakdowns: ReadonlyArray<{ presentationBy: unknown; units: string }> | null | undefined,
): PresentationBreakdownRow[] => {
  // The backend emits one breakdown per fee — when a parent (grouped usage or
  // charge usage) spans multiple fees, identical `presentationBy` keys repeat
  // and the displayed units would over-count vs the parent row. Aggregate here
  // so the breakdown rows partition the parent's units.
  const grouped = new Map<string, { presentationBy: Record<string, unknown>; total: number }>()

  for (const b of breakdowns ?? []) {
    const presentationBy = (b.presentationBy ?? {}) as Record<string, unknown>
    const stableKey = JSON.stringify(
      Object.keys(presentationBy)
        .sort()
        .map((k) => [k, presentationBy[k]]),
    )
    const units = Number(b.units) || 0
    const existing = grouped.get(stableKey)

    if (existing) {
      existing.total += units
    } else {
      grouped.set(stableKey, { presentationBy, total: units })
    }
  }

  return Array.from(grouped.values()).map((entry, i) => ({
    id: `${parentId}__breakdown__${i}`,
    __isBreakdown: true,
    presentationBy: entry.presentationBy,
    breakdownUnits: String(entry.total),
  }))
}

const BreakdownNameCell = ({ presentationBy }: { presentationBy: Record<string, unknown> }) => (
  <div className="flex flex-wrap items-center gap-1 pl-4">
    {Object.entries(presentationBy).map(([key, value]) => (
      <Chip key={key} label={String(value ?? '')} />
    ))}
  </div>
)

type AmountCentsCellProps = {
  row: {
    amountCents?: string | number
    pricingUnitAmountCents?: string | number
    pricingUnitProjectedAmountCents?: string | number
    projectedAmountCents?: string | number
  }
  currency: CurrencyEnum
  locale?: LocaleEnum
  pricingUnitShortName?: string
  showProjected?: boolean
}

const AmountCentsCell = ({
  row,
  currency,
  locale,
  pricingUnitShortName,
  showProjected,
}: AmountCentsCellProps) => (
  <div className="flex flex-col items-end">
    <Typography variant="bodyHl" color="grey700">
      {intlFormatNumber(
        deserializeAmount(getPricingUnitAmountCents(row, showProjected) || 0, currency) || 0,
        {
          currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
          currency,
          locale,
          pricingUnitShortName,
        },
      )}
    </Typography>

    {!!pricingUnitShortName && (
      <Typography variant="caption" color="grey600">
        {intlFormatNumber(
          deserializeAmount(
            showProjected ? row.amountCents : (row as ProjectedChargeUsage).projectedAmountCents,
            currency,
          ),
          {
            currency,
            locale,
            currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
          },
        )}
      </Typography>
    )}
  </div>
)

gql`
  fragment CustomerUsageForUsageDetails on CustomerUsage {
    fromDatetime
    toDatetime
    chargesUsage {
      id
      pricingUnitAmountCents
      charge {
        id
        invoiceDisplayName
        appliedPricingUnit {
          id
          pricingUnit {
            id
            shortName
          }
        }
      }
      billableMetric {
        code
        name
      }
      filters {
        id
        amountCents
        units
        values
        invoiceDisplayName
        pricingUnitAmountCents
        presentationBreakdowns {
          presentationBy
          units
        }
      }
      groupedUsage {
        id
        amountCents
        groupedBy
        eventsCount
        units
        pricingUnitAmountCents
        filters {
          id
          amountCents
          units
          values
          invoiceDisplayName
          pricingUnitAmountCents
          presentationBreakdowns {
            presentationBy
            units
          }
        }
        presentationBreakdowns {
          presentationBy
          units
        }
      }
      presentationBreakdowns {
        presentationBy
        units
      }
    }
  }

  fragment CustomerProjectedUsageForUsageDetails on CustomerProjectedUsage {
    fromDatetime
    toDatetime
    chargesUsage {
      id
      pricingUnitAmountCents
      pricingUnitProjectedAmountCents
      charge {
        id
        invoiceDisplayName
        appliedPricingUnit {
          id
          pricingUnit {
            id
            shortName
          }
        }
      }
      billableMetric {
        code
        name
      }
      filters {
        id
        amountCents
        units
        values
        invoiceDisplayName
        pricingUnitAmountCents
        projectedAmountCents
        pricingUnitProjectedAmountCents
        projectedUnits
        presentationBreakdowns {
          presentationBy
          units
        }
      }
      groupedUsage {
        id
        amountCents
        groupedBy
        eventsCount
        units
        pricingUnitAmountCents
        projectedAmountCents
        pricingUnitProjectedAmountCents
        projectedUnits
        filters {
          id
          amountCents
          units
          values
          invoiceDisplayName
          pricingUnitAmountCents
          projectedAmountCents
          pricingUnitProjectedAmountCents
          projectedUnits
          presentationBreakdowns {
            presentationBy
            units
          }
        }
        presentationBreakdowns {
          presentationBy
          units
        }
      }
      presentationBreakdowns {
        presentationBy
        units
      }
    }
  }
`

export type SubscriptionUsageDetailDrawerUsage = ChargeUsage | ProjectedChargeUsage

export interface SubscriptionUsageDetailDrawerRef {
  openDrawer: (
    usage: SubscriptionUsageDetailDrawerUsage,
    refreshUsage: () => Promise<SubscriptionUsageDetailDrawerUsage | undefined>,
    defaultTab?: number,
  ) => unknown
  closeDialog: () => unknown
}

interface SubscriptionUsageDetailDrawerProps {
  currency: CurrencyEnum
  fromDatetime: string
  toDatetime: string
  customerTimezone: TimezoneEnum
  translate: TranslateFunc
  locale?: LocaleEnum
}

export const SubscriptionUsageDetailDrawer = forwardRef<
  SubscriptionUsageDetailDrawerRef,
  SubscriptionUsageDetailDrawerProps
>(
  (
    {
      currency,
      fromDatetime,
      toDatetime,
      customerTimezone,
      translate,
      locale,
    }: SubscriptionUsageDetailDrawerProps,
    ref,
  ) => {
    const drawerRef = useRef<DrawerRef>(null)
    const [usage, setUsage] = useState<SubscriptionUsageDetailDrawerUsage>()
    const [refreshFunction, setRefreshFunction] =
      useState<
        (forceProjected?: boolean) => Promise<SubscriptionUsageDetailDrawerUsage | undefined>
      >()
    const [activeTab, setActiveTab] = useState<number>(0)
    const [fetchedProjected, setFetchedProjected] = useState(false)

    const showProjected = activeTab === 1

    useEffect(() => {
      const f = async () => {
        if (showProjected && !fetchedProjected) {
          const res = await refreshFunction?.(true)

          setUsage(res)

          setFetchedProjected(true)
        }
      }

      f()
    }, [fetchedProjected, refreshFunction, showProjected])

    const TRANSLATION_MAP = showProjected
      ? {
          unitsHeader: translate('text_17531019276915hby502cvzy'),
          amountHeader: translate('text_1753101927691j5chrkhmoma'),
        }
      : {
          unitsHeader: translate('text_1753095789277t9kbe8y5pmh'),
          amountHeader: translate('text_1753101927691fbbwyk7p39q'),
        }

    const unitsKey = showProjected ? 'projectedUnits' : 'units'

    const displayName = usage?.charge.invoiceDisplayName || usage?.billableMetric.name
    const hasAnyFilterInGroupUsage = usage?.groupedUsage?.some(
      (u) => (u?.filters || [])?.length > 0,
    )
    const hasAnyUnitsInGroupUsage = usage?.groupedUsage?.some((u) => u?.units > 0)

    // Section 2 ("Usage linked to charge filters and pricing groups") renders
    // a breakdown table when there are charge filters or grouped usage entries
    // to break down. Otherwise it shows the info alert.
    const hasFiltersOrGroups =
      (usage?.filters?.length ?? 0) > 0 || (usage?.groupedUsage?.length ?? 0) > 0
    const pricingUnitShortName = usage?.charge.appliedPricingUnit?.pricingUnit?.shortName

    useImperativeHandle(ref, () => ({
      openDrawer: (data, refreshData, defaultTab) => {
        setUsage(data)
        setRefreshFunction(() => refreshData)
        setActiveTab(defaultTab || 0)
        setFetchedProjected(defaultTab === 1)

        drawerRef.current?.openDrawer()
      },
      closeDialog: () => drawerRef.current?.closeDrawer(),
    }))

    return (
      <Drawer
        ref={drawerRef}
        title={translate('text_1778836980285mhlwwvofsqm', {
          billableMetricName: displayName,
        })}
        stickyBottomBar={({ closeDrawer }) => (
          <Button size="large" onClick={closeDrawer}>
            {translate('text_1726044816685r61awuydvji')}
          </Button>
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Typography variant="headline">
              {translate('text_1778836980285mhlwwvofsqm', {
                billableMetricName: displayName,
              })}
            </Typography>
            <Typography>
              {translate('text_633dae57ca9a923dd53c2097', {
                fromDate: intlFormatDateTime(fromDatetime, {
                  locale,
                  timezone: customerTimezone,
                }).date,
                toDate: intlFormatDateTime(toDatetime, {
                  locale,
                  timezone: customerTimezone,
                }).date,
              })}
            </Typography>
          </div>
          <Tooltip placement="top-start" title={translate('text_62d7f6178ec94cd09370e4b3')}>
            <Button
              variant="quaternary"
              icon="reload"
              size="small"
              onClick={async () => {
                const updatedUsage = await refreshFunction?.()

                setUsage(updatedUsage)
              }}
            />
          </Tooltip>
        </div>

        <NavigationTab
          managedBy={TabManagedBy.INDEX}
          currentTab={activeTab}
          onChange={(index) => setActiveTab(index)}
          tabs={[
            {
              title: translate('text_1753094834414fgnvuior3iv'),
            },
            {
              title: translate('text_1753094834414tu9mxavuco7'),
            },
          ]}
        />

        {/* Section 1: Usage linked to the charge */}
        <section className="mt-12 flex flex-col gap-4">
          <Typography variant="subhead1" color="grey700">
            {translate('text_1778680248317x4cg78xappu')}
          </Typography>
          {(() => {
            // Narrow the row shape so the generic Table type doesn't try to
            // resolve the entire ChargeUsage object graph.
            type ChargeSummaryRow = {
              id: string
              units: number | string
              projectedUnits?: number | string
              amountCents?: number | string
              projectedAmountCents?: number | string
              pricingUnitAmountCents?: number | string
              pricingUnitProjectedAmountCents?: number | string
            }

            const chargeSummaryRow: ChargeSummaryRow = {
              id: 'charge-summary',
              units: usage?.units ?? 0,
              projectedUnits: (usage as ProjectedChargeUsage | undefined)?.projectedUnits,
              amountCents: usage?.amountCents ?? 0,
              projectedAmountCents: (usage as ProjectedChargeUsage | undefined)
                ?.projectedAmountCents,
              pricingUnitAmountCents: usage?.pricingUnitAmountCents ?? undefined,
              pricingUnitProjectedAmountCents:
                (usage as ProjectedChargeUsage | undefined)?.pricingUnitProjectedAmountCents ??
                undefined,
            }

            const summaryData: Array<ChargeSummaryRow | PresentationBreakdownRow> = showProjected
              ? [chargeSummaryRow]
              : [chargeSummaryRow, ...makeBreakdownRows('charge', usage?.presentationBreakdowns)]

            return (
              <Table
                name="charge-summary-table"
                containerSize={0}
                rowSize={!!pricingUnitShortName ? 72 : 48}
                data={summaryData}
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

                      return (
                        <div className="flex flex-col gap-1 py-3">
                          <Typography variant="body" color="grey700" noWrap>
                            {displayName}
                          </Typography>
                          {!!usage?.billableMetric.code && (
                            <Typography variant="caption" color="grey600" noWrap>
                              {usage.billableMetric.code}
                            </Typography>
                          )}
                        </div>
                      )
                    },
                  },
                  {
                    key: 'units',
                    title: TRANSLATION_MAP.unitsHeader,
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

                      // Projected tab: use GraphQL values as-is. Current tab:
                      // when charge-level breakdowns exist, display their sum so
                      // the parent row is consistent with the listed breakdown
                      // rows below it.
                      const rawUnits = showProjected ? row.projectedUnits : row.units
                      const hasBreakdowns = (usage?.presentationBreakdowns?.length ?? 0) > 0
                      const displayUnits =
                        !showProjected && hasBreakdowns
                          ? sumBreakdownUnits(usage?.presentationBreakdowns)
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
                    title: TRANSLATION_MAP.amountHeader,
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
          })()}
        </section>

        {/* Section 2: Usage linked to charge filters and pricing groups */}
        <section className="mt-12 flex flex-col gap-4">
          <Typography variant="subhead1" color="grey700">
            {translate('text_17786802483174e1d300blik')}
          </Typography>

          {!hasFiltersOrGroups && (
            <Alert type="info">{translate('text_17786802483175q57751skt9')}</Alert>
          )}

          {hasAnyFilterInGroupUsage && (
            <div className="[&_table:not(#table-grouped-usage-with-filters-table-0)_thead]:hidden">
              {/* NOTE: We have to make a copy of the array here, otherwise we got an error after usage reload while opening the Drawer */}
              {[...(usage?.groupedUsage || [])]
                ?.sort((a, b) => {
                  if (a.filters?.some((f) => !f.id)) return -1
                  if (b.filters?.some((f) => !!f.id)) return 1
                  return 0
                })
                ?.map((groupedUsage, groupedUsageIndex) => {
                  const currentGroupedByDisplayName = composeGroupedByDisplayName(
                    groupedUsage?.groupedBy,
                  )

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
                              // Tail breakdowns for fees in this group that are
                              // not tied to a filter (rare; backend builder
                              // excludes filter-related fees from
                              // groupedUsage.presentationBreakdowns).
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
                          title: TRANSLATION_MAP.unitsHeader,
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

                            // Projected tab: use GraphQL values as-is (breakdowns
                            // are hidden, so no need to reconcile with their sum).
                            // Current tab: when breakdowns exist, display their
                            // sum so the parent stays consistent with the listed
                            // breakdown rows below it.
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
                          title: TRANSLATION_MAP.amountHeader,
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
          )}
          {!hasAnyFilterInGroupUsage && hasAnyUnitsInGroupUsage && (
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

                    return (
                      <Typography variant="body" color="grey700" noWrap>
                        {currentGroupedByDisplayName || displayName}
                      </Typography>
                    )
                  },
                },
                {
                  key: 'units',
                  title: TRANSLATION_MAP.unitsHeader,
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
                    // hidden). Current tab: when breakdowns exist, display their
                    // sum so the parent stays consistent with the listed
                    // breakdown rows below it. Note that the underlying `units`
                    // from GraphQL is the aggregated billing value (which for
                    // non-additive aggregations like max/unique_count does not
                    // equal sum(breakdowns)).
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
                  title: TRANSLATION_MAP.amountHeader,
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
          )}
          {!hasAnyFilterInGroupUsage && !hasAnyUnitsInGroupUsage && (
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
                      // Tail breakdowns for fees on this charge that are not tied
                      // to a filter (backend builder excludes filter-related fees
                      // from ChargeUsage.presentationBreakdowns).
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
                  title: TRANSLATION_MAP.unitsHeader,
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
                    // hidden). Current tab: when breakdowns exist, display their
                    // sum so the parent stays consistent with the rows below it.
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
                  title: TRANSLATION_MAP.amountHeader,
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
          )}
        </section>
      </Drawer>
    )
  },
)

SubscriptionUsageDetailDrawer.displayName = 'SubscriptionUsageDetailDrawer'
