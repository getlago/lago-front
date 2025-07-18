import { PageSectionTitle } from '~/components/layouts/Section'
import { useInternationalization } from '~/hooks/core/useInternationalization'

// gql`
//   query FeatureActivityLogs(
//     $page: Int
//     $limit: Int
//     $resourceTypes: [ResourceTypeEnum!]
//     $resourceIds: [String!]
//   ) {
//     activityLogs(
//       page: $page
//       limit: $limit
//       resourceTypes: $resourceTypes
//       resourceIds: $resourceIds
//     ) {
//       collection {
//         ...ActivityLogsTableData
//       }
//       metadata {
//         currentPage
//         totalPages
//       }
//     }
//   }

//   ${ActivityLogsTableDataFragmentDoc}
// `

export const FeatureDetailsActivityLogs = () => {
  // const { featureId } = useParams()
  const { translate } = useInternationalization()
  // const { open, setUrl } = useDeveloperTool()
  // const { hasPermissions } = usePermissions()
  // const { isPremium } = useCurrentUser()

  // const canViewLogs = isPremium && hasPermissions(['auditLogsView'])

  // const { data, loading, error, refetch, fetchMore } = useBillableMetricActivityLogsQuery({
  //   variables: {
  //     resourceTypes: [ResourceTypeEnum.Feature],
  //     resourceIds: [featureId],
  //     limit: 20,
  //   },
  //   skip: !canViewLogs,
  // })

  return (
    <section className="flex flex-col gap-12">
      <section>
        <PageSectionTitle
          title={translate('text_1747314141347qq6rasuxisl')}
          subtitle={translate('text_17494776679387rw801ygf0e')}
        />

        {/* <InfiniteScroll
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
        </InfiniteScroll> */}
      </section>
    </section>
  )
}
