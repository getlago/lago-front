import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useFeatureDetailsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query FeatureDetailsActivityLogs(
    $page: Int
    $limit: Int
    $resourceTypes: [ResourceTypeEnum!]
    $resourceIds: [String!]
  ) {
    activityLogs(
      page: $page
      limit: $limit
      resourceTypes: $resourceTypes
      resourceIds: $resourceIds
    ) {
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

interface FeatureDetailsActivityLogsProps {
  featureId: string
}

export const FeatureDetailsActivityLogs = ({ featureId }: FeatureDetailsActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useFeatureDetailsActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.Feature],
      resourceIds: [featureId],
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div className="w-full px-4 pb-20 pt-6 md:px-12">
      <div className="flex flex-col gap-12">
        <div>
          <ActivityLogsSection
            subtitle={translate('text_1748867310812uxo0zoljxaj')}
            activityLogs={data?.activityLogs}
            loading={loading}
            error={error}
            refetch={refetch}
            fetchMore={fetchMore}
          />
        </div>
      </div>
    </div>
  )
}
