import { FC, RefObject } from 'react'
import { generatePath } from 'react-router-dom'

import { ActivityLogsTable as Table } from '~/components/activityLogs/ActivityLogsTable'
import { InfiniteScroll } from '~/components/designSystem'
import { ACTIVITY_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { ListSectionRef } from '~/components/developers/LogsLayout'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { ActivityLogsQueryResult } from '~/generated/graphql'

interface ActivityLogTableProps {
  getActivityLogsResult: ActivityLogsQueryResult
  logListRef: RefObject<ListSectionRef>
}

export const ActivityLogTable: FC<ActivityLogTableProps> = ({
  getActivityLogsResult,
  logListRef,
}) => {
  const { data, error, loading, fetchMore, refetch } = getActivityLogsResult

  return (
    <InfiniteScroll
      mode="element"
      onBottom={async () => {
        const { currentPage = 0, totalPages = 0 } = data?.activityLogs?.metadata || {}

        if (currentPage < totalPages && !loading) {
          await fetchMore({
            variables: { page: currentPage + 1 },
          })
        }
      }}
    >
      <Table
        data={data?.activityLogs?.collection ?? []}
        hasError={!!error}
        isLoading={loading}
        refetch={refetch}
        onRowActionLink={({ activityId }) => {
          if (getCurrentBreakpoint() === 'sm') {
            logListRef.current?.updateView('forward')
          }

          return generatePath(ACTIVITY_LOG_ROUTE, {
            logId: activityId,
          })
        }}
      />
    </InfiniteScroll>
  )
}
