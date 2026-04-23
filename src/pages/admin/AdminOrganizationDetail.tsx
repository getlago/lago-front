import { gql, useMutation, useQuery } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { Switch } from '~/components/form/Switch/Switch'
import { useIsAdminAuthenticated } from '~/hooks/auth/useIsAdminAuthenticated'

import { ReasonModal } from './components/ReasonModal'
import { ADMIN_PORTAL_AUDIT_ROUTE, ADMIN_PORTAL_ORGANIZATIONS_ROUTE } from './routes'

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

// Flag group definitions
const FLAG_GROUPS: { name: string; description: string; flags: string[] }[] = [
  {
    name: 'Billing & invoicing',
    description: 'Invoice generation, payments, and billing features',
    flags: [
      'progressive_billing',
      'lifetime_usage',
      'granular_lifetime_usage',
      'auto_dunning',
      'manual_payments',
      'issue_receipts',
      'preview',
      'remove_branding_watermark',
      'from_email',
    ],
  },
  {
    name: 'Analytics & forecasting',
    description: 'Revenue analytics, dashboards, and usage forecasting',
    flags: [
      'revenue_analytics',
      'analytics_dashboards',
      'forecasted_usage',
      'projected_usage',
      'revenue_share',
    ],
  },
  {
    name: 'Accounting & tax',
    description: 'Third-party accounting and tax integrations',
    flags: ['netsuite', 'xero', 'hubspot', 'salesforce', 'avalara'],
  },
  {
    name: 'Platform & security',
    description: 'SSO, roles, permissions, and multi-entity management',
    flags: [
      'okta',
      'custom_roles',
      'api_permissions',
      'security_logs',
      'multi_entities_pro',
      'multi_entities_enterprise',
    ],
  },
  {
    name: 'Experimental',
    description: 'Beta features and experimental functionality',
    flags: ['beta_payment_authorization', 'events_targeting_wallets'],
  },
]

interface ModalTarget {
  integrationName: string
  enabling: boolean
}

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const navigate = useNavigate()
  const { canWrite } = useIsAdminAuthenticated()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)

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
  } = useQuery<AuditLogsResult>(ADMIN_PREMIUM_INTEGRATION_LOGS_QUERY, {
    variables: { organizationId, page: 1, limit: 10 },
    notifyOnNetworkStatusChange: true,
  })

  const org = data?.adminOrganization
  const allIntegrations = integrationsData?.adminPremiumIntegrations || []
  const enabledSet = new Set(org?.premiumIntegrations || [])
  const integrationMap = new Map(allIntegrations.map((i) => [i.name, i]))

  const logs = (logsData?.adminPremiumIntegrationLogs?.collection || []).map((log) => ({
    ...log,
    id: log.activityId,
  }))

  const handleToggleClick = (integration: string, enabled: boolean) => {
    setModalTarget({ integrationName: integration, enabling: enabled })
    setModalOpen(true)
  }

  const handleModalConfirm = async (reason: string, reasonCategory: string) => {
    if (!modalTarget) return

    await toggleIntegration({
      variables: {
        input: {
          organizationId,
          integration: modalTarget.integrationName,
          enabled: modalTarget.enabling,
          reason,
          reasonCategory,
        },
      },
    })

    setModalOpen(false)
    setModalTarget(null)
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    setModalTarget(null)
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)

      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }

      return next
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

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`

    return `${diffDays}d ago`
  }

  const parseChanges = (changes: Record<string, unknown> | null) => {
    if (!changes) return null

    const entries = Object.entries(changes)
      .filter(([key]) => key !== '__typename')
      .map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ')

        if (Array.isArray(value) && value.length === 2) {
          return `${formattedKey}: ${String(value[0])} \u2192 ${String(value[1])}`
        }

        return `${formattedKey}: ${JSON.stringify(value)}`
      })

    return entries.join(', ')
  }

  const isLoading = loading || integrationsLoading

  // Collect flags that exist in the backend but are not in any group
  const groupedFlagSet = new Set(FLAG_GROUPS.flatMap((g) => g.flags))
  const ungroupedFlags = allIntegrations
    .filter((i) => !groupedFlagSet.has(i.name))
    .map((i) => i.name)

  const allGroups = ungroupedFlags.length > 0
    ? [
        ...FLAG_GROUPS,
        {
          name: 'Other',
          description: 'Additional integrations',
          flags: ungroupedFlags,
        },
      ]
    : FLAG_GROUPS

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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_380px]">
        {/* Left column: Flag Groups */}
        <div className="flex flex-col gap-4">
          <Typography variant="subhead1">Premium Integrations</Typography>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="text" className="w-full max-w-100" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allGroups.map((group) => {
                const groupFlags = group.flags.filter((f) => integrationMap.has(f))
                const enabledCount = groupFlags.filter((f) => enabledSet.has(f)).length
                const isExpanded = expandedGroups.has(group.name)

                return (
                  <div
                    key={group.name}
                    className="overflow-hidden rounded-xl border border-grey-300 bg-white"
                  >
                    {/* Group header */}
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left transition-colors hover:bg-grey-100"
                      onClick={() => toggleGroup(group.name)}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <Typography variant="bodyHl">{group.name}</Typography>
                          <Chip
                            label={`${enabledCount} / ${groupFlags.length} enabled`}
                            size="small"
                          />
                        </div>
                        <Typography variant="caption" color="grey600">
                          {group.description}
                        </Typography>
                      </div>
                      <Icon
                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                        color="dark"
                        size="medium"
                      />
                    </button>

                    {/* Group body */}
                    {isExpanded && (
                      <div className="border-t border-grey-200">
                        {groupFlags.map((flagName) => {
                          const integration = integrationMap.get(flagName)
                          const isEnabled = enabledSet.has(flagName)
                          const isDisabled = !canWrite || !integration?.allowedForCurrentUser

                          return (
                            <div
                              key={flagName}
                              className="flex items-center justify-between border-b border-grey-100 px-6 py-3 last:border-b-0"
                            >
                              <div className="flex flex-col gap-1">
                                <Typography variant="body" color="textSecondary">
                                  {flagName.replace(/_/g, ' ')}
                                </Typography>
                                <Chip
                                  label={flagName}
                                  size="small"
                                  variant="captionCode"
                                />
                              </div>
                              <Switch
                                name={flagName}
                                checked={isEnabled}
                                disabled={isDisabled}
                                onChange={(value) => handleToggleClick(flagName, value)}
                              />
                            </div>
                          )
                        })}
                        {groupFlags.length === 0 && (
                          <div className="px-6 py-4">
                            <Typography variant="caption" color="grey500">
                              No flags in this group match available integrations.
                            </Typography>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: Mini Audit Log */}
        <div className="sticky top-20 rounded-xl border border-grey-300 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Typography variant="subhead1">Recent activity</Typography>
              <Chip label="this org" size="small" />
            </div>
          </div>

          {logsLoading && logs.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="text" className="w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Typography variant="body" color="grey600">
                No activity yet
              </Typography>
              <Typography variant="caption" color="grey500">
                Logs will appear here when integrations are toggled.
              </Typography>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.slice(0, 8).map((log) => {
                const changes = parseChanges(log.activityObjectChanges)
                const isEnable = changes?.includes('\u2192 true') || changes?.includes('\u2192 enabled')

                return (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 border-b border-grey-100 pb-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <Typography variant="captionHl" color="grey700">
                        {log.userEmail || 'system'}
                      </Typography>
                      <Typography variant="note" color="grey500">
                        {formatRelativeTime(log.loggedAt)}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip
                        label={isEnable ? 'enabled' : 'disabled'}
                        size="small"
                        type={isEnable ? 'primary' : undefined}
                      />
                      {changes && (
                        <Typography variant="caption" color="grey600" className="truncate">
                          {changes}
                        </Typography>
                      )}
                    </div>
                  </div>
                )
              })}

              <Button
                variant="quaternary"
                size="small"
                endIcon="arrow-right"
                onClick={() => navigate(ADMIN_PORTAL_AUDIT_ROUTE)}
              >
                View full audit log
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reason Modal */}
      <ReasonModal
        open={modalOpen}
        integrationName={modalTarget?.integrationName || ''}
        orgName={org?.name || ''}
        enabling={modalTarget?.enabling || false}
        onCancel={handleModalCancel}
        onConfirm={handleModalConfirm}
      />
    </div>
  )
}

export default AdminOrganizationDetail
