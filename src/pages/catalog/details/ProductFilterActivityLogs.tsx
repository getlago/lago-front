import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useProductFilterActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query ProductFilterActivityLogs(
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

interface ProductFilterActivityLogsProps {
  productFilterId: string
}

const ProductFilterActivityLogs = ({ productFilterId }: ProductFilterActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useProductFilterActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.ProductFilter],
      resourceIds: [productFilterId],
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
          subtitle={translate('text_17845928288679yi8tiutrl4')}
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

export default ProductFilterActivityLogs
