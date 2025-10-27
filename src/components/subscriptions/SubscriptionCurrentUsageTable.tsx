import { ApolloError, ApolloQueryResult, gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useRef, useState } from 'react'

import {
  SubscriptionUsageDetailDrawer,
  SubscriptionUsageDetailDrawerRef,
} from '~/components/customers/usage/SubscriptionUsageDetailDrawer'
import {
  Alert,
  Button,
  NavigationTab,
  Skeleton,
  Table,
  TabManagedBy,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { LagoGQLError } from '~/core/apolloClient'
import { LocalTaxProviderErrorsEnum } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import { LocaleEnum } from '~/core/translations'
import {
  ChargeUsage,
  CurrencyEnum,
  CustomerForSubscriptionUsageQuery,
  CustomerProjectedUsageForUsageDetailsFragmentDoc,
  CustomerUsageForUsageDetailsFragmentDoc,
  GetCustomerProjectedUsageForPortalQuery,
  GetCustomerUsageForPortalQuery,
  LagoApiError,
  PremiumIntegrationTypeEnum,
  ProjectedChargeUsage,
  ProjectedUsageForSubscriptionUsageQuery,
  StatusTypeEnum,
  SubscrptionForSubscriptionUsageQuery,
  TimezoneEnum,
  UsageForSubscriptionUsageQuery,
  useCustomerForSubscriptionUsageQuery,
  useProjectedUsageForSubscriptionUsageQuery,
  useSubscrptionForSubscriptionUsageQuery,
  useUsageForSubscriptionUsageQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

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

  fragment SubscriptionCurrentUsageTableComponentCustomerProjectedUsage on CustomerProjectedUsage {
    amountCents
    projectedAmountCents
    currency
    fromDatetime
    toDatetime
    chargesUsage {
      id
      units
      amountCents
      pricingUnitAmountCents
      projectedUnits
      projectedAmountCents
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
        projectedUnits
        projectedAmountCents
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

  query projectedUsageForSubscriptionUsage($customerId: ID!, $subscriptionId: ID!) {
    customerProjectedUsage(customerId: $customerId, subscriptionId: $subscriptionId) {
      amountCents
      projectedAmountCents
      ...SubscriptionCurrentUsageTableComponentCustomerProjectedUsage
      ...CustomerProjectedUsageForUsageDetails
    }
  }

  ${CustomerUsageForUsageDetailsFragmentDoc}
  ${CustomerProjectedUsageForUsageDetailsFragmentDoc}
`

interface SubscriptionCurrentUsageTableProps {
  customerId: string
  subscriptionId: string
}

export type UsageData = UsageForSubscriptionUsageQuery['customerUsage'] &
  ProjectedUsageForSubscriptionUsageQuery['customerProjectedUsage'] &
  GetCustomerUsageForPortalQuery['customerPortalCustomerUsage'] &
  GetCustomerProjectedUsageForPortalQuery['customerPortalCustomerProjectedUsage']

type SubscriptionCurrentUsageTableComponentProps = {
  usageData?: UsageData
  usageLoading: boolean
  usageError?: ApolloError

  subscription?: SubscrptionForSubscriptionUsageQuery['subscription']
  subscriptionLoading: boolean

  subscriptionError?: ApolloError

  customerData?: CustomerForSubscriptionUsageQuery['customer']
  customerLoading: boolean
  customerError?: ApolloError
  showExcludingTaxLabel?: boolean

  refetchUsage: (
    forceProjected?: boolean,
  ) => Promise<
    ApolloQueryResult<
      | UsageForSubscriptionUsageQuery
      | ProjectedUsageForSubscriptionUsageQuery
      | GetCustomerUsageForPortalQuery
      | GetCustomerProjectedUsageForPortalQuery
    >
  >

  noUsageOverride?: React.ReactNode

  translate: TranslateFunc
  locale?: LocaleEnum

  activeTab: number
  setActiveTab: (t: number) => void

  hasAccessToProjectedUsage?: boolean
}

export const getPricingUnitAmountCents = (
  row: {
    amountCents?: string | number
    pricingUnitAmountCents?: string | number
    pricingUnitProjectedAmountCents?: string | number
    projectedAmountCents?: string | number
  },
  isProjected?: boolean,
) => {
  return isProjected
    ? row.pricingUnitProjectedAmountCents || row.projectedAmountCents
    : row.pricingUnitAmountCents || row.amountCents
}

export type MixedCharge = {
  projectedAmountCents?: string | number
  amountCents?: string | number
  projectedUnits?: string | number
  units?: string | number
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
  activeTab,
  setActiveTab,
  hasAccessToProjectedUsage,
}: SubscriptionCurrentUsageTableComponentProps) => {
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const subscriptionUsageDetailDrawerRef = useRef<SubscriptionUsageDetailDrawerRef>(null)

  const currency = usageData?.currency || CurrencyEnum.Usd
  const isLoading = subscriptionLoading || usageLoading || customerLoading
  const hasError = !!subscriptionError || !!usageError || !!customerError
  const customerTimezone =
    customerData?.applicableTimezone ||
    subscription?.customer.applicableTimezone ||
    TimezoneEnum.TzUtc

  const showProjected = activeTab === 1

  const TRANSLATION_MAP = showProjected
    ? {
        title: translate('text_1753095692838zn4t5a0wrg1'),
        unitsHeader: translate('text_17531019276915hby502cvzy'),
        amountHeader: translate('text_1753101927691j5chrkhmoma'),
        emptyUsage:
          subscription?.status === StatusTypeEnum.Pending
            ? translate('text_1754662684478jvakvxllwie')
            : translate('text_1754662542899l1ms7k49n67'),
      }
    : {
        title: translate('text_17530956928381jy5n59318d'),
        unitsHeader: translate('text_1753095789277t9kbe8y5pmh'),
        amountHeader: translate('text_1753101927691fbbwyk7p39q'),
        emptyUsage:
          subscription?.status === StatusTypeEnum.Pending
            ? translate('text_173142196943714qsq737sre')
            : translate('text_62c3f454e5d7f4ec8888c1d7'),
      }

  const amountCentsKey = showProjected ? 'projectedAmountCents' : 'amountCents'
  const unitsKey = showProjected ? 'projectedUnits' : 'units'
  const showPremiumError = showProjected && !hasAccessToProjectedUsage

  const getFormattedDate = (date: string): string => {
    return intlFormatDateTime(date, {
      timezone: customerTimezone,
      locale,
    }).date
  }

  return (
    <section>
      <div className="flex h-10 flex-row items-start justify-between shadow-b">
        <div className="flex flex-row gap-2">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_1725983967306cf8dwr2r4u2')}
          </Typography>
          <Tooltip placement="top-start" title={translate('text_62d7f6178ec94cd09370e4b3')}>
            <Button
              variant="quaternary"
              icon="reload"
              size="small"
              className={tw(usageLoading && '[&>svg]:animate-spin')}
              disabled={usageLoading}
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
              fromDate: usageData?.fromDatetime ? getFormattedDate(usageData?.fromDatetime) : '-',
              toDate: usageData?.toDatetime ? getFormattedDate(usageData?.toDatetime) : '-',
            })}
          </Typography>
        )}
      </div>

      <NavigationTab
        managedBy={TabManagedBy.INDEX}
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
              subtitle={TRANSLATION_MAP.emptyUsage}
              image={<EmptyImage width="136" height="104" />}
            />
          )}
        </>
      )}

      {!hasError && !!usageData?.chargesUsage.length && showPremiumError && (
        <div className="mt-6 flex w-full flex-row items-center justify-between gap-2 rounded-xl bg-grey-100 px-6 py-4">
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2">
              <Typography variant="bodyHl" color="grey700">
                {translate('text_1755599398258j905gj9xihx')}
              </Typography>
              <Icon name="sparkles" />
            </div>

            <Typography variant="caption" color="grey600">
              {translate('text_1755599398258ce1ilgc5swg')}
            </Typography>
          </div>

          <Button
            endIcon="sparkles"
            variant="tertiary"
            onClick={() =>
              premiumWarningDialogRef.current?.openDialog({
                title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                mailtoSubject: translate('text_1755599398258mj61iwjhhfk'),
                mailtoBody: translate('text_1755599398258w59pin31rfe'),
              })
            }
          >
            {translate('text_65ae73ebe3a66bec2b91d72d')}
          </Button>
        </div>
      )}

      {!hasError && !!usageData?.chargesUsage.length && !showPremiumError && (
        <>
          <div className="flex h-12 flex-row items-center justify-between shadow-b">
            <Typography variant="bodyHl" color="grey700" noWrap>
              {TRANSLATION_MAP.title}{' '}
              {showExcludingTaxLabel ? translate('text_1753095789277h17a2varizl') : ''}
            </Typography>

            {isLoading ? (
              <Skeleton variant="text" className="w-36" />
            ) : (
              <Typography variant="bodyHl" color="grey700" noWrap>
                {intlFormatNumber(
                  deserializeAmount((usageData as MixedCharge)?.[amountCentsKey] || 0, currency) ||
                    0,
                  {
                    currencyDisplay: locale ? 'narrowSymbol' : 'symbol',
                    currency,
                    locale,
                  },
                )}
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
                    (groupedUsage) => Number((groupedUsage as MixedCharge)?.[unitsKey] || 0) > 0,
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
                                    row as ChargeUsage & ProjectedChargeUsage,
                                    async (forceProjected?: boolean) => {
                                      const { data } = await refetchUsage(forceProjected)

                                      let filtered = undefined

                                      if ('customerPortalCustomerUsage' in data) {
                                        filtered =
                                          data?.customerPortalCustomerUsage.chargesUsage.find(
                                            (usage) =>
                                              usage.billableMetric.id === row.billableMetric.id,
                                          ) as ChargeUsage | undefined
                                      } else if ('customerUsage' in data) {
                                        filtered = data?.customerUsage.chargesUsage.find(
                                          (usage) =>
                                            usage.billableMetric.id === row.billableMetric.id,
                                        ) as ChargeUsage | undefined
                                      } else if ('customerProjectedUsage' in data) {
                                        filtered = data?.customerProjectedUsage.chargesUsage.find(
                                          (usage) =>
                                            usage.billableMetric.id === row.billableMetric.id,
                                        ) as ChargeUsage | undefined
                                      } else if ('customerPortalCustomerProjectedUsage' in data) {
                                        filtered =
                                          data?.customerPortalCustomerProjectedUsage.chargesUsage.find(
                                            (usage) =>
                                              usage.billableMetric.id === row.billableMetric.id,
                                          ) as ChargeUsage | undefined
                                      }

                                      return filtered
                                    },
                                    activeTab,
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
                title: TRANSLATION_MAP.unitsHeader,
                textAlign: 'right',
                minWidth: 70,
                content: (row) => (
                  <Typography variant="body" color="grey700">
                    {(row as MixedCharge)?.[unitsKey]}
                  </Typography>
                ),
              },
              {
                key: 'amountCents',
                title: TRANSLATION_MAP.amountHeader,
                textAlign: 'right',
                minWidth: 100,
                content: (row) => {
                  const currencyDisplay = locale ? 'narrowSymbol' : 'symbol'

                  return (
                    <div className="flex flex-col">
                      <Typography variant="bodyHl" color="grey700">
                        {intlFormatNumber(
                          deserializeAmount(
                            getPricingUnitAmountCents(row, showProjected) || 0,
                            currency,
                          ),
                          {
                            currency,
                            locale,
                            currencyDisplay,
                            pricingUnitShortName:
                              row.charge.appliedPricingUnit?.pricingUnit?.shortName,
                          },
                        )}
                      </Typography>

                      {!!row.charge.appliedPricingUnit && (
                        <Typography variant="caption" color="grey600">
                          {intlFormatNumber(
                            deserializeAmount(
                              (row as MixedCharge)?.[amountCentsKey] || 0,
                              currency,
                            ),
                            {
                              currency,
                              locale,
                              currencyDisplay,
                            },
                          )}
                        </Typography>
                      )}
                    </div>
                  )
                },
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

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </section>
  )
}

export const SubscriptionCurrentUsageTable = ({
  customerId,
  subscriptionId,
}: SubscriptionCurrentUsageTableProps) => {
  const { translate } = useInternationalization()
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const [activeTab, setActiveTab] = useState<number>(0)

  const showProjected = activeTab === 1

  const hasAccessToProjectedUsage = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProjectedUsage,
  )

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

  const fetchProjected = hasAccessToProjectedUsage && showProjected

  const queryParams = {
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
    variables: {
      customerId: (customerId || subscription?.customer.id) as string,
      subscriptionId: subscription?.id || '',
    },
    skip: !customerId || !subscription || subscription.status === StatusTypeEnum.Pending,
    notifyOnNetworkStatusChange: true,
  }

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
    refetch: refetchUsageQuery,
  } = useUsageForSubscriptionUsageQuery({
    ...queryParams,
    skip: queryParams.skip || fetchProjected,
    // Removing the no-cache policies will break the rendered data
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

  const {
    data: usageDataProjected,
    loading: usageLoadingProjected,
    error: usageErrorProjected,
    refetch: refetchUsageQueryProjected,
  } = useProjectedUsageForSubscriptionUsageQuery({
    ...queryParams,
    skip: queryParams.skip || !fetchProjected,
    // Removing the no-cache policies will break the rendered data
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

  const refetchUsage = (forceProjected?: boolean) =>
    fetchProjected || forceProjected ? refetchUsageQueryProjected() : refetchUsageQuery()

  return (
    <SubscriptionCurrentUsageTableComponent
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      customerData={customerData?.customer}
      customerLoading={customerLoading}
      customerError={customerError}
      subscription={subscription}
      subscriptionLoading={subscriptionLoading}
      subscriptionError={subscriptionError}
      usageData={
        (usageDataProjected?.customerProjectedUsage || usageData?.customerUsage) as UsageData
      }
      usageLoading={usageLoadingProjected || usageLoading}
      usageError={usageErrorProjected || usageError}
      refetchUsage={refetchUsage}
      translate={translate}
      hasAccessToProjectedUsage={hasAccessToProjectedUsage}
    />
  )
}
