import { gql } from '@apollo/client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import {
  Button,
  Drawer,
  DrawerRef,
  NavigationTab,
  Table,
  TabManagedBy,
  Tooltip,
  Typography,
} from '~/components/designSystem'
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
        name
      }
      filters {
        id
        amountCents
        units
        values
        invoiceDisplayName
        pricingUnitAmountCents
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
        }
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
        }
      }
    }
  }
`

export interface SubscriptionUsageDetailDrawerRef {
  openDrawer: (
    usage: ChargeUsage | ProjectedChargeUsage,
    refreshUsage: () => Promise<ChargeUsage | ProjectedChargeUsage | undefined>,
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
    const [usage, setUsage] = useState<ChargeUsage | ProjectedChargeUsage>()
    const [refreshFunction, setRefreshFunction] =
      useState<
        (forceProjected?: boolean) => Promise<ChargeUsage | ProjectedChargeUsage | undefined>
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
        title={translate('text_633dae57ca9a923dd53c208f', {
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
              {translate('text_633dae57ca9a923dd53c208f', {
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

                return (
                  <Table
                    key={`grouped-usage-${groupedUsageIndex}`}
                    name={`grouped-usage-with-filters-table-${groupedUsageIndex}`}
                    containerSize={0}
                    rowSize={!!pricingUnitShortName ? 72 : 48}
                    data={
                      groupedUsage.filters?.map((f) => {
                        return {
                          ...f,
                          // Table component expect all elements to have an ID
                          id: f.id || NO_ID_FILTER_DEFAULT_VALUE,
                        }
                      }) || []
                    }
                    columns={[
                      {
                        key: 'invoiceDisplayName',
                        title: translate('text_1726158292600r2xetfumq5t'),
                        truncateOverflow: true,
                        maxSpace: true,
                        content: (row) => {
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
                        content: (row) => (
                          <Typography variant="body" color="grey700">
                            {showProjected
                              ? (row as ProjectedChargeFilterUsage).projectedUnits
                              : row.units}
                          </Typography>
                        ),
                      },
                      {
                        key: 'amountCents',
                        title: TRANSLATION_MAP.amountHeader,
                        textAlign: 'right',
                        minWidth: 100,
                        content: (row) => (
                          <AmountCentsCell
                            row={row}
                            currency={currency}
                            locale={locale}
                            pricingUnitShortName={pricingUnitShortName}
                            showProjected={showProjected}
                          />
                        ),
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
            data={(usage?.groupedUsage as GroupedChargeUsage[]) || []}
            columns={[
              {
                key: 'id',
                title: translate('text_1726158292600r2xetfumq5t'),
                maxSpace: true,
                truncateOverflow: true,
                content: (row) => {
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
                content: (row) => (
                  <Typography variant="body" color="grey700">
                    {(row as MixedCharge)[unitsKey]}
                  </Typography>
                ),
              },
              {
                key: 'amountCents',
                title: TRANSLATION_MAP.amountHeader,
                textAlign: 'right',
                minWidth: 100,
                content: (row) => (
                  <AmountCentsCell
                    row={row}
                    currency={currency}
                    locale={locale}
                    pricingUnitShortName={pricingUnitShortName}
                    showProjected={showProjected}
                  />
                ),
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
              usage?.filters?.map((f) => {
                return {
                  ...f,
                  // Table component expect all elements to have an ID
                  id: f.id || NO_ID_FILTER_DEFAULT_VALUE,
                }
              }) || []
            }
            columns={[
              {
                key: 'invoiceDisplayName',
                title: translate('text_1726158292600r2xetfumq5t'),
                maxSpace: true,
                truncateOverflow: true,
                content: (row) => {
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
                content: (row) => (
                  <Typography variant="body" color="grey700">
                    {(row as MixedCharge)[unitsKey]}
                  </Typography>
                ),
              },
              {
                key: 'amountCents',
                title: TRANSLATION_MAP.amountHeader,
                textAlign: 'right',
                minWidth: 100,
                content: (row) => (
                  <AmountCentsCell
                    row={row}
                    currency={currency}
                    locale={locale}
                    pricingUnitShortName={pricingUnitShortName}
                    showProjected={showProjected}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>
    )
  },
)

SubscriptionUsageDetailDrawer.displayName = 'SubscriptionUsageDetailDrawer'
