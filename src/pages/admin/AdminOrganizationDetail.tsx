import { gql, useMutation, useQuery } from '@apollo/client'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Skeleton } from '~/components/designSystem/Skeleton'
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

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const navigate = useNavigate()

  const { canWrite } = useIsAdminAuthenticated()

  const { data, loading } = useQuery<AdminOrg>(ADMIN_ORGANIZATION_QUERY, {
    variables: { id: organizationId },
  })

  const { data: integrationsData, loading: integrationsLoading } =
    useQuery<AdminPremiumIntegrationsResult>(ADMIN_PREMIUM_INTEGRATIONS_QUERY)

  const [toggleIntegration] = useMutation(ADMIN_TOGGLE_PREMIUM_INTEGRATION)

  const org = data?.adminOrganization
  const allIntegrations = integrationsData?.adminPremiumIntegrations || []
  const enabledSet = new Set(org?.premiumIntegrations || [])

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
    </div>
  )
}

export default AdminOrganizationDetail
