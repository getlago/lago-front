import { ApolloError, gql } from '@apollo/client'
import { Box, Stack } from '@mui/material'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { Alert, Button, Skeleton, Table, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { LagoGQLError } from '~/core/apolloClient'
import { LocalTaxProviderErrorsEnum } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import {
  ChargeUsage,
  CurrencyEnum,
  CustomerForSubscriptionUsageQuery,
  CustomerUsageForUsageDetailsFragmentDoc,
  GetCustomerUsageForPortalQuery,
  GetSubscriptionForSubscriptionUsageLifetimeGraphQuery,
  GetSubscriptionForSubscriptionUsageLifetimeGraphQueryResult,
  LagoApiError,
  Subscription,
  TimezoneEnum,
  UsageForSubscriptionUsageQuery,
  useCustomerForSubscriptionUsageQuery,
  useGetSubscriptionForSubscriptionUsageLifetimeGraphQuery,
  useSubscrptionForSubscriptionUsageQuery,
  useUsageForSubscriptionUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { NAV_HEIGHT, theme } from '~/styles'

import {
  SubscriptionUsageDetailDrawer,
  SubscriptionUsageDetailDrawerRef,
} from '../customers/usage/SubscriptionUsageDetailDrawer'

gql`
  query customerForSubscriptionUsage($customerId: ID!) {
    customer(id: $customerId) {
      id
      applicableTimezone
    }
  }

  query subscrptionForSubscriptionUsage($subscription: ID!) {
    subscription(id: $subscription) {
      id
      name
      plan {
        id
        name
        code
      }
      customer {
        id
        applicableTimezone
      }
    }
  }

  fragment SubscriptionCurrentUsageTableComponentCustomerUsage on CustomerUsage {
    amountCents
    currency
    fromDatetime
    toDatetime
    chargesUsage {
      id
      units
      amountCents
      charge {
        id
        invoiceDisplayName
      }
      billableMetric {
        id
        code
        name
      }
      filters {
        id
      }
      groupedUsage {
        amountCents
        groupedBy
        eventsCount
        units
        filters {
          id
        }
      }
    }
  }

  query usageForSubscriptionUsage($customerId: ID!, $subscriptionId: ID!) {
    customerUsage(customerId: $customerId, subscriptionId: $subscriptionId) {
      amountCents
      ...SubscriptionCurrentUsageTableComponentCustomerUsage
      ...CustomerUsageForUsageDetails
    }
  }

  ${CustomerUsageForUsageDetailsFragmentDoc}
`

interface SubscriptionCurrentUsageTableProps {
  customerId: string
  subscriptionId: string
}

type SubscriptionCurrentUsageTableComponentProps = {
  usageData?:
    | UsageForSubscriptionUsageQuery['customerUsage']
    | GetCustomerUsageForPortalQuery['customerPortalCustomerUsage']
  usageLoading: boolean
  usageError?: ApolloError

  subscription?: GetSubscriptionForSubscriptionUsageLifetimeGraphQuery['subscription']
  subscriptionLoading: boolean

  subscriptionError?: ApolloError

  customerData?: CustomerForSubscriptionUsageQuery['customer']
  customerLoading: boolean
  customerError?: ApolloError

  refetchUsage: () => void
}

export const SubscriptionCurrentUsageTableComponent = ({
  usageData,
  usageLoading,
  usageError,

  subscription,
  subscriptionLoading,
  subscriptionError,

  customerData,
  customerLoading,
  customerError,

  refetchUsage,
}: SubscriptionCurrentUsageTableComponentProps) => {
  const { translate } = useInternationalization()

  const subscriptionUsageDetailDrawerRef = useRef<SubscriptionUsageDetailDrawerRef>(null)

  const currency = usageData?.currency || CurrencyEnum.Usd
  const isLoading = subscriptionLoading || usageLoading || customerLoading
  const hasError = !!subscriptionError || !!usageError || !!customerError
  const customerTimezone =
    customerData?.applicableTimezone ||
    subscription?.customer.applicableTimezone ||
    TimezoneEnum.TzUtc

  return (
    <section>
      <Stack
        direction={'row'}
        height={40}
        boxShadow={theme.shadows[7]}
        alignItems={'flex-start'}
        justifyContent={'space-between'}
      >
        <Stack direction={'row'} gap={2}>
          <Typography variant="subhead" color="grey700" noWrap>
            {translate('text_1725983967306cf8dwr2r4u2')}
          </Typography>
          <Tooltip placement="top-start" title={translate('text_62d7f6178ec94cd09370e4b3')}>
            <Button
              variant="quaternary"
              icon="reload"
              size="small"
              onClick={async () => {
                await refetchUsage()
              }}
            />
          </Tooltip>
        </Stack>

        {isLoading ? (
          <Skeleton variant="text" height={12} width={144} marginTop={8} />
        ) : !hasError &&
          !!usageData?.customerUsage?.fromDatetime &&
          !!usageData?.customerUsage?.toDatetime ? (
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_633dae57ca9a923dd53c2097', {
              fromDate: formatDateToTZ(usageData?.fromDatetime, customerTimezone),
              toDate: formatDateToTZ(usageData?.toDatetime, customerTimezone),
            })}
          </Typography>
        ) : null}
      </Stack>

      {!!hasError && !isLoading ? (
        <>
          {(usageError?.graphQLErrors?.length || 0) > 0 &&
          usageError?.graphQLErrors.find((graphQLError) => {
            const { extensions } = graphQLError as LagoGQLError

            return extensions?.details?.taxError?.length
          }) ? (
            <Alert fullWidth type="warning" className="shadow-t">
              <Stack>
                <Typography variant="body" color="grey700">
                  {translate('text_1724165657161stcilcabm7x')}
                </Typography>

                <Typography variant="caption">
                  {translate(LocalTaxProviderErrorsEnum.GenericErrorMessage)}
                </Typography>
              </Stack>
            </Alert>
          ) : (
            <GenericPlaceholder
              title={translate('text_62c3f3fca8a1625624e83379')}
              subtitle={translate('text_1726498444629i1fpjyvh0kg')}
              buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
              buttonVariant="primary"
              buttonAction={() => refetchUsage()}
              image={<ErrorImage width="136" height="104" />}
            />
          )}
        </>
      ) : !isLoading && !usageData?.chargesUsage.length ? (
        <GenericPlaceholder
          title={translate('text_62c3f454e5d7f4ec8888c1d5')}
          subtitle={translate('text_62c3f454e5d7f4ec8888c1d7')}
          image={<EmptyImage width="136" height="104" />}
        />
      ) : (
        <>
          <Stack
            direction={'row'}
            height={48}
            boxShadow={theme.shadows[7]}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <Typography variant="bodyHl" color="grey700" noWrap>
              {translate('text_62c3f3fca8a1625624e83380')}
            </Typography>

            {isLoading ? (
              <Skeleton variant="text" height={12} width={144} marginTop={8} />
            ) : (
              <Typography variant="bodyHl" color="grey700" noWrap>
                {intlFormatNumber(deserializeAmount(usageData?.amountCents, currency) || 0, {
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            )}
          </Stack>

          <Table
            name="subscription-current-usage-table"
            containerSize={0}
            rowSize={72}
            isLoading={isLoading}
            hasError={hasError}
            data={usageData?.chargesUsage || []}
            columns={[
              {
                key: 'charge.invoiceDisplayName',
                title: translate('text_1725983967306dtwnapp4mw9'),
                maxSpace: true,
                content: (row) => {
                  const hasAnyGroupedUsageFilters = row.groupedUsage.some(
                    (groupedUsage) => !!groupedUsage?.filters?.length,
                  )
                  const hasAnyGroupedUsageUnits = row.groupedUsage.some(
                    (groupedUsage) => groupedUsage?.units > 0,
                  )

                  return (
                    <Box
                      sx={{
                        paddingY: theme.spacing(3),
                      }}
                    >
                      <Typography variant="body" color="grey700">
                        {row.charge.invoiceDisplayName || row.billableMetric?.name}
                      </Typography>
                      <Stack
                        direction={'row'}
                        gap={1}
                        width={'100%'}
                        sx={{
                          '> span': {
                            display: 'inline',
                            '> span': {
                              padding: theme.spacing(1),
                            },
                          },
                        }}
                      >
                        <Typography variant="caption" color="grey600" component={'span'}>
                          {row.billableMetric?.code}
                          {(!!row.filters?.length ||
                            hasAnyGroupedUsageFilters ||
                            hasAnyGroupedUsageUnits) && (
                            <>
                              <Typography variant="caption" color="grey600" component={'span'}>
                                •
                              </Typography>
                              <NoFocusLink
                                to={'#'}
                                onClick={() => {
                                  subscriptionUsageDetailDrawerRef.current?.openDrawer(
                                    row as ChargeUsage,
                                  )
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="info600"
                                  sx={{
                                    // Have to use !important to override the parent's link style override
                                    whiteSpace: 'nowrap !important',
                                  }}
                                  component={'span'}
                                >
                                  {translate('text_1725983967306c736sdyjohn')}
                                </Typography>
                              </NoFocusLink>
                            </>
                          )}
                        </Typography>
                      </Stack>
                    </Box>
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
                    {intlFormatNumber(deserializeAmount(row.amountCents, currency), {
                      currency,
                    })}
                  </Typography>
                ),
              },
            ]}
          />
        </>
      )}

      <SubscriptionUsageDetailDrawer
        ref={subscriptionUsageDetailDrawerRef}
        currency={currency}
        fromDatetime={usageData?.fromDatetime}
        toDatetime={usageData?.toDatetime}
        customerTimezone={customerTimezone}
      />
    </section>
  )
}

export const SubscriptionCurrentUsageTable = ({
  customerId,
  subscriptionId,
}: SubscriptionCurrentUsageTableProps) => {
  const {
    data: customerData,
    loading: customerLoading,
    error: customerError,
  } = useCustomerForSubscriptionUsageQuery({
    variables: { customerId },
    skip: !customerId,
  })

  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscrptionForSubscriptionUsageQuery({
    variables: { subscription: subscriptionId },
  })

  const subscription = subscriptionData?.subscription

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
    refetch: refetchUsage,
  } = useUsageForSubscriptionUsageQuery({
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    variables: {
      customerId: (customerId || subscription?.customer.id) as string,
      subscriptionId: subscription?.id || '',
    },
    skip: !customerId || !subscription,
    fetchPolicy: 'no-cache',
  })

  return (
    <SubscriptionCurrentUsageTableComponent
      customerData={customerData?.customer}
      customerLoading={customerLoading}
      customerError={customerError}
      subscription={subscription}
      subscriptionLoading={subscriptionLoading}
      subscriptionError={subscriptionError}
      usageData={usageData?.customerUsage}
      usageLoading={usageLoading}
      usageError={usageError}
      refetchUsage={() => refetchUsage()}
    />
  )
}

export const SubscriptionCurrentUsageTableSkeleton = () => {
  return (
    <SkeletonItem>
      <Button size="small" variant="quaternary" disabled icon="chevron-right" />
      <Skeleton variant="connectorAvatar" size="big" marginRight="12px" />
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

const NoFocusLink = styled(Link)`
  text-decoration: none !important;
  /* Link as a button-like action here, and there is no place to display the focus ring, so better to hide it and break the internet */
  box-shadow: none !important;
`
