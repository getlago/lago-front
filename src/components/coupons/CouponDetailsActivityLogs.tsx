import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useCouponDetailsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query CouponDetailsActivityLogs(
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

interface CouponDetailsActivityLogsProps {
  couponId: string
}

export const CouponDetailsActivityLogs = ({ couponId }: CouponDetailsActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useCouponDetailsActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.Coupon],
      resourceIds: [couponId],
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <div className="mt-6 flex flex-col gap-12">
      <div>
        <ActivityLogsSection
          subtitle={translate('text_17494781024812be7fqhzqxs')}
          activityLogs={data?.activityLogs}
          loading={loading}
          error={error}
          refetch={refetch}
          onPageChange={(page) => fetchMore({ variables: { page } })}
        />
      </div>
    </div>
  )
}
