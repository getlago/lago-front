import { gql } from '@apollo/client'
import { Icon, tw, Typography } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { InfiniteScroll, Status, StatusType } from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { SubscriptionsList } from '~/components/subscriptions/SubscriptionsList'
import { TimezoneDate } from '~/components/TimezoneDate'
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
      parent {
        id
      }
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
  ) {
    subscriptions(limit: $limit, page: $page, status: $status, searchTerm: $searchTerm) {
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

  const [getSubscriptions, { data, error, loading, fetchMore }] = useGetSubscriptionsListLazyQuery({
    variables: {
      limit: 20,
      status: [...Object.values(StatusTypeEnum)],
    },
  })

  const { debouncedSearch, isLoading } = useDebouncedSearch(getSubscriptions, loading)

  const subscriptions = data?.subscriptions.collection as Subscription[]

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

      <div className="overflow-y-auto">
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
                maxSpace: true,
                title: translate('Name'),
                content: ({ name, isDowngrade, isScheduled }) => (
                  <>
                    <div
                      className={tw('relative flex items-center gap-3', {
                        'pl-4': isDowngrade,
                      })}
                    >
                      {isDowngrade && <Icon name="arrow-indent" />}
                      <Typography className="text-base font-medium text-grey-700">
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
                      typographyClassName="text-nowrap text-base font-normal text-grey-600"
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
                      typographyClassName="text-nowrap text-base font-normal text-grey-600"
                      date={status === StatusTypeEnum.Terminated ? terminatedAt : endingAt}
                      customerTimezone={customer.applicableTimezone}
                    />
                  ) : (
                    <Typography>-</Typography>
                  ),
              },
            ]}
            actionColumnTooltip={() => translate('text_1751462194856885bttkg6wt')}
            onRowActionLink={({ id, customer }) =>
              generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
                customerId: customer.id,
                subscriptionId: id,
                tab: CustomerSubscriptionDetailsTabsOptionsEnum.overview,
              })
            }
          />
        </InfiniteScroll>
      </div>
    </>
  )
}

export default SubscriptionsPage
