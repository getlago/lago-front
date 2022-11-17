import { gql } from '@apollo/client'
import styled from 'styled-components'

import { CustomerUsageSubscriptionFragment, StatusTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, NAV_HEIGHT } from '~/styles'
import { Typography } from '~/components/designSystem'

import { UsageItem, UsageItemSkeleton } from './UsageItem'

gql`
  fragment CustomerUsageSubscription on Subscription {
    id
    name
    status
    plan {
      id
      name
      code
    }
  }
`

interface CustomerUsageProps {
  id: string
  subscriptions: CustomerUsageSubscriptionFragment[]
  loading?: boolean
}

export const CustomerUsage = ({ loading, id, subscriptions }: CustomerUsageProps) => {
  const { translate } = useInternationalization()

  return (
    <div>
      <Header>
        <Title variant="subhead">{translate('text_62c3f3fca8a1625624e8337b')}</Title>
      </Header>
      {loading ? (
        <Content>
          {[0, 1, 2].map((i) => (
            <UsageItemSkeleton key={`customer-usage-skeleton-${i}`} />
          ))}
        </Content>
      ) : (
        <Content>
          {subscriptions
            ?.filter((s) => s.status === StatusTypeEnum.Active)
            .map((subscription) => (
              <UsageItem key={subscription?.id} customerId={id} subscription={subscription} />
            ))}
        </Content>
      )}
    </div>
  )
}

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled(Typography)`
  margin-right: ${theme.spacing(3)};
`

const Content = styled.div`
  > :not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`
