import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useMemo } from 'react'
import { generatePath } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { UPDATE_PLAN_ROUTE, UPDATE_SUBSCRIPTION } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  SubscriptionUsageLifetimeGraphForLifetimeGraphFragment,
  useGetSubscriptionForSubscriptionUsageLifetimeGraphQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

import { getLifetimeGraphPercentages } from './utils'

import { ButtonLink, Icon, Skeleton, Tooltip, Typography } from '../designSystem'
import ChartHeader from '../designSystem/graphs/ChartHeader'
import { subscriptionLifetimeUsageFakeData } from '../designSystem/graphs/fixtures'
import InlineBarsChart from '../designSystem/graphs/InlineBarsChart'
import { GenericPlaceholder } from '../GenericPlaceholder'

export const LAST_USAGE_GRAPH_LINE_KEY_NAME = 'Others'
export const REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE = 'subscriptionUsage'

gql`
  fragment SubscriptionUsageLifetimeGraphForLifetimeGraph on Subscription {
    id
    lifetimeUsage {
      lastThresholdAmountCents
      nextThresholdAmountCents
      totalUsageAmountCents
      totalUsageFromDatetime
      totalUsageToDatetime
    }
    customer {
      id
      currency
      applicableTimezone
    }
    plan {
      id
    }
  }

  query getSubscriptionForSubscriptionUsageLifetimeGraph($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      ...SubscriptionUsageLifetimeGraphForLifetimeGraph
    }
  }
`

const GRAPH_COLORS = [theme.palette.primary[700], theme.palette.grey[300]]

export type TSubscriptionUsageLifetimeGraphDataResult =
  SubscriptionUsageLifetimeGraphForLifetimeGraphFragment['lifetimeUsage']

type SubscriptionUsageLifetimeGraphProps = {
  subscriptionId: string
  customerId: string
}

const SubscriptionUsageLifetimeGraph = ({
  customerId,
  subscriptionId,
}: SubscriptionUsageLifetimeGraphProps) => {
  const { translate } = useInternationalization()
  const { organization, loading: currentOrganizationDataLoading } = useOrganizationInfos()

  const hasProgressiveBillingPremiumIntegration = !!organization?.premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  const {
    data: lifetimeUsageData,
    loading: lifetimeUsageLoading,
    error: lifetimeUsageError,
    refetch: refetchLifetimeData,
  } = useGetSubscriptionForSubscriptionUsageLifetimeGraphQuery({
    variables: {
      subscriptionId,
    },
    fetchPolicy: 'no-cache',
  })
  const lifetimeUsage = hasProgressiveBillingPremiumIntegration
    ? lifetimeUsageData?.subscription?.lifetimeUsage
    : subscriptionLifetimeUsageFakeData
  const isLoading = lifetimeUsageLoading || currentOrganizationDataLoading
  const currency = lifetimeUsageData?.subscription?.customer?.currency || CurrencyEnum.Usd
  const isBlurred = !hasProgressiveBillingPremiumIntegration || !organization
  const customerTimezone = lifetimeUsageData?.subscription?.customer?.applicableTimezone

  const { nextThresholdPercentage, lastThresholdPercentage } = useMemo(() => {
    return getLifetimeGraphPercentages(lifetimeUsage)
  }, [lifetimeUsage])

  return (
    <section>
      <Stack
        direction={'row'}
        height={40}
        boxShadow={theme.shadows[7]}
        alignItems={'flex-start'}
        justifyContent={'space-between'}
      >
        <Stack direction={'row'} gap={2} alignItems={'flex-end'}>
          <Typography variant="subhead" color="grey700" noWrap>
            {translate('text_1726481163322ntor50xdm8k')}
          </Typography>
          <Tooltip placement="top-start" title={translate('text_1726481163322vbcsvivii5k')}>
            <Icon name="info-circle" />
          </Tooltip>
        </Stack>

        {isLoading ? (
          <Skeleton variant="text" height={12} width={144} marginTop={8} />
        ) : !lifetimeUsageError && !!lifetimeUsage ? (
          <Typography
            variant="caption"
            color="grey600"
            blur={!hasProgressiveBillingPremiumIntegration}
            noWrap
          >
            {translate('text_633dae57ca9a923dd53c2097', {
              fromDate: formatDateToTZ(lifetimeUsage.totalUsageFromDatetime, customerTimezone),
              toDate: formatDateToTZ(lifetimeUsage.totalUsageToDatetime, customerTimezone),
            })}
          </Typography>
        ) : null}
      </Stack>

      <Wrapper>
        {!!lifetimeUsageError ? (
          <Error
            title={translate('text_636d023ce11a9d038819b579')}
            subtitle={translate('text_636d023ce11a9d038819b57b')}
            buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
            buttonVariant="primary"
            buttonAction={() => refetchLifetimeData()}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : (
          <>
            {!lifetimeUsage && !isLoading && hasProgressiveBillingPremiumIntegration ? (
              <Typography
                variant="body"
                color="grey600"
                html={translate('text_17264811633225nhatoh524y', {
                  planLink: `${generatePath(UPDATE_PLAN_ROUTE, {
                    planId: lifetimeUsageData?.subscription?.plan?.id || '',
                  })}?origin=${REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE}&subscriptionId=${subscriptionId}&customerId=${customerId}`,
                  subscriptionLink: `${generatePath(UPDATE_SUBSCRIPTION, {
                    subscriptionId,
                    customerId: lifetimeUsageData?.subscription?.customer?.id || '',
                  })}?origin=${REDIRECTION_ORIGIN_SUBSCRIPTION_USAGE}&subscriptionId=${subscriptionId}&customerId=${customerId}`,
                })}
              />
            ) : (
              <>
                <ChartHeader
                  name={translate('text_1726481163322wngkv4nqfh9')}
                  amount={intlFormatNumber(
                    deserializeAmount(lifetimeUsage?.totalUsageAmountCents, currency),
                    {
                      currency,
                    },
                  )}
                  blur={isBlurred}
                  loading={isLoading}
                />

                <GraphContainer $blur={isBlurred}>
                  <GraphWrapper>
                    {!!isLoading ? (
                      <>
                        <Skeleton variant="text" width="100%" height={12} />

                        <div>
                          {[...Array(3)].map((_, index) => (
                            <SkeletonLine key={`usage-skeleton-${index}`}>
                              <Skeleton variant="circular" width={8} height={8} />
                              <Skeleton variant="text" width="32%" height={12} />
                              <Skeleton variant="text" width="32%" height={12} />
                            </SkeletonLine>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <InlineBarsChart
                          data={[
                            {
                              lastThresholdPercentage,
                              nextThresholdPercentage,
                            },
                          ]}
                          tooltipsData={
                            !!nextThresholdPercentage && nextThresholdPercentage !== 0
                              ? [
                                  {
                                    lastThresholdPercentage: translate(
                                      'text_1726576554903s2dddtq5qz4',
                                      {
                                        rate: intlFormatNumber(lastThresholdPercentage / 100 || 0, {
                                          style: 'percent',
                                          // This is a ratio so we will only allow 2 decimal
                                          maximumFractionDigits: 2,
                                        }),
                                      },
                                    ),
                                    nextThresholdPercentage: translate(
                                      'text_1726576554903930hsa8vg23',
                                      {
                                        rate: intlFormatNumber(nextThresholdPercentage / 100 || 0, {
                                          style: 'percent',
                                          // This is a ratio so we will only allow 2 decimal
                                          maximumFractionDigits: 2,
                                        }),
                                      },
                                    ),
                                  },
                                ]
                              : undefined
                          }
                          colors={GRAPH_COLORS}
                        />
                        <Stack direction={'row'} justifyContent={'space-between'}>
                          <Typography variant="caption" color="grey600">
                            {translate('text_17265631916994iccuwziryu', {
                              amount: intlFormatNumber(
                                deserializeAmount(
                                  lifetimeUsage?.lastThresholdAmountCents || 0,
                                  currency,
                                ),
                                {
                                  currency,
                                },
                              ),
                            })}
                          </Typography>
                          <Typography variant="caption" color="grey600">
                            {!lifetimeUsage?.nextThresholdAmountCents
                              ? translate('text_17265631917004vcwz8zc0gy')
                              : translate('text_172656319170006dm5ta4sd8', {
                                  amount: intlFormatNumber(
                                    deserializeAmount(
                                      lifetimeUsage?.nextThresholdAmountCents || 0,
                                      currency,
                                    ),
                                    {
                                      currency,
                                    },
                                  ),
                                })}
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </GraphWrapper>
                </GraphContainer>

                {/* Non premium block */}
                {!isLoading && !hasProgressiveBillingPremiumIntegration && (
                  <Stack
                    direction={'row'}
                    gap={4}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    padding={`${theme.spacing(4)} ${theme.spacing(6)}`}
                    sx={{
                      borderRadius: theme.spacing(2),
                      backgroundColor: theme.palette.grey[100],
                    }}
                  >
                    <Stack>
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_1724345142892pcnx5m2k3r2')}
                        </Typography>
                        <Icon name="sparkles" />
                      </Stack>
                      <Typography variant="caption" color="grey600">
                        {translate('text_1724345142892ljzi79afhmc')}
                      </Typography>
                    </Stack>
                    <ButtonLink
                      buttonProps={{
                        variant: 'tertiary',
                        size: 'medium',
                        endIcon: 'sparkles',
                      }}
                      type="button"
                      external
                      to={`mailto:hello@getlago.com?subject=${translate('text_172434514289283gmf8bdhh3')}&body=${translate('text_1724346450317iqs2rtvx1tp')}`}
                    >
                      {translate('text_65ae73ebe3a66bec2b91d72d')}
                    </ButtonLink>
                  </Stack>
                )}
              </>
            )}
          </>
        )}
      </Wrapper>
    </section>
  )
}

export default SubscriptionUsageLifetimeGraph

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
  padding: ${theme.spacing(6)} 0;
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};
`

const GraphContainer = styled.div<{ $blur: boolean }>`
  ${({ $blur }) =>
    $blur &&
    css`
      filter: blur(4px);
      pointer-events: none;
    `}
`

const GraphWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(3)};
`

const SkeletonLine = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  gap: ${theme.spacing(2)};

  &:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }

  > *:last-child {
    margin-left: auto;
  }
`

const Error = styled(GenericPlaceholder)`
  margin: 0;
  padding: 0;
`
