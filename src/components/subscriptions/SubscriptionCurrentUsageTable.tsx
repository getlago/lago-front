import { ApolloError, gql } from '@apollo/client'
import { useRef } from 'react'

import {
  SubscriptionUsageDetailDrawer,
  SubscriptionUsageDetailDrawerRef,
} from '~/components/customers/usage/SubscriptionUsageDetailDrawer'
import { Alert, Button, Skeleton, Table, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { LagoGQLError } from '~/core/apolloClient'
import { LocalTaxProviderErrorsEnum } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ, intlFormatDateTime } from '~/core/timezone'
import { LocaleEnum } from '~/core/translations'
import {
  ChargeUsage,
  CurrencyEnum,
  CustomerForSubscriptionUsageQuery,
  CustomerUsageForUsageDetailsFragmentDoc,
  GetCustomerUsageForPortalQuery,
  GetCustomerUsageForPortalQueryResult,
  LagoApiError,
  StatusTypeEnum,
  SubscrptionForSubscriptionUsageQuery,
  TimezoneEnum,
  UsageForSubscriptionUsageQuery,
  UsageForSubscriptionUsageQueryResult,
  useCustomerForSubscriptionUsageQuery,
  useSubscrptionForSubscriptionUsageQuery,
  useUsageForSubscriptionUsageQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

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
      status
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

  subscription?: SubscrptionForSubscriptionUsageQuery['subscription']
  subscriptionLoading: boolean

  subscriptionError?: ApolloError

  customerData?: CustomerForSubscriptionUsageQuery['customer']
  customerLoading: boolean
  customerError?: ApolloError
  showExcludingTaxLabel?: boolean

  refetchUsage:
    | UsageForSubscriptionUsageQueryResult['refetch']
    | GetCustomerUsageForPortalQueryResult['refetch']

  noUsageOverride?: React.ReactNode

  translate: TranslateFunc
  locale?: LocaleEnum
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
  showExcludingTaxLabel = false,

  refetchUsage,

  noUsageOverride,

  translate,
  locale,
}: SubscriptionCurrentUsageTableComponentProps) => {
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
      <div className="flex h-10 flex-row items-start justify-between shadow-b">
        <div className="flex flex-row gap-2">
          <Typography variant="subhead" color="grey700" noWrap>
            {translate('text_1725983967306cf8dwr2r4u2')}
          </Typography>
          <Tooltip placement="top-start" title={translate('text_62d7f6178ec94cd09370e4b3')}>
            <Button
              variant="quaternary"
              icon="reload"
              size="small"
              onClick={async () => {
                refetchUsage()
              }}
            />
          </Tooltip>
        </div>

        {isLoading && <Skeleton variant="text" className="mt-1 w-36" />}
        {!isLoading && !hasError && !!usageData?.fromDatetime && !!usageData?.toDatetime && (
          <Typography variant="caption" color="grey600" noWrap>
            {translate('text_633dae57ca9a923dd53c2097', {
              fromDate: locale
                ? intlFormatDateTime(usageData?.fromDatetime, {
                    timezone: customerTimezone,
                    locale,
                  }).date
                : formatDateToTZ(usageData?.fromDatetime, customerTimezone),
              toDate: locale
                ? intlFormatDateTime(usageData?.toDatetime, { timezone: customerTimezone, locale })
                    .date
                : formatDateToTZ(usageData?.toDatetime, customerTimezone),
            })}
          </Typography>
        )}
      </div>

      {!!hasError && !isLoading && (
        <>
          {(usageError?.graphQLErrors?.length || 0) > 0 &&
          usageError?.graphQLErrors.find((graphQLError) => {
            const { extensions } = graphQLError as LagoGQLError

            return extensions?.details?.taxError?.length
          }) ? (
            <Alert fullWidth type="warning" className="shadow-t">
              <div>
                <Typography variant="body" color="grey700">
                  {translate('text_1724165657161stcilcabm7x')}
                </Typography>

                <Typography variant="caption">
                  {translate(LocalTaxProviderErrorsEnum.GenericErrorMessage)}
                </Typography>
              </div>
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
      )}
      {!hasError && !isLoading && !usageData?.chargesUsage.length && (
        <>
          {noUsageOverride ? (
            noUsageOverride
          ) : (
            <GenericPlaceholder
              title={translate('text_62c3f454e5d7f4ec8888c1d5')}
              subtitle={
                subscription?.status === StatusTypeEnum.Pending
                  ? translate('text_173142196943714qsq737sre')
                  : translate('text_62c3f454e5d7f4ec8888c1d7')
              }
              image={<EmptyImage width="136" height="104" />}
            />
          )}
        </>
      )}
      {!hasError && usageData?.chargesUsage.length && (
        <>
          <div className="flex h-10 flex-row items-center justify-between">
            <Typography variant="bodyHl" color="grey700" noWrap>
              {showExcludingTaxLabel
                ? translate('text_17326286491076m81w5uy3el')
                : translate('text_62c3f3fca8a1625624e83380')}
            </Typography>

            {isLoading ? (
              <Skeleton variant="text" className="w-36" />
            ) : (
              <Typography variant="bodyHl" color="grey700" noWrap>
                {intlFormatNumber(deserializeAmount(usageData?.amountCents, currency) || 0, {
                  currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
                  currency,
                  locale,
                })}
              </Typography>
            )}
          </div>

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
                    <div className="py-3">
                      <Typography variant="body" color="grey700">
                        {row.charge.invoiceDisplayName || row.billableMetric?.name}
                      </Typography>
                      <div className="flex w-full flex-row gap-1">
                        <Typography variant="caption" color="grey600" component={'span'}>
                          {row.billableMetric?.code}
                          {(!!row.filters?.length ||
                            hasAnyGroupedUsageFilters ||
                            hasAnyGroupedUsageUnits) && (
                            <>
                              <Typography variant="caption" color="grey600" component={'span'}>
                                {' • '}
                              </Typography>
                              <button
                                className="h-auto whitespace-nowrap rounded-none p-0 text-purple-600 hover:underline focus:underline"
                                onClick={() => {
                                  subscriptionUsageDetailDrawerRef.current?.openDrawer(
                                    row as ChargeUsage,
                                    async () => {
                                      const { data } = await refetchUsage()

                                      if ('customerPortalCustomerUsage' in data) {
                                        return data?.customerPortalCustomerUsage.chargesUsage.find(
                                          (usage) =>
                                            usage.billableMetric.id === row.billableMetric.id,
                                        ) as ChargeUsage | undefined
                                      } else if ('customerUsage' in data) {
                                        return data?.customerUsage.chargesUsage.find(
                                          (usage) =>
                                            usage.billableMetric.id === row.billableMetric.id,
                                        ) as ChargeUsage | undefined
                                      }
                                    },
                                  )
                                }}
                              >
                                {translate('text_1725983967306c736sdyjohn')}
                              </button>
                            </>
                          )}
                        </Typography>
                      </div>
                    </div>
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
                      currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
                      locale,
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
        translate={translate}
        locale={locale}
      />
    </section>
  )
}

export const SubscriptionCurrentUsageTable = ({
  customerId,
  subscriptionId,
}: SubscriptionCurrentUsageTableProps) => {
  const { translate } = useInternationalization()

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
    skip: !customerId || !subscription || subscription.status === StatusTypeEnum.Pending,
    // No-cache policy to avoid caching the usage data
    // IDs in the usage data are not stable and can change, hence having inconsistent data in the Drawer
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
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
      translate={translate}
    />
  )
}
