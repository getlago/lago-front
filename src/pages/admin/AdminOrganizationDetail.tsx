import { gql } from '@apollo/client'
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
import { addToast } from '~/core/apolloClient'
import { ADMIN_ORGANIZATIONS_ROUTE } from '~/core/router'
import {
  AdminFeatureTypeEnum,
  FeatureFlagEnum,
  PremiumIntegrationTypeEnum,
  useAdminOrganizationQuery,
  useAdminToggleFeatureMutation,
} from '~/generated/graphql'

gql`
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

  mutation AdminToggleFeature($input: AdminToggleFeatureInput!) {
    adminToggleFeature(input: $input) {
      id
    }
  }
`

const KNOWN_PREMIUM_INTEGRATIONS = Object.values(PremiumIntegrationTypeEnum)
const KNOWN_FEATURE_FLAGS = Object.values(FeatureFlagEnum)

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()

  const { data, loading, refetch } = useAdminOrganizationQuery({
    variables: { organizationId: organizationId ?? '' },
    skip: !organizationId,
  })

  const [toggleFeature] = useAdminToggleFeatureMutation()
  const [isSaving, setIsSaving] = useState(false)

  const org = data?.adminOrganization
  const serverIntegrations: string[] = useMemo(
    () => org?.premiumIntegrations ?? [],
    [org?.premiumIntegrations],
  )

  const serverFeatureFlags: string[] = useMemo(() => org?.featureFlags ?? [], [org?.featureFlags])

  // Local state for batch editing
  const [localIntegrations, setLocalIntegrations] = useState<Set<string>>(new Set())
  const [localFeatureFlags, setLocalFeatureFlags] = useState<Set<string>>(new Set())

  // Sync local state when server data changes
  useEffect(() => {
    setLocalIntegrations(new Set(serverIntegrations))
    setLocalFeatureFlags(new Set(serverFeatureFlags))
  }, [serverIntegrations, serverFeatureFlags])

  const isDirty = useMemo(() => {
    const integrationsDirty =
      serverIntegrations.length !== localIntegrations.size ||
      serverIntegrations.some((key) => !localIntegrations.has(key))

    const flagsDirty =
      serverFeatureFlags.length !== localFeatureFlags.size ||
      serverFeatureFlags.some((key) => !localFeatureFlags.has(key))

    return integrationsDirty || flagsDirty
  }, [serverIntegrations, localIntegrations, serverFeatureFlags, localFeatureFlags])

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

  const handleToggleFlag = (key: string) => {
    setLocalFeatureFlags((prev) => {
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
    const toEnableIntegrations = KNOWN_PREMIUM_INTEGRATIONS.filter(
      (key) => localIntegrations.has(key) && !serverIntegrations.includes(key),
    )
    const toDisableIntegrations = KNOWN_PREMIUM_INTEGRATIONS.filter(
      (key) => !localIntegrations.has(key) && serverIntegrations.includes(key),
    )
    const toEnableFlags = KNOWN_FEATURE_FLAGS.filter(
      (key) => localFeatureFlags.has(key) && !serverFeatureFlags.includes(key),
    )
    const toDisableFlags = KNOWN_FEATURE_FLAGS.filter(
      (key) => !localFeatureFlags.has(key) && serverFeatureFlags.includes(key),
    )

    const changes = [
      ...toEnableIntegrations.map((key) => ({
        featureKey: key,
        enabled: true,
        featureType: AdminFeatureTypeEnum.PremiumIntegration,
      })),
      ...toDisableIntegrations.map((key) => ({
        featureKey: key,
        enabled: false,
        featureType: AdminFeatureTypeEnum.PremiumIntegration,
      })),
      ...toEnableFlags.map((key) => ({
        featureKey: key,
        enabled: true,
        featureType: AdminFeatureTypeEnum.FeatureFlag,
      })),
      ...toDisableFlags.map((key) => ({
        featureKey: key,
        enabled: false,
        featureType: AdminFeatureTypeEnum.FeatureFlag,
      })),
    ]

    if (changes.length === 0) return

    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: `Update ${changes.length} feature${changes.length > 1 ? 's' : ''}`,
      description: `Please provide a reason for updating features.`,
      onConfirm: async (reason: string, notifyOrgAdmin: boolean) => {
        setIsSaving(true)
        let failedCount = 0

        try {
          for (const change of changes) {
            try {
              await toggleFeature({
                variables: {
                  input: {
                    organizationId: organizationId ?? '',
                    featureKey: change.featureKey,
                    featureType: change.featureType,
                    enabled: change.enabled,
                    reason,
                    notifyOrgAdmin,
                  },
                },
              })
            } catch {
              failedCount++
            }
          }

          if (failedCount > 0) {
            addToast({
              severity: 'danger',
              message: `${failedCount} of ${changes.length} updates failed.`,
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
    setLocalFeatureFlags(new Set(serverFeatureFlags))
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

        <div className="mt-8">
          <Typography variant="subhead1" className="mb-4">
            Feature Flags
          </Typography>
          {KNOWN_FEATURE_FLAGS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-grey-300 py-3"
            >
              <Typography variant="body">{key}</Typography>
              <Switch
                name={`flag-${key}`}
                checked={localFeatureFlags.has(key)}
                onChange={() => handleToggleFlag(key)}
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
