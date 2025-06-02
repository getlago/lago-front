import { gql } from '@apollo/client'
import { FC } from 'react'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ActivityLogsTableDataFragmentDoc,
  useGetSubscriptionActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

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
  const { open, setUrl } = useDeveloperTool()

  const { data, loading, error, refetch } = useGetSubscriptionActivityLogsQuery({
    variables: { subscriptionId },
  })

  return (
    <div className="w-full px-12 pb-20 pt-8">
      <div className="flex flex-col gap-12">
        <div>
          <PageSectionTitle
            title={translate('text_1747314141347qq6rasuxisl')}
            subtitle={translate('text_17488665089772619td0qmi9')}
          />

          <ActivityLogsTable
            containerSize={4}
            data={data?.subscription?.activityLogs ?? []}
            hasError={!!error}
            isLoading={loading}
            refetch={refetch}
            onRowActionLink={(row) => {
              const url = buildLinkToActivityLog(row.activityId)

              open()
              setUrl(url)

              // We return an empty string to avoid the default behavior of the table
              return ''
            }}
          />
        </div>
      </div>
    </div>
  )
}
