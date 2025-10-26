import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Icon } from 'lago-design-system'
import { useEffect, useRef } from 'react'
import { NavigateOptions, useParams } from 'react-router-dom'

import { Alert, Button, Skeleton, Table, Typography } from '~/components/designSystem'
import { Checkbox, TextInputField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast } from '~/core/apolloClient'
import { HOME_ROUTE } from '~/core/router'
import { intlFormatDateTime } from '~/core/timezone'
import {
  ApiKeysPermissionsEnum,
  CreateApiKeyInput,
  PremiumIntegrationTypeEnum,
  TimezoneEnum,
  UpdateApiKeyInput,
  useCreateApiKeyMutation,
  useGetApiKeyToEditQuery,
  useUpdateApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

export const STATE_KEY_ID_TO_REVEAL = 'keyIdToReveal'

const READ_PERMISSION = 'read'
const WRITE_PERMISSION = 'write'

const canOnlyRead = (permission: ApiKeysPermissionsEnum) =>
  permission === ApiKeysPermissionsEnum.ActivityLog ||
  permission === ApiKeysPermissionsEnum.Analytic ||
  permission === ApiKeysPermissionsEnum.CustomerUsage

const isDefaultUnchecked = (permission: ApiKeysPermissionsEnum) =>
  permission === ApiKeysPermissionsEnum.Alert

const DEFAULT_PERMISSIONS: Record<ApiKeysPermissionsEnum, string[]> = Object.values(
  ApiKeysPermissionsEnum,
).reduce(
  (acc, permission) => {
    let defaultValue: string[] = [READ_PERMISSION, WRITE_PERMISSION] // Default: both read and write

    if (isDefaultUnchecked(permission)) {
      defaultValue = [] // Keep empty array to have the permission uncheked on creation
    } else if (canOnlyRead(permission)) {
      defaultValue = [READ_PERMISSION] // Read-only permissions
    }

    return {
      ...acc,
      [permission]: defaultValue,
    }
  },
  {} as Record<ApiKeysPermissionsEnum, string[]>,
)

// ApiKeysPermissionsEnum can be updated in: src/core/apolloClient/graphqlResolvers.tsx:62
const resourceTypeTranslationKeys: Record<ApiKeysPermissionsEnum, string> = {
  [ApiKeysPermissionsEnum.ActivityLog]: 'text_1747314141347qq6rasuxisl',
  [ApiKeysPermissionsEnum.AddOn]: 'text_1732894820485oyybtfh5rgv',
  [ApiKeysPermissionsEnum.Alert]: 'text_17465238490269pahbvl3s2m',
  [ApiKeysPermissionsEnum.Analytic]: 'text_6553885df387fd0097fd7384',
  [ApiKeysPermissionsEnum.AppliedCoupon]: 'text_17328948204857eb1ecwe5me',
  [ApiKeysPermissionsEnum.BillableMetric]: 'text_623b497ad05b960101be3438',
  [ApiKeysPermissionsEnum.BillingEntity]: 'text_1743077296189ms0shds6g53',
  [ApiKeysPermissionsEnum.Coupon]: 'text_637ccf8133d2c9a7d11ce705',
  [ApiKeysPermissionsEnum.CreditNote]: 'text_66461ada56a84401188e8c63',
  [ApiKeysPermissionsEnum.Customer]: 'text_624efab67eb2570101d117a5',
  [ApiKeysPermissionsEnum.CustomerUsage]: 'text_1732894820485yff83t91qnm',
  [ApiKeysPermissionsEnum.Event]: 'text_6298bd525e359200d5ea001a',
  [ApiKeysPermissionsEnum.Feature]: 'text_1752692673070k7z0mmf0494',
  [ApiKeysPermissionsEnum.Fee]: 'text_1732894820485lfkgva1ivc6',
  [ApiKeysPermissionsEnum.Invoice]: 'text_63ac86d797f728a87b2f9f85',
  [ApiKeysPermissionsEnum.InvoiceCustomSection]: 'text_1732553358445168zt8fopyf',
  [ApiKeysPermissionsEnum.LifetimeUsage]: 'text_1726481163322ntor50xdm8k',
  [ApiKeysPermissionsEnum.Organization]: 'text_173289482048511y9ieyywq5',
  [ApiKeysPermissionsEnum.Payment]: 'text_6419c64eace749372fc72b40',
  [ApiKeysPermissionsEnum.PaymentReceipt]: 'text_1747209600169a6v8atibi3n',
  [ApiKeysPermissionsEnum.PaymentRequest]: 'text_1732894820485dzoobhyzly1',
  [ApiKeysPermissionsEnum.Plan]: 'text_62442e40cea25600b0b6d85a',
  [ApiKeysPermissionsEnum.Subscription]: 'text_6250304370f0f700a8fdc28d',
  [ApiKeysPermissionsEnum.Tax]: 'text_645bb193927b375079d28a8f',
  [ApiKeysPermissionsEnum.Wallet]: 'text_62d175066d2dbf1d50bc937c',
  [ApiKeysPermissionsEnum.WalletTransaction]: 'text_1732894820485a7mmqqucnzf',
  [ApiKeysPermissionsEnum.WebhookEndpoint]: 'text_6271200984178801ba8bdf40',
  [ApiKeysPermissionsEnum.WebhookJwtPublicKey]: 'text_1732894820485vwy7ic1o84g',
}

type ApiKeyPermissions = {
  id: ApiKeysPermissionsEnum
  canRead: boolean
  canWrite: boolean
}

gql`
  query getApiKeyToEdit($apiKeyId: ID!) {
    apiKey(id: $apiKeyId) {
      id
      name
      lastUsedAt
      permissions
    }
  }

  mutation createApiKey($input: CreateApiKeyInput!) {
    createApiKey(input: $input) {
      id
    }
  }

  mutation updateApiKey($input: UpdateApiKeyInput!) {
    updateApiKey(input: $input) {
      id
    }
  }
`

const transformApiPermissionsForForm = (
  permissions?: Record<ApiKeysPermissionsEnum, string[]>,
): ApiKeyPermissions[] => {
  return Object.values(ApiKeysPermissionsEnum).map((permission) => {
    const permissionKey = permission
    const permissionValue = permissions?.[permissionKey] || []
    const hasPermissionRead = permissionValue?.includes(READ_PERMISSION)
    const hasPermissionWrite = permissionValue?.includes(WRITE_PERMISSION)

    return {
      id: permissionKey,
      canRead: hasPermissionRead,
      canWrite: hasPermissionWrite,
    }
  })
}

const getHeaderCheckboxValue = (
  permissions: ApiKeyPermissions[],
  field: 'canRead' | 'canWrite',
): boolean | undefined => {
  const allTrue = permissions.every((permission) => permission[field] === true)
  const allFalse = permissions.every((permission) => permission[field] === false)

  if (allTrue) return true
  if (allFalse) return false
  return undefined // Indeterminate state
}

const ApiKeysForm = () => {
  const devtool = useDeveloperTool()
  const { apiKeyId = '' } = useParams()
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  useEffect(() => {
    if (devtool.panelOpen) {
      devtool.closePanel()
    }
  }, [devtool])

  const hasAccessToApiPermissionsPremiumAddOn = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ApiPermissions,
  )

  const { data: apiKeyData, loading: apiKeyLoading } = useGetApiKeyToEditQuery({
    variables: {
      apiKeyId,
    },
    skip: !apiKeyId,
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

  const onClose = (state?: NavigateOptions['state']) => {
    goBack(HOME_ROUTE, { state })
    devtool.openPanel()
  }

  const [createApiKey] = useCreateApiKeyMutation({
    onCompleted({ createApiKey: createApiKeyResult }) {
      if (!!createApiKeyResult?.id) {
        onClose({
          [STATE_KEY_ID_TO_REVEAL]: createApiKeyResult.id,
        })
        addToast({
          severity: 'success',
          message: translate('text_1732286530467by9ycbpck9t'),
        })
      }
    },
  })

  const [updateApiKey] = useUpdateApiKeyMutation({
    onCompleted({ updateApiKey: updateApiKeyResult }) {
      if (!!updateApiKeyResult?.id) {
        onClose({
          [STATE_KEY_ID_TO_REVEAL]: updateApiKeyResult.id,
        })
        addToast({
          severity: 'success',
          message: translate('text_1732286530467pfkppwoswwt'),
        })
      }
    },
  })

  const isEdition = !!apiKeyId
  const apiKey = apiKeyData?.apiKey

  const formikProps = useFormik<
    Omit<CreateApiKeyInput | UpdateApiKeyInput, 'id' | 'permissions'> & {
      permissions: ApiKeyPermissions[]
    }
  >({
    initialValues: {
      name: apiKey?.name || '',
      permissions: transformApiPermissionsForForm(apiKey?.permissions || DEFAULT_PERMISSIONS),
    },
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({ permissions, ...values }) => {
      const formattedPermissions = hasAccessToApiPermissionsPremiumAddOn
        ? permissions.reduce(
            (acc, { id, canRead, canWrite }) => ({
              ...acc,
              [id]: [canRead ? READ_PERMISSION : '', canWrite ? WRITE_PERMISSION : ''].filter(
                Boolean,
              ),
            }),
            {},
          )
        : undefined

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              id: apiKeyId,
              permissions: formattedPermissions,
              ...values,
            },
          },
        })
      } else {
        await createApiKey({
          variables: {
            input: { permissions: formattedPermissions, ...values },
          },
        })
      }
    },
  })

  return (
    <>
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          {apiKeyLoading ? (
            <Skeleton className="w-50" variant="text" />
          ) : (
            <>
              <Typography variant="bodyHl" color="grey700" noWrap>
                {translate(
                  isEdition ? 'text_1732286530467umtldbwri1j' : 'text_17322865304672acg4wvc0s0',
                )}
              </Typography>
              <Button variant="quaternary" icon="close" onClick={() => onClose()} />
            </>
          )}
        </CenteredPage.Header>

        <CenteredPage.Container>
          {apiKeyLoading ? (
            <FormLoadingSkeleton id="apiKeys" />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <Typography variant="headline" color="grey700">
                  {translate(
                    isEdition ? 'text_1732286530467umtldbwri1j' : 'text_1732286530467r7oj4moo3al',
                  )}
                </Typography>
                <Typography variant="body" color="grey600">
                  {translate('text_1732286530467bpqi7grn0vk')}
                </Typography>
              </div>

              {isEdition && !!apiKey?.lastUsedAt && (
                <Alert type="info">
                  <Typography variant="body" color="grey700">
                    {translate('text_1732286530467pwhhpj0aczl', {
                      date: intlFormatDateTime(apiKey?.lastUsedAt, {
                        timezone: TimezoneEnum.TzUtc,
                      }).date,
                    })}
                  </Typography>
                </Alert>
              )}

              <div className="flex flex-col gap-6 pb-12 shadow-b">
                <div className="flex flex-col gap-2">
                  <Typography variant="subhead1" color="grey700">
                    {translate('text_1732286530467tbfarkui5o8')}
                  </Typography>
                  <Typography variant="caption" color="grey600">
                    {translate('text_17322865304675hom00lcbyt')}
                  </Typography>
                </div>

                <TextInputField
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  name="name"
                  label={translate('text_1732286530467zstzwbegfiq')}
                  placeholder={translate('text_17322865304681s5r90ntpdv')}
                  formikProps={formikProps}
                />
              </div>

              <div className="flex flex-col gap-6 pb-12">
                <div className="flex flex-col gap-2">
                  <Typography variant="subhead1" color="grey700">
                    {translate('text_1732895022171i6ewlfi5gle')}
                  </Typography>
                  <Typography variant="body" color="grey600">
                    {translate('text_17328950221717jo8c119hbv')}
                  </Typography>
                </div>

                {!hasAccessToApiPermissionsPremiumAddOn ? (
                  <div className="flex w-full flex-row items-center justify-between gap-2 rounded-xl bg-grey-100 px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex flex-row items-center gap-2">
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_17328950221712ase46l0iwq')}
                        </Typography>
                        <Icon name="sparkles" />
                      </div>

                      <Typography variant="caption" color="grey600">
                        {translate('text_1732895022171dkdzjnjtk10')}
                      </Typography>
                    </div>
                    <Button
                      endIcon="sparkles"
                      variant="tertiary"
                      onClick={() =>
                        premiumWarningDialogRef.current?.openDialog({
                          title: translate('text_661ff6e56ef7e1b7c542b1ea'),
                          description: translate('text_661ff6e56ef7e1b7c542b1f6'),
                          mailtoSubject: translate('text_17328950221712tn2kbvuqrg'),
                          mailtoBody: translate('text_1732895022171rrj3kk58023'),
                        })
                      }
                    >
                      {translate('text_65ae73ebe3a66bec2b91d72d')}
                    </Button>
                  </div>
                ) : (
                  <Table
                    name="api-keys-permissions"
                    data={formikProps.values.permissions}
                    containerSize={0}
                    isLoading={apiKeyLoading}
                    columns={[
                      {
                        key: 'id',
                        maxSpace: true,
                        title: (
                          <Typography variant="captionHl" color="grey600">
                            {translate('text_1732895022171f9vnwh5gm3q')}
                          </Typography>
                        ),
                        content: ({ id }) => (
                          <Typography variant="body" color="grey700">
                            {translate(resourceTypeTranslationKeys[id])}
                          </Typography>
                        ),
                      },
                      {
                        key: 'canRead',
                        minWidth: 176,
                        title: (
                          <Checkbox
                            // The pl-1 class is used to prevent the focus ring from being cropped.
                            className="pl-1"
                            canBeIndeterminate
                            label={
                              <Typography variant="captionHl" color="grey600">
                                {translate('text_1732893748379m7jh7zzz956')}
                              </Typography>
                            }
                            value={getHeaderCheckboxValue(
                              formikProps.values.permissions,
                              'canRead',
                            )}
                            onChange={() => {
                              const nextValue = !formikProps.values.permissions.every(
                                ({ canRead }) => canRead === true,
                              )

                              formikProps.setFieldValue(
                                'permissions',
                                formikProps.values.permissions.map((permission) => ({
                                  ...permission,
                                  canRead: nextValue,
                                })),
                              )
                            }}
                          />
                        ),
                        content: ({ id, canRead }) => {
                          return (
                            <Checkbox
                              // The pl-1 class is used to prevent the focus ring from being cropped.
                              className="pl-1"
                              label={translate('text_17328934519835pubx8tx7k7')}
                              value={canRead}
                              onChange={() => {
                                formikProps.setFieldValue(
                                  'permissions',
                                  formikProps.values.permissions.map((permission) =>
                                    permission.id === id
                                      ? { ...permission, canRead: !permission.canRead }
                                      : permission,
                                  ),
                                )
                              }}
                            />
                          )
                        },
                      },
                      {
                        key: 'canWrite',
                        minWidth: 150,
                        title: (
                          <Checkbox
                            // The pl-1 class is used to prevent the focus ring from being cropped.
                            className="pl-1"
                            canBeIndeterminate
                            label={
                              <Typography variant="captionHl" color="grey600">
                                {translate('text_17328937483790tnuhasm2yr')}
                              </Typography>
                            }
                            value={getHeaderCheckboxValue(
                              formikProps.values.permissions,
                              'canWrite',
                            )}
                            onChange={() => {
                              const nextValue = !formikProps.values.permissions.every(
                                ({ canWrite }) => canWrite === true,
                              )

                              formikProps.setFieldValue(
                                'permissions',
                                formikProps.values.permissions.map((permission) => ({
                                  ...permission,
                                  canWrite: nextValue,
                                })),
                              )
                            }}
                          />
                        ),
                        content: ({ id, canWrite }) => {
                          if (canOnlyRead(id)) return null

                          return (
                            <Checkbox
                              // The pl-1 class is used to prevent the focus ring from being cropped.
                              className="pl-1"
                              label={translate('text_1732893451983ghftswenkuh')}
                              value={canWrite}
                              onChange={() => {
                                formikProps.setFieldValue(
                                  'permissions',
                                  formikProps.values.permissions.map((permission) =>
                                    permission.id === id
                                      ? { ...permission, canWrite: !permission.canWrite }
                                      : permission,
                                  ),
                                )
                              }}
                            />
                          )
                        },
                      },
                    ]}
                  />
                )}
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button variant="quaternary" onClick={() => onClose()}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <Button
            variant="primary"
            onClick={formikProps.submitForm}
            disabled={!formikProps.isValid || (isEdition && !formikProps.dirty) || apiKeyLoading}
          >
            {translate(
              isEdition ? 'text_17295436903260tlyb1gp1i7' : 'text_1732522865354i0r12i6z9mu',
            )}
          </Button>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default ApiKeysForm
