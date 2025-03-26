import { useParams } from 'react-router-dom'

import { SubscriptionCurrentUsageTable } from './SubscriptionCurrentUsageTable'
import SubscriptionUsageLifetimeGraph from './SubscriptionUsageLifetimeGraph'

export const SubscriptionUsageTabContent = () => {
  const { subscriptionId = '', customerId = '' } = useParams()

  return (
    <div className="flex flex-col gap-12 pt-8">
      <SubscriptionUsageLifetimeGraph customerId={customerId} subscriptionId={subscriptionId} />
      <SubscriptionCurrentUsageTable customerId={customerId} subscriptionId={subscriptionId} />
    </div>
  )
}
