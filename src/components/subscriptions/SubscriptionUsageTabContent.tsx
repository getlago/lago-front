import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import { theme } from '~/styles'

import { SubscriptionCurrentUsageTable } from './SubscriptionCurrentUsageTable'
import SubscriptionUsageLifetimeGraph from './SubscriptionUsageLifetimeGraph'

const SubscriptionUsageTabContent = () => {
  const { subscriptionId = '', customerId = '' } = useParams()

  return (
    <Container>
      <SubscriptionUsageLifetimeGraph customerId={customerId} subscriptionId={subscriptionId} />
      <SubscriptionCurrentUsageTable customerId={customerId} subscriptionId={subscriptionId} />
    </Container>
  )
}

export default SubscriptionUsageTabContent

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};
  padding-top: ${theme.spacing(8)};
`
