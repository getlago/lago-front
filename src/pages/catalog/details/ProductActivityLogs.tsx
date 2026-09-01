import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useProductActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query ProductActivityLogs(
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

interface ProductActivityLogsProps {
  productId: string | undefined
}

const ProductActivityLogs = ({ productId }: ProductActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useProductActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.Product],
      resourceIds: productId ? [productId] : undefined,
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    // Without the id guard the filter is dropped server-side and the query returns the
    // whole organization's activity log.
    skip: !canViewLogs || !productId,
  })

  return (
    <section className="flex flex-col gap-12">
      <section>
        <ActivityLogsSection
          subtitle={translate('text_1788165288458ilh83vbkt7a')}
          activityLogs={data?.activityLogs}
          loading={loading}
          error={error}
          refetch={refetch}
          fetchMore={fetchMore}
        />
      </section>
    </section>
  )
}

export default ProductActivityLogs
