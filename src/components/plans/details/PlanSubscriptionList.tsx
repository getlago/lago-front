import { gql } from '@apollo/client'
import styled from 'styled-components'

import { InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  PlanSubscriptionListItemForSubscriptionListFragmentDoc,
  StatusTypeEnum,
  useGetSubscribtionsForPlanDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { HEADER_TABLE_HEIGHT, theme } from '~/styles'
import { DetailsSectionTitle } from '~/styles/detailsPage'

import {
  PlanSubscriptionListItem,
  PlanSubscriptionListItemGridTemplate,
  PlanSubscriptionListItemSkeleton,
} from './PlanSubscriptionListItem'

gql`
  query getSubscribtionsForPlanDetails(
    $page: Int
    $limit: Int
    $planCode: String
    $status: [StatusTypeEnum!]
  ) {
    subscriptions(page: $page, limit: $limit, planCode: $planCode, status: $status) {
      collection {
        id
        ...PlanSubscriptionListItemForSubscriptionList
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }

  ${PlanSubscriptionListItemForSubscriptionListFragmentDoc}
`

const PlanSubscriptionList = ({ planCode }: { planCode?: string }) => {
  const { translate } = useInternationalization()
  const {
    data: subscriptionResult,
    loading: areSubscriptionsLoading,
    error: subscriptionsError,
    fetchMore: fetchMoreSubscriptions,
  } = useGetSubscribtionsForPlanDetailsQuery({
    variables: { planCode: planCode as string, limit: 20, status: [StatusTypeEnum.Active] },
    skip: !planCode,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  })
  const subscriptions = subscriptionResult?.subscriptions?.collection
  const displayLoadingState = areSubscriptionsLoading && !subscriptions?.length
  const displayEmptyState = !areSubscriptionsLoading && !subscriptions?.length

  return (
    <Container>
      <section>
        <CustomDetailsSectionTitle variant="subhead1" noWrap>
          {translate('text_65281f686a80b400c8e2f6be')}
        </CustomDetailsSectionTitle>

        {subscriptionsError ? (
          <GenericPlaceholder
            image={<ErrorImage width="136" height="104" />}
            title={translate('text_62bb102b66ff57dbfe7905c0')}
            subtitle={translate('text_62c3f3fca8a1625624e8337e')}
            buttonTitle={translate('text_62c3f3fca8a1625624e83382')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
          />
        ) : displayEmptyState ? (
          <GenericPlaceholder
            image={<EmptyImage width="136" height="104" />}
            title={translate('text_65281f686a80b400c8e2f6c3')}
            subtitle={translate('text_65281f686a80b400c8e2f6c6')}
          />
        ) : (
          <ScrollWrapper>
            <ListWrapper>
              <HeaderLine>
                <Typography variant="bodyHl" color="grey500" noWrap>
                  {translate('text_624efab67eb2570101d117be')}
                </Typography>
                <Typography variant="bodyHl" color="grey500" noWrap>
                  {translate('text_65281f686a80b400c8e2f6c4')}
                </Typography>
                <Typography variant="bodyHl" color="grey500" noWrap>
                  {translate('text_65201c5a175a4b0238abf29e')}
                </Typography>
                <Typography variant="bodyHl" color="disabled">
                  {translate('text_65201c5a175a4b0238abf2a0')}
                </Typography>
              </HeaderLine>

              {displayLoadingState && !subscriptions?.length ? (
                <SubscriptionListWrapper>
                  {[0, 1, 2].map((_, i) => (
                    <PlanSubscriptionListItemSkeleton
                      key={`plan-subscription-list-item-skeleton-${i}`}
                      className="plan-subscription-list-item"
                    />
                  ))}
                </SubscriptionListWrapper>
              ) : (
                <InfiniteScroll
                  onBottom={() => {
                    const { currentPage = 0, totalPages = 0 } =
                      subscriptionResult?.subscriptions?.metadata || {}

                    currentPage < totalPages &&
                      !areSubscriptionsLoading &&
                      fetchMoreSubscriptions({
                        variables: { page: currentPage + 1 },
                      })
                  }}
                >
                  {!!subscriptions?.length && (
                    <SubscriptionListWrapper>
                      {subscriptions?.map((subscription, i) => {
                        return (
                          <PlanSubscriptionListItem
                            key={`plan-subscription-list-item-${i}`}
                            className="plan-subscription-list-item"
                            subscriptionItem={subscription}
                          />
                        )
                      })}
                      {areSubscriptionsLoading &&
                        [0, 1, 2].map((_, i) => (
                          <PlanSubscriptionListItemSkeleton
                            key={`plan-subscription-list-item-loading-more-${i}`}
                            className="plan-subscription-list-item"
                          />
                        ))}
                    </SubscriptionListWrapper>
                  )}
                </InfiniteScroll>
              )}
            </ListWrapper>
          </ScrollWrapper>
        )}
      </section>
    </Container>
  )
}

export default PlanSubscriptionList

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};
`

const CustomDetailsSectionTitle = styled(DetailsSectionTitle)`
  box-shadow: ${theme.shadows[7]};
`

const ScrollWrapper = styled.div`
  overflow: auto;
`

const ListWrapper = styled.div`
  min-width: 0;
`

const SubscriptionListWrapper = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;

  .plan-subscription-list-item:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }
`

const HeaderLine = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: grid;
  align-items: center;
  ${PlanSubscriptionListItemGridTemplate()}
  padding: 0 ${theme.spacing(4)};
`
