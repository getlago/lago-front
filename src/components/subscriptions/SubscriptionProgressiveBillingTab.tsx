import { FC } from 'react'

import { Typography } from '~/components/designSystem'
import { GetSubscriptionForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface SubscriptionProgressiveBillingTabProps {
  subscription?: GetSubscriptionForDetailsQuery['subscription']
  loading?: boolean
}

export const SubscriptionProgressiveBillingTab: FC<SubscriptionProgressiveBillingTabProps> = ({
  subscription,
  loading,
}) => {
  const { translate } = useInternationalization()

  if (loading || !subscription) {
    return null
  }

  // TODO: Implement full tab content in LAGO-1106
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="subhead1">{translate('text_1724179887722baucvj7bvc1')}</Typography>
        <Typography variant="body" color="grey600">
          {translate('text_1724179887723kdf3nisf6hp')}
        </Typography>
      </div>
    </div>
  )
}
