import { gql } from '@apollo/client'
import { FC } from 'react'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ActivityLogsTableDataFragmentDoc,
  useGetSubscriptionActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getSubscriptionActivityLogs($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      activityLogs {
        ...ActivityLogsTableData
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`

interface SubscriptionActivityLogsProps {
  subscriptionId: string
}

export const SubscriptionActivityLogs: FC<SubscriptionActivityLogsProps> = ({ subscriptionId }) => {
  const { translate } = useInternationalization()

  const { data, loading, error, refetch } = useGetSubscriptionActivityLogsQuery({
    variables: { subscriptionId },
  })

  return (
    <div className="w-full px-12 pb-20 pt-8">
      <div className="flex flex-col gap-12">
        <div>
          <PageSectionTitle
            title={translate('text_1747314141347qq6rasuxisl')}
            subtitle={translate('text_1748269135971fmdsm6bs8ig')}
          />

          <ActivityLogsTable
            containerSize={0}
            data={data?.subscription?.activityLogs ?? []}
            hasError={!!error}
            isLoading={loading}
            refetch={refetch}
          />
        </div>
      </div>
    </div>
  )
}
