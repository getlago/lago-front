import { gql, useMutation, useQuery } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Table, TableColumn } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { Switch } from '~/components/form/Switch/Switch'
import { useIsAdminAuthenticated } from '~/hooks/auth/useIsAdminAuthenticated'

import { ADMIN_PORTAL_ORGANIZATIONS_ROUTE } from './routes'

const ADMIN_ORGANIZATION_QUERY = gql`
  query adminOrganization($id: ID!) {
    adminOrganization(id: $id) {
      id
      name
      createdAt
      premiumIntegrations
    }
  }
`

const ADMIN_PREMIUM_INTEGRATIONS_QUERY = gql`
  query adminPremiumIntegrations {
    adminPremiumIntegrations {
      name
      allowedForCurrentUser
    }
  }
`

const ADMIN_TOGGLE_PREMIUM_INTEGRATION = gql`
  mutation adminTogglePremiumIntegration($input: AdminTogglePremiumIntegrationInput!) {
    adminTogglePremiumIntegration(input: $input) {
      id
      premiumIntegrations
    }
  }
`

const ADMIN_PREMIUM_INTEGRATION_LOGS_QUERY = gql`
  query adminPremiumIntegrationLogs($organizationId: ID!, $page: Int, $limit: Int) {
    adminPremiumIntegrationLogs(organizationId: $organizationId, page: $page, limit: $limit) {
      collection {
        activityId
        activityType
        activitySource
        activityObjectChanges
        userEmail
        loggedAt
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

interface AdminOrg {
  adminOrganization: {
    id: string
    name: string
    createdAt: string
    premiumIntegrations: string[]
  }
}

interface PremiumIntegration {
  name: string
  allowedForCurrentUser: boolean
}

interface AdminPremiumIntegrationsResult {
  adminPremiumIntegrations: PremiumIntegration[]
}

interface AuditLogEntry {
  id: string
  activityId: string
  activityType: string
  activitySource: string
  activityObjectChanges: Record<string, unknown> | null
  userEmail: string | null
  loggedAt: string
}

interface AuditLogsResult {
  adminPremiumIntegrationLogs: {
    collection: AuditLogEntry[]
    metadata: {
      currentPage: number
      totalPages: number
      totalCount: number
    }
  }
}

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const navigate = useNavigate()

  const { canWrite } = useIsAdminAuthenticated()

  const { data, loading } = useQuery<AdminOrg>(ADMIN_ORGANIZATION_QUERY, {
    variables: { id: organizationId },
  })

  const { data: integrationsData, loading: integrationsLoading } =
    useQuery<AdminPremiumIntegrationsResult>(ADMIN_PREMIUM_INTEGRATIONS_QUERY)

  const [toggleIntegration] = useMutation(ADMIN_TOGGLE_PREMIUM_INTEGRATION, {
    refetchQueries: ['adminPremiumIntegrationLogs'],
  })

  const {
    data: logsData,
    loading: logsLoading,
    fetchMore: fetchMoreLogs,
  } = useQuery<AuditLogsResult>(ADMIN_PREMIUM_INTEGRATION_LOGS_QUERY, {
    variables: { organizationId, page: 1, limit: 20 },
    notifyOnNetworkStatusChange: true,
  })

  const org = data?.adminOrganization
  const allIntegrations = integrationsData?.adminPremiumIntegrations || []
  const enabledSet = new Set(org?.premiumIntegrations || [])

  const logs = (logsData?.adminPremiumIntegrationLogs?.collection || []).map((log) => ({
    ...log,
    id: log.activityId,
  }))
  const logsMetadata = logsData?.adminPremiumIntegrationLogs?.metadata

  const handleToggle = async (integration: string, enabled: boolean) => {
    const reason = window.prompt(
      `Reason for ${enabled ? 'enabling' : 'disabling'} "${integration.replace(/_/g, ' ')}":`
    )

    if (!reason) return

    await toggleIntegration({
      variables: {
        input: {
          organizationId,
          integration,
          enabled,
          reason,
          reasonCategory: 'other',
        },
      },
    })
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

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

  const logColumns: TableColumn<AuditLogEntry>[] = [
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
      content: ({ activitySource }) => (
        <Chip label={activitySource} size="small" />
      ),
    },
    {
      key: 'loggedAt',
      title: 'Date',
      minWidth: 160,
      content: ({ loggedAt }) => <Typography variant="caption">{formatDate(loggedAt)}</Typography>,
    },
  ]

  const isLoading = loading || integrationsLoading

  return (
    <div className="flex flex-col gap-8 p-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="quaternary"
          icon="arrow-left"
          size="small"
          onClick={() => navigate(generatePath(ADMIN_PORTAL_ORGANIZATIONS_ROUTE))}
        />
        {loading ? (
          <Skeleton variant="text" className="w-60" />
        ) : (
          <Typography variant="headline">{org?.name}</Typography>
        )}
      </div>

      {/* Organization Info */}
      <div className="rounded-xl border border-grey-300 bg-white p-8">
        <Typography variant="subhead1" className="mb-6">
          Organization Details
        </Typography>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="text" className="w-80" />
            ))}
          </div>
        ) : (
          org && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="grey600">
                  ID
                </Typography>
                <Typography variant="caption">{org.id}</Typography>
              </div>
              <div className="flex flex-col gap-1">
                <Typography variant="captionHl" color="grey600">
                  Created
                </Typography>
                <Typography>{formatDate(org.createdAt)}</Typography>
              </div>
            </div>
          )
        )}
      </div>

      {/* Premium Integrations */}
      <div className="rounded-xl border border-grey-300 bg-white p-8">
        <Typography variant="subhead1" className="mb-6">
          Premium Integrations
        </Typography>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="text" className="w-full max-w-100" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {allIntegrations.map(({ name, allowedForCurrentUser }) => {
              const isEnabled = enabledSet.has(name)

              return (
                <Switch
                  key={name}
                  name={name}
                  checked={isEnabled}
                  disabled={!canWrite || !allowedForCurrentUser}
                  label={name.replace(/_/g, ' ')}
                  onChange={(value) => handleToggle(name, value)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="rounded-xl border border-grey-300 bg-white p-8">
        <div className="mb-6 flex items-center gap-3">
          <Typography variant="subhead1">Audit Log</Typography>
          {logsMetadata && <Chip label={`${logsMetadata.totalCount}`} size="small" />}
        </div>

        <InfiniteScroll
          onBottom={async () => {
            const { currentPage = 0, totalPages = 0 } = logsMetadata || {}

            if (currentPage < totalPages && !logsLoading) {
              await fetchMoreLogs?.({
                variables: { page: currentPage + 1 },
              })
            }
          }}
        >
          <Table
            name="admin-audit-logs"
            containerSize={{ default: 0 }}
            rowSize={72}
            columns={logColumns}
            data={logs}
            isLoading={logsLoading && logs.length === 0}
            placeholder={{
              emptyState: {
                title: 'No audit logs yet',
                subtitle: 'Logs will appear here when premium integrations are toggled.',
              },
            }}
          />
        </InfiniteScroll>
      </div>
    </div>
  )
}

export default AdminOrganizationDetail
