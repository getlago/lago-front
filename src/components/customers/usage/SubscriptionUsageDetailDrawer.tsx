import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Drawer, DrawerRef, Table, Typography } from '~/components/designSystem'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ, intlFormatDateToDateMed } from '~/core/timezone'
import { LocaleEnum } from '~/core/translations'
import { ChargeUsage, CurrencyEnum, TimezoneEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

const NO_ID_FILTER_DEFAULT_VALUE = 'NO_ID_FILTER_DEFAULT_VALUE'

gql`
  fragment CustomerUsageForUsageDetails on CustomerUsage {
    fromDatetime
    toDatetime
    chargesUsage {
      charge {
        id
        invoiceDisplayName
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
      }
      groupedUsage {
        id
        amountCents
        groupedBy
        eventsCount
        units
        filters {
          id
          amountCents
          units
          values
          invoiceDisplayName
        }
      }
    }
  }
`

export interface SubscriptionUsageDetailDrawerRef {
  openDrawer: (usage: ChargeUsage) => unknown
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
    const [usage, setUsage] = useState<ChargeUsage>()

    const displayName = usage?.charge.invoiceDisplayName || usage?.billableMetric.name
    const hasAnyFilterInGroupUsage = usage?.groupedUsage?.some(
      (u) => (u?.filters || [])?.length > 0,
    )
    const hasAnyUnitsInGroupUsage = usage?.groupedUsage?.some((u) => u?.units > 0)

    useImperativeHandle(ref, () => ({
      openDrawer: (data) => {
        setUsage(data)
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
        <Title>
          <Typography variant="headline">
            {translate('text_633dae57ca9a923dd53c208f', {
              billableMetricName: displayName,
            })}
          </Typography>
          <Typography>
            {translate('text_633dae57ca9a923dd53c2097', {
              fromDate: locale
                ? intlFormatDateToDateMed(fromDatetime, customerTimezone, locale)
                : formatDateToTZ(fromDatetime, customerTimezone),
              toDate: locale
                ? intlFormatDateToDateMed(toDatetime, customerTimezone, locale)
                : formatDateToTZ(toDatetime, customerTimezone),
            })}
          </Typography>
        </Title>
        {hasAnyFilterInGroupUsage ? (
          <ItemsWrapper>
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
                        title: translate('text_65771fa3f4ab9a00720726ce'),
                        textAlign: 'right',
                        minWidth: 70,
                        content: (row) => (
                          <Typography variant="body" color="grey700">
                            {row.units}
                          </Typography>
                        ),
                      },
                      {
                        key: 'amountCents',
                        title: translate('text_6419c64eace749372fc72b3e'),
                        textAlign: 'right',
                        minWidth: 100,
                        content: (row) => (
                          <Typography variant="bodyHl" color="grey700">
                            {intlFormatNumber(deserializeAmount(row.amountCents, currency) || 0, {
                              currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
                              currency,
                              locale,
                            })}
                          </Typography>
                        ),
                      },
                    ]}
                  />
                )
              })}
          </ItemsWrapper>
        ) : hasAnyUnitsInGroupUsage ? (
          <ItemsWrapper>
            <Table
              name="grouped-usage-table"
              containerSize={0}
              data={usage?.groupedUsage || []}
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
                  title: translate('text_65771fa3f4ab9a00720726ce'),
                  textAlign: 'right',
                  minWidth: 70,
                  content: (row) => (
                    <Typography variant="body" color="grey700">
                      {row.units}
                    </Typography>
                  ),
                },
                {
                  key: 'amountCents',
                  title: translate('text_6419c64eace749372fc72b3e'),
                  textAlign: 'right',
                  minWidth: 100,
                  content: (row) => (
                    <Typography variant="bodyHl" color="grey700">
                      {intlFormatNumber(deserializeAmount(row.amountCents, currency) || 0, {
                        currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
                        currency,
                        locale,
                      })}
                    </Typography>
                  ),
                },
              ]}
            />
          </ItemsWrapper>
        ) : (
          <ItemsWrapper>
            <Table
              name="filters-table"
              containerSize={0}
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
                  title: translate('text_65771fa3f4ab9a00720726ce'),
                  textAlign: 'right',
                  minWidth: 70,
                  content: (row) => (
                    <Typography variant="body" color="grey700">
                      {row.units}
                    </Typography>
                  ),
                },
                {
                  key: 'amountCents',
                  title: translate('text_6419c64eace749372fc72b3e'),
                  textAlign: 'right',
                  minWidth: 100,
                  content: (row) => (
                    <Typography variant="bodyHl" color="grey700">
                      {intlFormatNumber(deserializeAmount(row.amountCents, currency) || 0, {
                        currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
                        currency,
                        locale,
                      })}
                    </Typography>
                  ),
                },
              ]}
            />
          </ItemsWrapper>
        )}
      </Drawer>
    )
  },
)

const Title = styled.div`
  margin-bottom: ${theme.spacing(6)};
`

const ItemsWrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }

  /* Note: This css makes multiple table's header hidden so they appear as one big table */
  &:has(table#table-grouped-usage-with-filters-table-0) {
    table:not(#table-grouped-usage-with-filters-table-0) thead {
      display: none;
    }
  }
`

SubscriptionUsageDetailDrawer.displayName = 'SubscriptionUsageDetailDrawer'
