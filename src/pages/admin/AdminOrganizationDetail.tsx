import { gql } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import { GraphQLFormattedError } from 'graphql'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalError, ReasonModalProps } from '~/components/admin/ReasonModal'
import { Button } from '~/components/designSystem/Button'
import { Spinner } from '~/components/designSystem/Spinner'
import { Typography } from '~/components/designSystem/Typography'
import { Switch } from '~/components/form/Switch/Switch'
import { TextInput } from '~/components/form/TextInput/TextInput'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ADMIN_ORGANIZATIONS_ROUTE } from '~/core/router'
import {
  AdminFeatureTypeEnum,
  AdminOrganizationQuery,
  FeatureFlagEnum,
  LagoApiError,
  PremiumIntegrationTypeEnum,
  useAdminOrganizationQuery,
  useAdminRenameOrganizationMutation,
  useAdminToggleFeatureMutation,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

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
  mutation AdminRenameOrganization($input: AdminRenameOrganizationInput!) {
    adminRenameOrganization(input: $input) {
      id
    }
  }
`

const KNOWN_PREMIUM_INTEGRATIONS = Object.values(PremiumIntegrationTypeEnum)
const KNOWN_FEATURE_FLAGS = Object.values(FeatureFlagEnum)

const RENAME_SILENT_ERROR_CODES = [LagoApiError.UnprocessableEntity, LagoApiError.NotFound]
const RENAME_LOCALLY_HANDLED_ERROR_CODES: unknown[] = [
  ...RENAME_SILENT_ERROR_CODES,
  LagoApiError.Forbidden,
]

const PERMISSION_ERROR_KEY = 'text_17865407897429mqm1fco12j'
const ORGANIZATION_NOT_FOUND_KEY = 'text_1793385900490p103wpd5yop'
const RENAME_FAILED_KEY = 'text_1793385900490tqocadsfotq'

const RENAME_DETAIL_ERROR_KEYS: Record<string, string> = {
  'name.value_is_mandatory': 'text_1793385900490m5usn5dcibi',
  'name.value_is_unchanged': 'text_1793385900490zvrwdl6qmnj',
  'reason.value_is_too_short': 'text_1793385900490pjhemm9d0up',
  'reason.value_is_too_long': 'text_17933859004900n1m0901kmv',
}

const getDetailErrorKey = (
  errors: readonly GraphQLFormattedError[] | undefined,
): string | undefined => {
  const details = errors?.[0]?.extensions?.details

  if (!details || typeof details !== 'object') return undefined

  for (const [field, codes] of Object.entries(details)) {
    const key = Array.isArray(codes) ? RENAME_DETAIL_ERROR_KEYS[`${field}.${codes[0]}`] : undefined

    if (key) return key
  }

  return undefined
}

const getRenameErrorMessage = (
  errors: readonly GraphQLFormattedError[] | undefined,
  translate: TranslateFunc,
): string => {
  const code = errors?.[0]?.extensions?.code

  if (hasDefinedGQLError('NotFound', errors)) return translate(ORGANIZATION_NOT_FOUND_KEY)
  if (code === LagoApiError.Forbidden) return translate(PERMISSION_ERROR_KEY)
  // The global error link already toasted every code this page does not handle itself
  if (code && !RENAME_LOCALLY_HANDLED_ERROR_CODES.includes(code)) return ''

  return translate(getDetailErrorKey(errors) ?? RENAME_FAILED_KEY)
}

type AdminOrganizationSettingsProps = {
  org: NonNullable<AdminOrganizationQuery['adminOrganization']>
  refetch: () => unknown
}

const AdminOrganizationSettings = ({
  org,
  refetch,
}: AdminOrganizationSettingsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [toggleFeature] = useAdminToggleFeatureMutation()
  const [isSaving, setIsSaving] = useState(false)
  const [renameOrganization] = useAdminRenameOrganizationMutation({
    context: { silentErrorCodes: RENAME_SILENT_ERROR_CODES },
  })
  const [nameInput, setNameInput] = useState(org.name)

  const serverIntegrations: string[] = org.premiumIntegrations
  const serverFeatureFlags: string[] = org.featureFlags

  // Local state for batch editing
  const [localIntegrations, setLocalIntegrations] = useState<Set<string>>(new Set())
  const [localFeatureFlags, setLocalFeatureFlags] = useState<Set<string>>(new Set())

  // Sync local state when server data changes
  useEffect(() => {
    setLocalIntegrations(new Set(serverIntegrations))
    setLocalFeatureFlags(new Set(serverFeatureFlags))
  }, [serverIntegrations, serverFeatureFlags])

  const isNameDirty = nameInput !== org.name
  const trimmedName = nameInput.trim()
  const canRename = trimmedName.length > 0 && trimmedName !== org.name

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

  const getSaveDialogCopy = (
    featureCount: number,
  ): Pick<ReasonModalProps, 'title' | 'description'> => {
    const rename = { currentName: org.name, newName: trimmedName, count: featureCount }

    if (!canRename) {
      return {
        title: translate('text_1793385900490kmw0vlhvt9j', { count: featureCount }, featureCount),
        description: translate('text_1793385900490y0phuye4hqy'),
      }
    }

    if (featureCount === 0) {
      return {
        title: translate('text_1793385900490rmoco4403qu'),
        description: translate('text_1793385900490b9c05vdreem', rename),
      }
    }

    return {
      title: translate('text_1793385900490ocp2hwktkxf', { count: featureCount }, featureCount),
      description: translate('text_17933859004908vcp3ktwd68', rename, featureCount),
    }
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

    if (changes.length === 0 && !canRename) return

    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      ...getSaveDialogCopy(changes.length),
      showNotifyCheckbox: changes.length > 0,
      onConfirm: async (reason: string, notifyOrgAdmin: boolean) => {
        setIsSaving(true)
        let failedCount = 0

        try {
          if (canRename) {
            const result = await renameOrganization({
              variables: { input: { organizationId: org.id, name: trimmedName, reason } },
            })

            if (!result.data?.adminRenameOrganization) {
              throw new ReasonModalError(getRenameErrorMessage(result.errors, translate))
            }
          }

          for (const change of changes) {
            try {
              await toggleFeature({
                variables: {
                  input: {
                    organizationId: org.id,
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

          refetch()
        } finally {
          setIsSaving(false)
        }
      },
    })
  }

  const handleReset = (): void => {
    setLocalIntegrations(new Set(serverIntegrations))
    setLocalFeatureFlags(new Set(serverFeatureFlags))
    setNameInput(org.name)
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
        <div className="mb-8">
          <Typography variant="subhead1" className="mb-4">
            {translate('text_1742230191029o8hfgeebxl5')}
          </Typography>
          <TextInput
            name="organizationName"
            label={translate('text_62a99ba2af7535cefacab49c')}
            value={nameInput}
            onChange={setNameInput}
          />
        </div>
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
          <Button variant="quaternary" disabled={!isDirty && !isNameDirty} onClick={handleReset}>
            Reset
          </Button>
          <Button disabled={(!isDirty && !canRename) || isSaving} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </footer>
    </>
  )
}

const AdminOrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()

  const { data, loading, refetch } = useAdminOrganizationQuery({
    variables: { organizationId: organizationId ?? '' },
    skip: !organizationId,
  })

  const org = data?.adminOrganization

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

  return <AdminOrganizationSettings key={org.name} org={org} refetch={refetch} />
}

export default AdminOrganizationDetail
