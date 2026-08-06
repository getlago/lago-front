import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PaginatedContent } from '~/components/designSystem/Pagination'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ActivityLogsTableDataFragmentDoc,
  LagoApiError,
  ResourceTypeEnum,
  useProductItemFilterActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  query ProductItemFilterActivityLogs(
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

interface ProductItemFilterActivityLogsProps {
  productItemFilterId: string
}

const ProductItemFilterActivityLogs = ({
  productItemFilterId,
}: ProductItemFilterActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { openPanel: open, setUrl } = useDeveloperTool()
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()

  const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  const { data, loading, error, refetch, fetchMore } = useProductItemFilterActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.ProductItemFilter],
      resourceIds: [productItemFilterId],
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
        <div className="flex h-18 items-center justify-between gap-4">
          <div className="flex flex-col">
            <Typography variant="subhead1" color="grey700" noWrap>
              {translate('text_1747314141347qq6rasuxisl')}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {translate('text_17845928288679yi8tiutrl4')}
            </Typography>
          </div>
        </div>

        <PaginatedContent
          metadata={data?.activityLogs?.metadata}
          loading={loading}
          onPageChange={(page) => fetchMore({ variables: { page } })}
          sticky={false}
        >
          <ActivityLogsTable
            containerSize={4}
            data={data?.activityLogs?.collection ?? []}
            error={error}
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
        </PaginatedContent>
      </section>
    </section>
  )
}

export default ProductItemFilterActivityLogs
