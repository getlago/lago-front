import { gql, useMutation, useQuery } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { FeatureToggleRow } from '~/components/admin/FeatureToggleRow'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ADMIN_ORGANIZATIONS_ROUTE } from '~/core/router'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'

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
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="p-4 md:p-12">
        <Typography variant="body" color="grey600">
          Organization not found.
        </Typography>
      </div>
    )
  }

  const enabledIntegrations: string[] = org.premiumIntegrations ?? []
  const enabledFlags: string[] = org.featureFlags ?? []

  const createdDate = org.createdAt
    ? intlFormatDateTime(org.createdAt, { formatDate: DateFormat.DATE_MED }).date
    : '-'

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: 'Organizations',
            path: ADMIN_ORGANIZATIONS_ROUTE,
          },
        ]}
        entity={{
          viewName: org.name,
          metadata: org.email || org.id,
        }}
      />

      <div className="max-w-200 mx-auto w-full p-4 md:p-12">
        {/* Org metadata */}
        <div className="mb-8 flex flex-col gap-1">
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
        </div>

        <div className="mb-8 border-b border-grey-300" />

        {/* Premium Integrations */}
        <div className="mb-8">
          <Typography variant="subhead1" className="mb-4">
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
        </div>

        <div className="mb-8 border-b border-grey-300" />

        {/* Feature Flags */}
        <div className="mb-8">
          <Typography variant="subhead1" className="mb-4">
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
        </div>
      </div>
    </>
  )
}

export default AdminOrganizationDetail
