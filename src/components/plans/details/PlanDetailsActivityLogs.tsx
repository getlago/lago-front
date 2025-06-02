import { gql } from '@apollo/client'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { InfiniteScroll } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  ActivityLogsTableDataFragmentDoc,
  ResourceTypeEnum,
  usePlanDetailsActivityLogsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  query PlanDetailsActivityLogs(
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
      }
    }
  }

  ${ActivityLogsTableDataFragmentDoc}
`

interface PlanDetailsActivityLogsProps {
  planId: string
}

export const PlanDetailsActivityLogs = ({ planId }: PlanDetailsActivityLogsProps) => {
  const { translate } = useInternationalization()
  const { open, setUrl } = useDeveloperTool()

  const { data, loading, error, refetch, fetchMore } = usePlanDetailsActivityLogsQuery({
    variables: {
      resourceTypes: [ResourceTypeEnum.Plan],
      resourceIds: [planId],
      limit: 20,
    },
  })

  return (
    <div className="w-full px-12 pb-20 pt-8">
      <div className="flex flex-col gap-12">
        <div>
          <PageSectionTitle
            title={translate('text_1747314141347qq6rasuxisl')}
            subtitle={translate('text_1748867310812uxo0zoljxaj')}
          />

          <InfiniteScroll
            onBottom={async () => {
              const { currentPage = 0, totalPages = 0 } = data?.activityLogs?.metadata || {}

              if (currentPage < totalPages && !loading) {
                await fetchMore({
                  variables: { page: currentPage + 1 },
                })
              }
            }}
          >
            <ActivityLogsTable
              containerSize={4}
              data={data?.activityLogs?.collection ?? []}
              hasError={!!error}
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
          </InfiniteScroll>
        </div>
      </div>
    </div>
  )
}
