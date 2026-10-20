import { gql } from '@apollo/client'

import { ActivityLogsSection } from '~/components/activityLogs/ActivityLogsSection'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useAppliedRateCardActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

import { AppliedRateCardContext } from '../types'

gql`
  query AppliedRateCardActivityLogs(
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

const RESOURCE_TYPE_BY_CONTEXT: Record<AppliedRateCardContext, ResourceTypeEnum> = {
  plan: ResourceTypeEnum.PlanRateCard,
  contract: ResourceTypeEnum.ContractRateCard,
}

type AppliedRateCardActivityLogsProps = {
  context: AppliedRateCardContext
  appliedRateCardId: string
}

export const AppliedRateCardActivityLogs = ({
  context,
  appliedRateCardId,
}: AppliedRateCardActivityLogsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useAppliedRateCardActivityLogsQuery({
    variables: {
      resourceTypes: [RESOURCE_TYPE_BY_CONTEXT[context]],
      resourceIds: [appliedRateCardId],
      limit: DEFAULT_PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
    context: {
      silentErrorCodes: [LagoApiError.FeatureUnavailable],
    },
    skip: !canViewLogs,
  })

  return (
    <section className="flex flex-1 flex-col gap-12">
      <section className="flex flex-1 flex-col">
        <ActivityLogsSection
          subtitle={translate('text_1792506302406m3twa4pwimw')}
          activityLogs={data?.activityLogs}
          loading={loading}
          error={error}
          refetch={refetch}
          fetchMore={fetchMore}
          sticky
          containerClassName="-mb-px h-auto shrink-0 border-t border-grey-300"
        />
      </section>
    </section>
  )
}
