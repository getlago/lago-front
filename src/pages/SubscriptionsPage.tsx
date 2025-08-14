import { gql } from '@apollo/client'
import { Icon, tw, Typography } from 'lago-design-system'
import { useMemo } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import { InfiniteScroll, Status, StatusType } from '~/components/designSystem'
import {
  Filters,
  formatFiltersForSubscriptionQuery,
  SubscriptionAvailableFilters,
} from '~/components/designSystem/Filters'
import { SearchInput } from '~/components/SearchInput'
import { SubscriptionsList } from '~/components/subscriptions/SubscriptionsList'
import { TimezoneDate } from '~/components/TimezoneDate'
import { SUBSCRIPTION_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE } from '~/core/router'
import { StatusTypeEnum, Subscription, useGetSubscriptionsListLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { PageHeader } from '~/styles'

gql`
  fragment SubscriptionForSubscriptionsList on Subscription {
    id
    status
    startedAt
    nextSubscriptionAt
    nextSubscriptionType
    name
    nextName
    externalId
    subscriptionAt
    endingAt
    terminatedAt
    customer {
      id
      name
      displayName
      applicableTimezone
    }
    plan {
      id
      isOverridden
      payInAdvance
      amountCurrency
      name
      interval
    }
    nextPlan {
      id
      name
      code
      interval
    }
    nextSubscription {
      id
      name
      externalId
      status
    }
  }

  query getSubscriptionsList(
    $limit: Int
    $page: Int
    $searchTerm: String
    $status: [StatusTypeEnum!]
    $externalCustomerId: String
    $overriden: Boolean
    $planCode: String
  ) {
    subscriptions(
      limit: $limit
      page: $page
      status: $status
      searchTerm: $searchTerm
      externalCustomerId: $externalCustomerId
      overriden: $overriden
      planCode: $planCode
    ) {
      collection {
        ...SubscriptionForSubscriptionsList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

const SubscriptionsPage = () => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()

  const filtersForSubscriptionQuery = useMemo(() => {
    return formatFiltersForSubscriptionQuery(searchParams)
  }, [searchParams])

  const [getSubscriptions, { data, error, loading, variables, fetchMore }] =
    useGetSubscriptionsListLazyQuery({
      notifyOnNetworkStatusChange: true,
      variables: {
        limit: 20,
        ...filtersForSubscriptionQuery,
      },
    })

  const { debouncedSearch, isLoading } = useDebouncedSearch(getSubscriptions, loading)

  const subscriptions = data?.subscriptions.collection as Subscription[]
  const hasSearchParams =
    !!variables &&
    Object.keys(variables).some(
      (key) => key !== 'page' && key !== 'limit' && !!variables[key as keyof typeof variables],
    )

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_6250304370f0f700a8fdc28d')}
        </Typography>

        <PageHeader.Group>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_1751378926655m4bfald61u4')}
          />
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <div className="box-border flex w-full flex-col gap-3 p-4 shadow-b md:px-12 md:py-3">
        <Filters.Provider
          filtersNamePrefix={SUBSCRIPTION_LIST_FILTER_PREFIX}
          availableFilters={SubscriptionAvailableFilters}
        >
          <Filters.Component />
        </Filters.Provider>
      </div>

      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = data?.subscriptions.metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore?.({
              variables: { page: currentPage + 1 },
            })
        }}
      >
        <SubscriptionsList
          name="subscriptions-list"
          isLoading={isLoading}
          hasError={!!error}
          subscriptions={subscriptions}
          containerSize={{
            default: 16,
            md: 48,
          }}
          columns={[
            {
              key: 'name',
              title: translate('text_6419c64eace749372fc72b0f'),
              content: ({ name, isDowngrade, isScheduled }) => (
                <>
                  <div
                    className={tw('relative flex items-center gap-3', {
                      'pl-4': isDowngrade,
                    })}
                  >
                    {isDowngrade && <Icon name="arrow-indent" />}
                    <Typography variant="bodyHl" color="grey700" noWrap>
                      {name}
                    </Typography>
                    {isDowngrade && <Status type={StatusType.default} label="downgrade" />}
                    {isScheduled && <Status type={StatusType.default} label="scheduled" />}
                  </div>
                </>
              ),
            },
            {
              key: 'statusType.type',
              title: translate('text_62d7f6178ec94cd09370e5fb'),
              content: ({ statusType }) => <Status {...statusType} />,
            },

            {
              key: 'customer.name',
              title: translate('text_63ac86d797f728a87b2f9fb3'),
              maxSpace: true,
              minWidth: 160,
              content: ({ customer }) => (
                <Typography variant="body" noWrap>
                  {customer?.displayName || customer?.name || '-'}
                </Typography>
              ),
            },

            {
              key: 'isOverriden',
              title: translate('text_65281f686a80b400c8e2f6c4'),
              content: ({ isOverriden }) => (
                <Typography>
                  {isOverriden
                    ? translate('text_65281f686a80b400c8e2f6dd')
                    : translate('text_65281f686a80b400c8e2f6d1')}
                </Typography>
              ),
            },

            {
              key: 'frequency',
              title: translate('text_1736968618645gg26amx8djq'),
              content: ({ frequency }) => (
                <Typography>{translate(getIntervalTranslationKey[frequency])}</Typography>
              ),
            },

            {
              key: 'startedAt',
              title: translate('text_65201c5a175a4b0238abf29e'),
              content: ({ startedAt, customer }) =>
                !!startedAt ? (
                  <TimezoneDate
                    mainTypographyProps={{ variant: 'body', color: 'grey600', noWrap: true }}
                    date={startedAt}
                    customerTimezone={customer.applicableTimezone}
                  />
                ) : (
                  <Typography>-</Typography>
                ),
            },
            {
              key: 'endingAt',
              title: translate('text_65201c5a175a4b0238abf2a0'),
              content: ({ endingAt, status, terminatedAt, customer }) =>
                endingAt || terminatedAt ? (
                  <TimezoneDate
                    mainTypographyProps={{ variant: 'body', color: 'grey600', noWrap: true }}
                    date={status === StatusTypeEnum.Terminated ? terminatedAt : endingAt}
                    customerTimezone={customer.applicableTimezone}
                  />
                ) : (
                  <Typography>-</Typography>
                ),
            },
          ]}
          actionColumnTooltip={() => translate('text_634687079be251fdb438338f')}
          onRowActionLink={({ id, customer }) =>
            generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
              customerId: customer.id,
              subscriptionId: id,
              tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
            })
          }
          placeholder={{
            errorState: hasSearchParams
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_63ac86d797f728a87b2f9fea'),
                  subtitle: translate('text_63ac86d797f728a87b2f9ff2'),
                  buttonTitle: translate('text_63ac86d797f728a87b2f9ffa'),
                  buttonAction: () => location.reload(),
                  buttonVariant: 'primary',
                },
            emptyState: hasSearchParams
              ? {
                  title: translate('text_1751969008731sd4e2mssx90'),
                  subtitle: translate('text_66ab48ea4ed9cd01084c60b8'),
                }
              : {
                  title: translate('text_1751969008731m6hlinilrky'),
                  subtitle: translate('text_1751969070668mwxq0nou1x9'),
                },
          }}
        />
      </InfiniteScroll>
    </>
  )
}

export default SubscriptionsPage
