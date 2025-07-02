import { gql } from '@apollo/client'
import { Typography } from 'lago-design-system'

import { InfiniteScroll, Table } from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { useGetSubscriptionsListLazyQuery } from '~/generated/graphql'
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
    plan {
      id
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

  query getSubscriptionsList($limit: Int, $page: Int, $searchTerm: String) {
    subscriptions(limit: $limit, page: $page, searchTerm: $searchTerm) {
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

  const [getSubscriptions, { data, error, loading, fetchMore, variables }] =
    useGetSubscriptionsListLazyQuery({
      variables: { limit: 20 },
    })

  const { debouncedSearch, isLoading } = useDebouncedSearch(getSubscriptions, loading)

  const subscriptions = data?.subscriptions.collection || []

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

        <InfiniteScroll
          onBottom={() => {
            const { currentPage = 0, totalPages = 0 } = data?.subscriptions.metadata || {}

            currentPage < totalPages &&
              !isLoading &&
              fetchMore({
                variables: { page: currentPage + 1 },
              })
          }}
        >
          <Table
            name="subscriptions-list"
            data={subscriptions}
            containerSize={{
              default: 16,
              md: 48,
            }}
            isLoading={isLoading}
            hasError={!!error}
            columns={[
              {
                key: 'name',
                title: 'Name',
                content: ({ id }) => id,
              },
            ]}
          />
        </InfiniteScroll>
      </PageHeader.Wrapper>
    </>
  )
}

export default SubscriptionsPage
