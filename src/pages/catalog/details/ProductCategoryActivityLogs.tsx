import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useProductCategoryActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query ProductCategoryActivityLogs(
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

interface ProductCategoryActivityLogsProps {
  productCategoryId: string | undefined
}

const ProductCategoryActivityLogs = ({ productCategoryId }: ProductCategoryActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useProductCategoryActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.ProductCategory],
      resourceIds: productCategoryId ? [productCategoryId] : undefined,
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    // Without the id guard the filter is dropped server-side and the query returns the
    // whole organization's activity log.
    skip: !canViewLogs || !productCategoryId,
  })

  return (
    <section className="flex flex-col gap-12">
      <section>
        <ActivityLogsSection
          subtitle={translate('text_1788164971209jpekwrfqvn6')}
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

export default ProductCategoryActivityLogs
