import { gql } from '@apollo/client'
import { FC } from 'react'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  useSubscriptionActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query SubscriptionActivityLogs($page: Int, $limit: Int, $externalSubscriptionId: String) {
    activityLogs(page: $page, limit: $limit, externalSubscriptionId: $externalSubscriptionId) {
      collection {
        ...ActivityLogsTableData
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`

interface SubscriptionActivityLogsProps {
  externalSubscriptionId: string
}

export const SubscriptionActivityLogs: FC<SubscriptionActivityLogsProps> = ({
  externalSubscriptionId,
}) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useSubscriptionActivityLogsQuery({
    variables: {
      externalSubscriptionId: externalSubscriptionId,
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div className="w-full pb-20 pt-6">
      <div className="flex flex-col gap-12">
        <div>
          <ActivityLogsSection
            subtitle={translate('text_17488665089772619td0qmi9')}
            activityLogs={data?.activityLogs}
            loading={loading}
            error={error}
            refetch={refetch}
            onPageChange={(page) => fetchMore({ variables: { page } })}
          />
        </div>
      </div>
    </div>
  )
}
