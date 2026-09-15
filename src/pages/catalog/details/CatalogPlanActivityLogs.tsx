import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useCatalogPlanActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query CatalogPlanActivityLogs(
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

interface CatalogPlanActivityLogsProps {
  catalogPlanId?: string
}

const CatalogPlanActivityLogs = ({ catalogPlanId }: CatalogPlanActivityLogsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useCatalogPlanActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.CatalogPlan],
      resourceIds: catalogPlanId ? [catalogPlanId] : undefined,
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: { silentErrorCodes: [LagoApiError.FeatureUnavailable] },
    // Without the id guard the filter is dropped server-side and the query returns the
    // whole organization's activity log.
    skip: !canViewLogs || !catalogPlanId,
  })

  return (
    <section>
      <ActivityLogsSection
        subtitle={translate('text_1748867310812uxo0zoljxaj')}
        activityLogs={data?.activityLogs}
        loading={loading}
        error={error}
        refetch={refetch}
        fetchMore={fetchMore}
      />
    </section>
  )
}

export default CatalogPlanActivityLogs
