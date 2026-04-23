import { gql, useMutation, useQuery } from '@apollo/client'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { useParams } from 'react-router-dom'

import { FeatureToggleRow } from '~/components/admin/FeatureToggleRow'
import { Typography } from '~/components/designSystem/Typography'

const ADMIN_ORGANIZATION_QUERY = gql`
  query AdminOrganization($organizationId: ID!) {
    adminOrganization(organizationId: $organizationId) {
      id
      name
      email
      createdAt
      premiumIntegrations
      featureFlags
    }
  }
`

const ADMIN_TOGGLE_FEATURE_MUTATION = gql`
  mutation AdminToggleFeature($input: AdminToggleFeatureInput!) {
    adminToggleFeature(input: $input) {
      id
      action
      featureKey
      featureType
      afterValue
      reason
      createdAt
    }
  }
`

const KNOWN_PREMIUM_INTEGRATIONS = [
  'beta_payment_authorization',
  'netsuite',
  'okta',
  'avalara',
  'xero',
  'progressive_billing',
  'lifetime_usage',
  'hubspot',
  'auto_dunning',
  'revenue_analytics',
  'salesforce',
  'api_permissions',
  'revenue_share',
  'remove_branding_watermark',
  'manual_payments',
  'from_email',
  'issue_receipts',
  'preview',
  'multi_entities_pro',
  'multi_entities_enterprise',
]

const KNOWN_FEATURE_FLAGS = [
  'multiple_payment_methods',
  'non_persistable_charge_cache_optimization',
  'postgres_enriched_events',
  'enriched_events_aggregation',
  'wallet_traceability',
  'multi_currency',
  'payment_gated_subscriptions',
  'order_forms',
]

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()

  const { data, loading, refetch } = useQuery(ADMIN_ORGANIZATION_QUERY, {
    variables: { organizationId },
    skip: !organizationId,
  })

  const [toggleFeature] = useMutation(ADMIN_TOGGLE_FEATURE_MUTATION)

  const org = data?.adminOrganization

  const handleToggle =
    (featureKey: string, featureType: 'premium_integration' | 'feature_flag') =>
    async (reason: string, notifyOrgAdmin: boolean) => {
      await toggleFeature({
        variables: {
          input: {
            organizationId,
            featureKey,
            featureType,
            reason,
            notifyOrgAdmin,
          },
        },
      })
      await refetch()
    }

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!org) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="body" color="grey600">
          Organization not found.
        </Typography>
      </Box>
    )
  }

  const enabledIntegrations: string[] = org.premiumIntegrations ?? []
  const enabledFlags: string[] = org.featureFlags ?? []

  const createdDate = org.createdAt
    ? new Date(org.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—'

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      {/* Org header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="headline">{org.name}</Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body" color="grey600">
            ID: {org.id}
          </Typography>
          {org.email && (
            <Typography variant="body" color="grey600">
              Email: {org.email}
            </Typography>
          )}
          <Typography variant="body" color="grey600">
            Created: {createdDate}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Premium Integrations */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subhead1" sx={{ mb: 2 }}>
          Premium Integrations
        </Typography>
        {KNOWN_PREMIUM_INTEGRATIONS.map((key) => (
          <FeatureToggleRow
            key={key}
            featureKey={key}
            featureType="premium_integration"
            enabled={enabledIntegrations.includes(key)}
            onToggle={handleToggle(key, 'premium_integration')}
          />
        ))}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Feature Flags */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subhead1" sx={{ mb: 2 }}>
          Feature Flags
        </Typography>
        {KNOWN_FEATURE_FLAGS.map((key) => (
          <FeatureToggleRow
            key={key}
            featureKey={key}
            featureType="feature_flag"
            enabled={enabledFlags.includes(key)}
            onToggle={handleToggle(key, 'feature_flag')}
          />
        ))}
      </Box>
    </Box>
  )
}

export default AdminOrganizationDetail
