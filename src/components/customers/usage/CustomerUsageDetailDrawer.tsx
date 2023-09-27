import { gql } from '@apollo/client'
import _groupBy from 'lodash/groupBy'
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'

import { Button, Drawer, DrawerRef, Typography } from '~/components/designSystem'
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
      groups {
        id
        amountCents
        key
        units
        value
        invoiceDisplayName
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
    ref
  ) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<DrawerRef>(null)
    const [usage, setUsage] = useState<ChargeUsage>()
    const displayName = usage?.charge.invoiceDisplayName || usage?.billableMetric.name

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
            <Groups>
              {Object.entries(_groupBy(usage?.groups, 'key')).map(([key, values], i) => (
                <React.Fragment key={`usage-group-${i}`}>
                  {key !== 'null' && (
                    <GroupTitle variant="bodyHl" color="grey600">
                      {key}
                    </GroupTitle>
                  )}
                  <ItemsWrapper>
                    {values.map((value, j) => (
                      <GroupItem key={`usage-group-${i}-value-${j}`} className="item">
                        <div>
                          <Typography variant="bodyHl" color="grey700">
                            {value.invoiceDisplayName || value.value}
                          </Typography>
                          <Typography variant="body" color="grey600">
                            {translate('text_633dae57ca9a923dd53c20a3', {
                              totalUnits: value.units,
                            })}
                          </Typography>
                        </div>
                        <Typography variant="body" color="grey700" noWrap>
                          {intlFormatNumber(deserializeAmount(value.amountCents, currency) || 0, {
                            currencyDisplay: 'symbol',
                            currency,
                          })}
                        </Typography>
                      </GroupItem>
                    ))}
                  </ItemsWrapper>
                </React.Fragment>
              ))}
            </Groups>
          </Content>
          <SubmitButton>
            <Button fullWidth size="large" onClick={() => drawerRef.current?.closeDrawer()}>
              {translate('text_633dae57ca9a923dd53c20cf')}
            </Button>
          </SubmitButton>
        </>
      </Drawer>
    )
  }
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

const Groups = styled.div`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const GroupTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
  padding: 0 ${theme.spacing(4)};
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
  height: ${NAV_HEIGHT}px;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
`

const SubmitButton = styled.div`
  margin: 0 ${theme.spacing(8)};
`

CustomerUsageDetailDrawer.displayName = 'CustomerUsageDetailDrawer'
