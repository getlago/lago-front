import { FC, RefObject } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import { ActivityLogsTable as Table } from '~/components/activityLogs/ActivityLogsTable'
import { PaginatedContent } from '~/components/designSystem/Pagination'
import { ACTIVITY_LOG_ROUTE } from '~/components/developers/devtoolsRoutes'
import { ListSectionRef } from '~/components/developers/LogsLayout'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { ActivityLogsQueryResult } from '~/generated/graphql'

interface ActivityLogTableProps {
  getActivityLogsResult: ActivityLogsQueryResult
  logListRef: RefObject<ListSectionRef>
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
}

export const ActivityLogTable: FC<ActivityLogTableProps> = ({
  getActivityLogsResult,
  logListRef,
  pageSize,
  onPageSizeChange,
}) => {
  const [searchParams] = useSearchParams()
  const { data, error, loading, fetchMore, refetch } = getActivityLogsResult

  return (
    <PaginatedContent
      metadata={data?.activityLogs?.metadata}
      loading={loading}
      pageSize={pageSize}
      onPageChange={(page) => fetchMore({ variables: { page } })}
      onPageSizeChange={onPageSizeChange}
    >
      <Table
        data={data?.activityLogs?.collection ?? []}
        isLoading={loading}
        loadingRowCount={pageSize}
        error={error}
        refetch={refetch}
        onRowActionLink={({ activityId }) => {
          if (getCurrentBreakpoint() === 'sm') {
            logListRef.current?.updateView('forward')
          }

          const path = generatePath(ACTIVITY_LOG_ROUTE, {
            logId: activityId,
          })

          const query = searchParams.toString()
          const search = query ? `?${query}` : ''

          return `${path}${search}`
        }}
      />
    </PaginatedContent>
  )
}
