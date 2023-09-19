import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import {
  StatusTypeEnum,
  TimezoneEnum,
  useGetCustomerSubscriptionForUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

import { UsageItem, UsageItemSkeleton } from './UsageItem'

gql`
  fragment CustomerSubscriptionForUsage on Subscription {
    id
    name
    status
    plan {
      id
      name
      code
    }
  }

  query getCustomerSubscriptionForUsage($id: ID!) {
    customer(id: $id) {
      id
      subscriptions(status: [active, pending]) {
        id
        ...CustomerSubscriptionForUsage
      }
    }
  }
`

interface CustomerUsageProps {
  customerTimezone?: TimezoneEnum
}

export const CustomerUsage = ({ customerTimezone }: CustomerUsageProps) => {
  const { id } = useParams()
  const { translate } = useInternationalization()
  const { data, loading } = useGetCustomerSubscriptionForUsageQuery({
    variables: { id: id as string },
    skip: !id,
  })
  const subscriptions = data?.customer?.subscriptions

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
              <UsageItem
                key={subscription?.id}
                customerId={id as string}
                subscription={subscription}
                customerTimezone={customerTimezone}
              />
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
