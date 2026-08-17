import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useBillableMetricActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query BillableMetricActivityLogs(
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

interface BillableMetricDetailsActivityLogsProps {
  billableMetricId: string
}

export const BillableMetricDetailsActivityLogs = ({
  billableMetricId,
}: BillableMetricDetailsActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useBillableMetricActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.BillableMetric],
      resourceIds: [billableMetricId],
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <section className="flex flex-col gap-12">
      <section>
        <ActivityLogsSection
          subtitle={translate('text_1748269135971fmdsm6bs8ig')}
          activityLogs={data?.activityLogs}
          loading={loading}
          error={error}
          refetch={refetch}
          onPageChange={(page) => fetchMore({ variables: { page } })}
        />
      </section>
    </section>
  )
}
