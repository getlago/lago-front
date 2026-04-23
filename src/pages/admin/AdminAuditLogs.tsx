import { gql, useLazyQuery } from '@apollo/client'

import { Chip } from '~/components/designSystem/Chip'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table, TableColumn } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

const ADMIN_ALL_LOGS_QUERY = gql`
  query adminAllPremiumIntegrationLogs($searchTerm: String, $page: Int, $limit: Int) {
    adminAllPremiumIntegrationLogs(searchTerm: $searchTerm, page: $page, limit: $limit) {
      collection {
        activityId
        activityType
        activitySource
        activityObjectChanges
        userEmail
        loggedAt
        organization {
          name
        }
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

interface AuditLogEntry {
  id: string
  activityId: string
  activityType: string
  activitySource: string
  activityObjectChanges: Record<string, unknown> | null
  userEmail: string | null
  loggedAt: string
  organization: { name: string } | null
}

interface AllLogsResult {
  adminAllPremiumIntegrationLogs: {
    collection: AuditLogEntry[]
    metadata: {
      currentPage: number
      totalPages: number
      totalCount: number
    }
  }
}

const parseChanges = (changes: Record<string, unknown> | null) => {
  if (!changes) return null

  const entries = Object.entries(changes)
    .filter(([key]) => key !== '__typename')
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ')

      if (Array.isArray(value) && value.length === 2) {
        return `${formattedKey}: ${String(value[0])} → ${String(value[1])}`
      }

      return `${formattedKey}: ${JSON.stringify(value)}`
    })

  return entries.join(', ')
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const AdminAuditLogs = () => {
  const [getLogs, { data, loading, fetchMore }] = useLazyQuery<AllLogsResult>(
    ADMIN_ALL_LOGS_QUERY,
    {
      variables: { page: 1, limit: 25 },
      notifyOnNetworkStatusChange: true,
    },
  )

  const { debouncedSearch, isLoading } = useDebouncedSearch(getLogs, loading)

  const logs = (data?.adminAllPremiumIntegrationLogs?.collection || []).map((log) => ({
    ...log,
    id: log.activityId,
  }))
  const metadata = data?.adminAllPremiumIntegrationLogs?.metadata

  const columns: TableColumn<AuditLogEntry>[] = [
    {
      key: 'organization.name',
      title: 'Organization',
      content: ({ organization }) => (
        <Typography variant="bodyHl">{organization?.name || '—'}</Typography>
      ),
    },
    {
      key: 'userEmail',
      title: 'User',
      content: ({ userEmail }) => (
        <Typography variant="caption">{userEmail || 'system'}</Typography>
      ),
    },
    {
      key: 'activityType',
      title: 'Changes',
      maxSpace: true,
      content: ({ activityObjectChanges }) => (
        <Typography variant="caption" color="grey600">
          {parseChanges(activityObjectChanges) || '—'}
        </Typography>
      ),
    },
    {
      key: 'activitySource',
      title: 'Source',
      content: ({ activitySource }) => <Chip label={activitySource} size="small" />,
    },
    {
      key: 'loggedAt',
      title: 'Date',
      minWidth: 160,
      content: ({ loggedAt }) => <Typography variant="caption">{formatDate(loggedAt)}</Typography>,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Typography variant="headline">Audit Logs</Typography>
          {metadata && <Chip label={`${metadata.totalCount}`} size="small" />}
        </div>

        <SearchInput
          onChange={debouncedSearch}
          placeholder="Filter by organization name or ID..."
        />
      </div>

      <InfiniteScroll
        onBottom={async () => {
          const { currentPage = 0, totalPages = 0 } = metadata || {}

          if (currentPage < totalPages && !isLoading) {
            await fetchMore?.({
              variables: { page: currentPage + 1 },
            })
          }
        }}
      >
        <Table
          name="admin-all-audit-logs"
          containerSize={{ default: 0 }}
          rowSize={72}
          columns={columns}
          data={logs}
          isLoading={isLoading}
          placeholder={{
            emptyState: {
              title: 'No audit logs',
              subtitle: 'No premium integration changes recorded yet.',
            },
          }}
        />
      </InfiniteScroll>
    </div>
  )
}

export default AdminAuditLogs
