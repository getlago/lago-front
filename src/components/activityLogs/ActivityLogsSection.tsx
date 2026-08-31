import { ApolloError, QueryResult } from '@apollo/client'
import { FC } from 'react'

import { ActivityLogsTable } from '~/components/activityLogs/ActivityLogsTable'
import { buildLinkToActivityLog } from '~/components/activityLogs/utils'
import { PaginatedContent } from '~/components/designSystem/Pagination'
import { PageSectionTitle } from '~/components/layouts/Section'
import { ActivityLogsTableDataFragment, CollectionMetadata } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

/** The two pagination strategies activity-log lists use today: the resource detail tabs page
 *  through `fetchMore`, while the customer tab drives the page from the URL
 *  (`usePageSearchParam`), which `lago-pagination` prescribes for the customer-detail tabs. */
type ActivityLogsPaginationProps =
  | {
      /** The query's own `fetchMore` — the pager calls it with the target page */
      fetchMore: (options: { variables: { page: number } }) => void
      onPageChange?: never
    }
  | {
      /** Used when the page lives in the URL (`usePageSearchParam`) instead of in `fetchMore` */
      onPageChange: (page: number) => void
      fetchMore?: never
    }

type ActivityLogsSectionProps = ActivityLogsPaginationProps & {
  /** Resource-specific line under the shared "Activity logs" heading */
  subtitle: string
  /** The `activityLogs` field of the resource's own activity-logs query */
  activityLogs?: {
    collection: Array<ActivityLogsTableDataFragment>
    metadata: Pick<CollectionMetadata, 'currentPage' | 'totalPages' | 'totalCount'>
  } | null
  loading: boolean
  error: ApolloError | undefined
  refetch: QueryResult['refetch']
  /** Activity-log lists sit inside a scrolling detail tab, so the pager is not pinned by
   *  default. `InvoiceActivityLogs` is the exception and opts back in. */
  sticky?: boolean
}

/**
 * Heading + paginated `ActivityLogsTable` for a single resource's activity logs, with the
 * row click wired to the developer-tool panel.
 *
 * Every resource keeps its own query, because each filters the `activityLogs` field
 * differently (`resourceTypes`/`resourceIds`, `externalSubscriptionId`,
 * `externalCustomerId`), and its own outer wrapper, because each detail page has different
 * padding. This owns only the part that is identical everywhere.
 *
 * @example
 * <ActivityLogsSection
 *   subtitle={translate(SUBTITLE_KEY)}
 *   activityLogs={data?.activityLogs}
 *   loading={loading}
 *   error={error}
 *   refetch={refetch}
 *   fetchMore={fetchMore}
 * />
 */
export const ActivityLogsSection: FC<ActivityLogsSectionProps> = ({
  subtitle,
  activityLogs,
  loading,
  error,
  refetch,
  fetchMore,
  onPageChange,
  sticky = false,
}) => {
  const { translate } = useInternationalization()
  const { openPanel, setUrl } = useDeveloperTool()

  const handlePageChange = (page: number): void => {
    if (onPageChange) {
      onPageChange(page)

      return
    }

    fetchMore?.({ variables: { page } })
  }

  return (
    <>
      <PageSectionTitle title={translate('text_1747314141347qq6rasuxisl')} subtitle={subtitle} />

      <PaginatedContent
        metadata={activityLogs?.metadata}
        loading={loading}
        onPageChange={handlePageChange}
        sticky={sticky}
      >
        <ActivityLogsTable
          containerSize={4}
          data={activityLogs?.collection ?? []}
          error={error}
          isLoading={loading}
          refetch={refetch}
          onRowActionLink={(row) => {
            openPanel()
            setUrl(buildLinkToActivityLog(row.activityId))

            // We return an empty string to avoid the default behavior of the table
            return ''
          }}
        />
      </PaginatedContent>
    </>
  )
}
