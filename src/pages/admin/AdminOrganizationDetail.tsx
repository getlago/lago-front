import { gql, useMutation, useQuery } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { Button } from '~/components/designSystem/Button'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { Switch } from '~/components/form/Switch/Switch'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { ADMIN_ORGANIZATIONS_ROUTE } from '~/core/router'

const ADMIN_ORGANIZATION_QUERY = gql`
  query AdminOrganization($organizationId: ID!) {
    adminOrganization(organizationId: $organizationId) {
      id
      name
      email
      createdAt
      premiumIntegrations
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

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()

  const { data, loading, refetch } = useQuery(ADMIN_ORGANIZATION_QUERY, {
    variables: { organizationId },
    skip: !organizationId,
  })

  const [toggleFeature] = useMutation(ADMIN_TOGGLE_FEATURE_MUTATION)
  const [isSaving, setIsSaving] = useState(false)

  const org = data?.adminOrganization
  const serverIntegrations: string[] = useMemo(
    () => org?.premiumIntegrations ?? [],
    [org?.premiumIntegrations],
  )

  // Local state for batch editing
  const [localIntegrations, setLocalIntegrations] = useState<Set<string>>(new Set())

  // Sync local state when server data changes
  useEffect(() => {
    setLocalIntegrations(new Set(serverIntegrations))
  }, [serverIntegrations])

  const isDirty = useMemo(() => {
    if (serverIntegrations.length !== localIntegrations.size) return true

    return serverIntegrations.some((key) => !localIntegrations.has(key))
  }, [serverIntegrations, localIntegrations])

  const handleToggleLocal = (key: string) => {
    setLocalIntegrations((prev) => {
      const next = new Set(prev)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  const handleSave = () => {
    // Compute what changed
    const toEnable = KNOWN_PREMIUM_INTEGRATIONS.filter(
      (key) => localIntegrations.has(key) && !serverIntegrations.includes(key),
    )
    const toDisable = KNOWN_PREMIUM_INTEGRATIONS.filter(
      (key) => !localIntegrations.has(key) && serverIntegrations.includes(key),
    )

    const changes = [
      ...toEnable.map((key) => ({ featureKey: key, enabled: true })),
      ...toDisable.map((key) => ({ featureKey: key, enabled: false })),
    ]

    if (changes.length === 0) return

    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: `Update ${changes.length} integration${changes.length > 1 ? 's' : ''}`,
      description: `Please provide a reason for updating premium integrations.`,
      onConfirm: async (reason: string, notifyOrgAdmin: boolean) => {
        setIsSaving(true)

        try {
          for (const change of changes) {
            await toggleFeature({
              variables: {
                input: {
                  organizationId,
                  featureKey: change.featureKey,
                  featureType: 'premium_integration',
                  enabled: change.enabled,
                  reason,
                  notifyOrgAdmin,
                },
              },
            })
          }
          await refetch()
        } finally {
          setIsSaving(false)
        }
      },
    })
  }

  const handleReset = () => {
    setLocalIntegrations(new Set(serverIntegrations))
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

  const getEntityMetadata = () => {
    if (org.email) {
      return `${org.id} - ${org.email}`
    }

    return org.id
  }

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
          metadata: getEntityMetadata(),
        }}
      />

      <div className="max-w-200 mx-auto w-full p-4 md:p-12">
        <div>
          <Typography variant="subhead1" className="mb-4">
            Premium Integrations
          </Typography>
          {KNOWN_PREMIUM_INTEGRATIONS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-grey-300 py-3"
            >
              <Typography variant="body">{key}</Typography>
              <Switch
                name={key}
                checked={localIntegrations.has(key)}
                onChange={() => handleToggleLocal(key)}
              />
            </div>
          ))}
        </div>
      </div>

      <footer className="sticky bottom-0 z-navBar w-full bg-white shadow-t">
        <div className="max-w-200 mx-auto flex min-h-footer w-full flex-wrap-reverse items-center justify-end gap-3 px-4 md:px-12">
          <Button variant="quaternary" disabled={!isDirty} onClick={handleReset}>
            Reset
          </Button>
          <Button disabled={!isDirty || isSaving} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </footer>
    </>
  )
}

export default AdminOrganizationDetail
