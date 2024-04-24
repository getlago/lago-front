import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import {
  composeChargeFilterDisplayName,
  composeGroupedByDisplayName,
  composeMultipleValuesWithSepator,
} from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import { ChargeUsage, CurrencyEnum, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

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

export interface CustomerUsageDetailDrawerRef {
  openDrawer: (usage: ChargeUsage) => unknown
  closeDialog: () => unknown
}

interface CustomerUsageDetailDrawerProps {
  currency: CurrencyEnum
  fromDatetime: string
  toDatetime: string
  customerTimezone: TimezoneEnum
}

export const CustomerUsageDetailDrawer = forwardRef<
  CustomerUsageDetailDrawerRef,
  CustomerUsageDetailDrawerProps
>(
  (
    { currency, fromDatetime, toDatetime, customerTimezone }: CustomerUsageDetailDrawerProps,
    ref,
  ) => {
    const { translate } = useInternationalization()
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
      >
        <>
          <Content>
            <Title>
              <Typography variant="headline">
                {translate('text_633dae57ca9a923dd53c2093', {
                  billableMetricName: displayName,
                })}
              </Typography>
              <Typography>
                {translate('text_633dae57ca9a923dd53c2097', {
                  fromDate: formatDateToTZ(fromDatetime, customerTimezone),
                  toDate: formatDateToTZ(toDatetime, customerTimezone),
                })}
              </Typography>
            </Title>
            {hasAnyFilterInGroupUsage ? (
              <ItemsWrapper>
                {usage?.groupedUsage
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
                      <>
                        {groupedUsage.filters?.map((filter, filterIndex) => {
                          const mappedFilterDisplayName = composeMultipleValuesWithSepator([
                            currentGroupedByDisplayName,
                            !!filter.id
                              ? composeChargeFilterDisplayName(filter)
                              : translate('text_64e620bca31226337ffc62ad'),
                          ])

                          return (
                            <GroupItem
                              key={`grouped-usage-${groupedUsageIndex}-${filterIndex}`}
                              className="item"
                            >
                              <div>
                                <Typography variant="bodyHl" color="grey700">
                                  {mappedFilterDisplayName}
                                </Typography>
                                <Typography variant="body" color="grey600">
                                  {translate('text_633dae57ca9a923dd53c20a3', {
                                    totalUnits: filter.units,
                                  })}
                                </Typography>
                              </div>
                              <Typography variant="body" color="grey700" noWrap>
                                {intlFormatNumber(
                                  deserializeAmount(filter.amountCents, currency) || 0,
                                  {
                                    currencyDisplay: 'symbol',
                                    currency,
                                  },
                                )}
                              </Typography>
                            </GroupItem>
                          )
                        })}
                      </>
                    )
                  })}
              </ItemsWrapper>
            ) : hasAnyUnitsInGroupUsage ? (
              <ItemsWrapper>
                {usage?.groupedUsage.map((groupedUsage, groupedUsageIndex) => {
                  const currentGroupedByDisplayName = composeGroupedByDisplayName(
                    groupedUsage?.groupedBy,
                  )

                  return (
                    <GroupItem key={`grouped-usage-${groupedUsageIndex}`} className="item">
                      <div>
                        <Typography variant="bodyHl" color="grey700">
                          {currentGroupedByDisplayName || displayName}
                        </Typography>
                        <Typography variant="body" color="grey600">
                          {translate('text_633dae57ca9a923dd53c20a3', {
                            totalUnits: groupedUsage.units,
                          })}
                        </Typography>
                      </div>
                      <Typography variant="body" color="grey700" noWrap>
                        {intlFormatNumber(
                          deserializeAmount(groupedUsage.amountCents, currency) || 0,
                          {
                            currencyDisplay: 'symbol',
                            currency,
                          },
                        )}
                      </Typography>
                    </GroupItem>
                  )
                })}
              </ItemsWrapper>
            ) : (
              <ItemsWrapper>
                {usage?.filters?.map((filter, i) => {
                  const mappedFilterDisplayName = !!filter.id
                    ? composeChargeFilterDisplayName(filter)
                    : translate('text_64e620bca31226337ffc62ad')

                  return (
                    <GroupItem key={`usage-group-${i}`} className="item">
                      <div>
                        <Typography variant="bodyHl" color="grey700">
                          {filter.invoiceDisplayName || mappedFilterDisplayName || displayName}
                        </Typography>
                        <Typography variant="body" color="grey600">
                          {translate('text_633dae57ca9a923dd53c20a3', {
                            totalUnits: filter.units,
                          })}
                        </Typography>
                      </div>
                      <Typography variant="body" color="grey700" noWrap>
                        {intlFormatNumber(deserializeAmount(filter.amountCents, currency) || 0, {
                          currencyDisplay: 'symbol',
                          currency,
                        })}
                      </Typography>
                    </GroupItem>
                  )
                })}
              </ItemsWrapper>
            )}
          </Content>
          <SubmitButton>
            <Button fullWidth size="large" onClick={() => drawerRef.current?.closeDrawer()}>
              {translate('text_633dae57ca9a923dd53c20cf')}
            </Button>
          </SubmitButton>
        </>
      </Drawer>
    )
  },
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const Title = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const ItemsWrapper = styled.div`
  border-radius: 12px 12px;
  border: 1px solid ${theme.palette.grey[300]};

  &:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }

  > .item:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }
`

const GroupItem = styled.div`
  display: flex;
  box-sizing: border-box;
  justify-content: space-between;
  align-items: center;
  min-height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  gap: ${theme.spacing(2)};

  > *:last-child {
    flex-shrink: 0;
  }
`

const SubmitButton = styled.div`
  margin: 0 ${theme.spacing(8)};
`

CustomerUsageDetailDrawer.displayName = 'CustomerUsageDetailDrawer'
