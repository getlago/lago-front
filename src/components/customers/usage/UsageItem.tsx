import { useRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import {
  ChargeUsage,
  CurrencyEnum,
  CustomerUsageForUsageDetailsFragmentDoc,
  CustomerUsageSubscriptionFragment,
  useCustomerUsageLazyQuery,
  TimezoneEnum,
} from '~/generated/graphql'
import {
  Accordion,
  Skeleton,
  Icon,
  Button,
  Tooltip,
  Avatar,
  Typography,
} from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import ErrorImage from '~/public/images/maneki/error.svg'
import EmptyImage from '~/public/images/maneki/empty.svg'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { getTimezoneConfig, formatDateToTZ } from '~/core/timezone'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

import {
  CustomerUsageDetailDrawer,
  CustomerUsageDetailDrawerRef,
} from './CustomerUsageDetailDrawer'

gql`
  query customerUsage($customerId: ID!, $subscriptionId: ID!) {
    customerUsage(customerId: $customerId, subscriptionId: $subscriptionId) {
      amountCents
      amountCurrency
      fromDatetime
      toDatetime
      chargesUsage {
        units
        amountCents
        billableMetric {
          id
          code
          name
        }
      }
      ...CustomerUsageForUsageDetails
    }
  }

  ${CustomerUsageForUsageDetailsFragmentDoc}
`

interface UsageItemProps {
  customerId: string
  subscription: CustomerUsageSubscriptionFragment
  customerTimezone: TimezoneEnum
}

export const UsageItem = ({ customerId, subscription, customerTimezone }: UsageItemProps) => {
  const { id, name, plan } = subscription
  const { translate } = useInternationalization()
  const customerUsageDetailDrawerRef = useRef<CustomerUsageDetailDrawerRef>(null)
  const [fetchUsage, { data, error, loading, refetch }] = useCustomerUsageLazyQuery({
    variables: { customerId: customerId, subscriptionId: id },
  })
  const currency = data?.customerUsage?.amountCurrency || CurrencyEnum.Usd

  return (
    <div>
      <Accordion
        onChange={() => fetchUsage()}
        noContentMargin
        collapsedTooltip={translate('text_62d7f6178ec94cd09370e60d')}
        expandedTooltip={translate('text_62d7f6178ec94cd09370e4cd')}
        summary={
          <>
            <StyledAvatar variant="connector">
              <Icon name="pulse" color="dark" />
            </StyledAvatar>
            <Title>
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {name || plan?.name}
              </Typography>
              <Typography variant="caption" noWrap>
                {plan?.code}
              </Typography>
            </Title>
            <Tooltip placement="top-start" title={translate('text_62d7f6178ec94cd09370e4b3')}>
              <Button
                variant="quaternary"
                icon="reload"
                size="small"
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  await refetch()
                }}
              />
            </Tooltip>
          </>
        }
      >
        {!!error && !loading ? (
          <GenericPlaceholder
            title={translate('text_62c3f3fca8a1625624e83379')}
            subtitle={translate('text_62c3f3fca8a1625624e8337e')}
            buttonTitle={translate('text_62c3f3fca8a1625624e83382')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : !loading && !data ? (
          <GenericPlaceholder
            title={translate('text_62c3f454e5d7f4ec8888c1d5')}
            subtitle={translate('text_62c3f454e5d7f4ec8888c1d7')}
            image={<EmptyImage width="136" height="104" />}
          />
        ) : (
          <div>
            <Header>
              {loading ? (
                <UsageHeader $hasCharge>
                  <MainInfos>
                    <Block>
                      <Skeleton variant="text" height={12} width={144} marginBottom="12px" />
                      <Skeleton variant="text" height={12} width={88} />
                    </Block>
                  </MainInfos>
                  <Skeleton variant="text" height={12} width={96} />
                </UsageHeader>
              ) : (
                <UsageHeader $hasCharge={!!data?.customerUsage?.chargesUsage?.length}>
                  <MainInfos>
                    <Block>
                      <Typography variant="bodyHl" color="textSecondary" noWrap>
                        {translate('text_62c3f3fca8a1625624e83380')}
                      </Typography>
                      <DateLine variant="caption" noWrap>
                        <span>{translate('text_6390eacb5c755f61a1f7aed2')}</span>
                        <Tooltip
                          placement="top-start"
                          title={translate('text_6390ea10cf97ec5780001c9d', {
                            offset: getTimezoneConfig(customerTimezone).offset,
                          })}
                        >
                          <Date variant="caption">
                            {formatDateToTZ(data?.customerUsage?.fromDatetime, customerTimezone)}
                          </Date>
                        </Tooltip>
                        <span>{translate('text_6390eacf6dedf13adadf71b3')}</span>
                        <Tooltip
                          placement="top-start"
                          title={translate('text_6390ea10cf97ec5780001c9d', {
                            offset: getTimezoneConfig(customerTimezone).offset,
                          })}
                        >
                          <Date variant="caption">
                            {formatDateToTZ(data?.customerUsage?.toDatetime, customerTimezone)}
                          </Date>
                        </Tooltip>
                      </DateLine>
                    </Block>
                  </MainInfos>
                  <Typography color="textSecondary">
                    {intlFormatNumber(
                      deserializeAmount(data?.customerUsage?.amountCents, currency) || 0,
                      {
                        currencyDisplay: 'symbol',
                        currency,
                      }
                    )}
                  </Typography>
                </UsageHeader>
              )}
            </Header>
            <UsageLogContainer>
              {loading
                ? [0, 1, 2, 3].map((i) => {
                    return (
                      <ItemContainer key={`customer-usage-skeleton-${i}`}>
                        <Skeleton variant="text" height={12} width={120} marginBottom="12px" />
                        <Skeleton variant="text" height={12} width={80} marginBottom="44px" />
                        <Line>
                          <Skeleton variant="text" height={12} width={80} marginRight="16px" />
                          <Skeleton variant="text" height={12} width={120} />
                        </Line>
                      </ItemContainer>
                    )
                  })
                : data?.customerUsage?.chargesUsage?.map((usage, i) => {
                    const { billableMetric, units, amountCents } = usage

                    return (
                      <ItemContainer key={`customer-usage-${i}`}>
                        <BillableMetricHeaderLine>
                          <div>
                            <Typography variant="bodyHl" color="textSecondary">
                              {billableMetric?.name}
                            </Typography>
                            <UsageSubtitle variant="caption">{billableMetric?.code}</UsageSubtitle>
                          </div>
                          {!!usage.groups?.length && (
                            <Tooltip
                              title={translate('text_633dae57ca9a923dd53c2135')}
                              placement="top-end"
                            >
                              <Button
                                icon="info-circle"
                                size="small"
                                variant="secondary"
                                onClick={() => {
                                  customerUsageDetailDrawerRef.current?.openDrawer(
                                    usage as ChargeUsage
                                  )
                                }}
                              />
                            </Tooltip>
                          )}
                        </BillableMetricHeaderLine>
                        <Line>
                          <Typography variant="caption">
                            {translate('text_633dae57ca9a923dd53c2121', { units }, units)}
                          </Typography>
                          <Typography color="textSecondary">
                            {intlFormatNumber(deserializeAmount(amountCents, currency) || 0, {
                              currencyDisplay: 'symbol',
                              currency,
                            })}
                          </Typography>
                        </Line>
                      </ItemContainer>
                    )
                  })}
            </UsageLogContainer>
          </div>
        )}
      </Accordion>

      <CustomerUsageDetailDrawer
        ref={customerUsageDetailDrawerRef}
        currency={currency}
        fromDatetime={data?.customerUsage?.fromDatetime}
        toDatetime={data?.customerUsage?.toDatetime}
        customerTimezone={customerTimezone}
      />
    </div>
  )
}

export const UsageItemSkeleton = () => {
  return (
    <SkeletonItem>
      <Button size="small" variant="quaternary" disabled icon="chevron-right" />
      <Skeleton variant="connectorAvatar" size="medium" marginRight="12px" />
      <div>
        <Skeleton variant="text" width={240} height={12} marginBottom="12px" />
        <Skeleton variant="text" width={120} height={12} />
      </div>
    </SkeletonItem>
  )
}

const SkeletonItem = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  height: ${NAV_HEIGHT}px;
  align-items: center;
  display: flex;
  padding: 0 ${theme.spacing(4)};
  border-radius: 12px;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: auto;
  min-width: 20px;
`

const Block = styled.div`
  min-width: 0;
  margin-right: ${theme.spacing(3)};
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const UsageLogContainer = styled.div`
  flex-wrap: wrap;
  display: flex;
  gap: 1px;
  background-color: ${theme.palette.grey[300]};
  overflow: hidden;
  border-radius: 12px;
`

const ItemContainer = styled.div`
  padding: ${theme.spacing(4)};
  min-width: 300px;
  box-sizing: border-box;
  background-color: ${theme.palette.background.default};
  flex: 1;

  ${theme.breakpoints.down('md')} {
    min-width: 180px;
  }
`

const Line = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    white-space: pre;
  }
`

const BillableMetricHeaderLine = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing(8)};
`

const UsageSubtitle = styled(Typography)`
  min-width: 0;
`

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[5]};
`

const UsageHeader = styled.div<{ $hasCharge?: boolean }>`
  display: flex;
  height: ${NAV_HEIGHT}px;
  padding: 0 ${theme.spacing(4)};
  align-items: center;
  width: 100%;
  box-shadow: ${({ $hasCharge }) => ($hasCharge ? theme.shadows[7] : 'none')};

  > *:first-child {
    margin-right: auto;
  }
`

const Date = styled(Typography)`
  border-bottom: 1px dotted ${theme.palette.grey[400]};
  width: fit-content;
`

const DateLine = styled(Typography)`
  display: flex;
  align-items: baseline;
  > *:not(:last-child) {
    margin-right: ${theme.spacing(1)};
  }
`
