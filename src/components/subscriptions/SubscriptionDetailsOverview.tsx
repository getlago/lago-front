import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  SubscriptionForSubscriptionInformationsFragmentDoc,
  useGetSubscriptionForDetailsOverviewQuery,
} from '~/generated/graphql'
import { theme } from '~/styles'

import SubscriptionInformations from './SubscriptionInformations'

import PlanDetailsOverview from '../plans/details/PlanDetailsOverview'
import SkeletonDetailsPage from '../SkeletonDetailsPage'

gql`
  query getSubscriptionForDetailsOverview($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      plan {
        id
      }
      ...SubscriptionForSubscriptionInformations
    }
  }

  ${SubscriptionForSubscriptionInformationsFragmentDoc}
`

const SubscriptionDetailsOverview = () => {
  const { subscriptionId } = useParams()
  const { data: subscriptionResult, loading: isSubscriptionLoading } =
    useGetSubscriptionForDetailsOverviewQuery({
      variables: { subscriptionId: subscriptionId as string },
      skip: !subscriptionId,
    })
  const subscription = subscriptionResult?.subscription

  if (isSubscriptionLoading) {
    return (
      <LoadingSkeletonWrapper>
        <SkeletonDetailsPage />
        <SkeletonDetailsPage />
      </LoadingSkeletonWrapper>
    )
  }

  return (
    <Container>
      <SubscriptionInformations subscription={subscription} />
      <PlanDetailsOverview planId={subscription?.plan.id} />
    </Container>
  )
}

export default SubscriptionDetailsOverview

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};
`

const LoadingSkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};
`
