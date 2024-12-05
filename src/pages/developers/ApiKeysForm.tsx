import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Button, Icon, Skeleton, Table, Typography } from '~/components/designSystem'
import { Checkbox, TextInputField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/Pages'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast } from '~/core/apolloClient'
import { API_KEYS_ROUTE } from '~/core/router'
import { formatDateToTZ } from '~/core/timezone'
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
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

export const STATE_KEY_ID_TO_REVEAL = 'keyIdToReveal'

const resourseTypeTranslationKeys: Record<ApiKeysPermissionsEnum, string> = {
  [ApiKeysPermissionsEnum.AddOn]: 'text_1732894820485oyybtfh5rgv',
  [ApiKeysPermissionsEnum.Analytic]: 'text_6553885df387fd0097fd7384',
  [ApiKeysPermissionsEnum.AppliedCoupon]: 'text_17328948204857eb1ecwe5me',
  [ApiKeysPermissionsEnum.BillableMetric]: 'text_623b497ad05b960101be3438',
  [ApiKeysPermissionsEnum.Coupon]: 'text_637ccf8133d2c9a7d11ce705',
  [ApiKeysPermissionsEnum.CreditNote]: 'text_66461ada56a84401188e8c63',
  [ApiKeysPermissionsEnum.Customer]: 'text_624efab67eb2570101d117a5',
  [ApiKeysPermissionsEnum.CustomerUsage]: 'text_1732894820485yff83t91qnm',
  [ApiKeysPermissionsEnum.Event]: 'text_6298bd525e359200d5ea001a',
  [ApiKeysPermissionsEnum.Fee]: 'text_1732894820485lfkgva1ivc6',
  [ApiKeysPermissionsEnum.Invoice]: 'text_63ac86d797f728a87b2f9f85',
  [ApiKeysPermissionsEnum.LifetimeUsage]: 'text_1726481163322ntor50xdm8k',
  [ApiKeysPermissionsEnum.Organization]: 'text_173289482048511y9ieyywq5',
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
    const permissionValue = permissions?.[permissionKey]
    const hasPermissionRead = !permissionValue ? true : permissionValue?.includes('read')
    const hasPermissionWrite = !permissionValue ? true : permissionValue?.includes('write')

    return {
      id: permissionKey,
      canRead: hasPermissionRead,
      canWrite: hasPermissionWrite,
    }
  })
}

const ApiKeysForm = () => {
  const navigate = useNavigate()
  const { apiKeyId = '' } = useParams()
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

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

  const [createApiKey] = useCreateApiKeyMutation({
    onCompleted({ createApiKey: createApiKeyResult }) {
      if (!!createApiKeyResult?.id) {
        navigate(API_KEYS_ROUTE, {
          state: { [STATE_KEY_ID_TO_REVEAL]: createApiKeyResult.id },
        })
        addToast({
          severity: 'success',
          message: translate('text_1732286530467by9ycbpck9t'),
        })
      }
    },
  })
  const [updadeApiKey] = useUpdateApiKeyMutation({
    onCompleted({ updateApiKey: updateApiKeyResult }) {
      if (!!updateApiKeyResult?.id) {
        navigate(API_KEYS_ROUTE, {
          state: { [STATE_KEY_ID_TO_REVEAL]: updateApiKeyResult.id },
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
      permissions: transformApiPermissionsForForm(apiKey?.permissions),
    },
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({ permissions, ...values }) => {
      const formattedPermissions = hasAccessToApiPermissionsPremiumAddOn
        ? permissions.reduce(
            (acc, { id, canRead, canWrite }) => ({
              ...acc,
              [id]: [canRead ? 'read' : '', canWrite ? 'write' : ''].filter(Boolean),
            }),
            {},
          )
        : undefined

      if (isEdition) {
        await updadeApiKey({
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
              <Button variant="quaternary" icon="close" onClick={() => navigate(API_KEYS_ROUTE)} />
            </>
          )}
        </CenteredPage.Header>

        <CenteredPage.Container>
          {apiKeyLoading ? (
            <>
              <div className="flex flex-col gap-1">
                <Skeleton className="w-40" variant="text" textVariant="headline" />
                <Skeleton className="w-100" variant="text" />
              </div>
              {[0, 1].map((_, index) => (
                <div
                  key={`api-key-form-loading-block-${index}`}
                  className="flex flex-col gap-1 pb-12 shadow-b"
                >
                  <Skeleton className="w-40" variant="text" />
                  <Skeleton className="w-100" variant="text" />
                  <Skeleton className="w-74" variant="text" />
                </div>
              ))}
            </>
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
                      date: formatDateToTZ(apiKey?.lastUsedAt, TimezoneEnum.TzUtc, 'LLL. dd, yyyy'),
                    })}
                  </Typography>
                </Alert>
              )}

              <div className="flex flex-col gap-6 pb-12 shadow-b">
                <div className="flex flex-col gap-2">
                  <Typography variant="subhead" color="grey700">
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
                  <Typography variant="subhead" color="grey700">
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
                            {translate(resourseTypeTranslationKeys[id])}
                          </Typography>
                        ),
                      },
                      {
                        key: 'canRead',
                        minWidth: 176,
                        title: (
                          <Checkbox
                            canBeIndeterminate
                            label={
                              <Typography variant="captionHl" color="grey600">
                                {translate('text_1732893748379m7jh7zzz956')}
                              </Typography>
                            }
                            value={
                              formikProps.values.permissions.every(
                                ({ canRead }) => canRead === true,
                              )
                                ? true
                                : formikProps.values.permissions.every(
                                      ({ canRead }) => canRead === false,
                                    )
                                  ? false
                                  : undefined
                            }
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
                        minWidth: 144,
                        title: (
                          <Checkbox
                            canBeIndeterminate
                            label={
                              <Typography variant="captionHl" color="grey600">
                                {translate('text_17328937483790tnuhasm2yr')}
                              </Typography>
                            }
                            value={
                              formikProps.values.permissions.every(
                                ({ canWrite }) => canWrite === true,
                              )
                                ? true
                                : formikProps.values.permissions.every(
                                      ({ canWrite }) => canWrite === false,
                                    )
                                  ? false
                                  : undefined
                            }
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
                          if (
                            id === ApiKeysPermissionsEnum.Analytic ||
                            id === ApiKeysPermissionsEnum.CustomerUsage
                          )
                            return null

                          return (
                            <Checkbox
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
          <Button variant="quaternary" onClick={() => navigate(API_KEYS_ROUTE)}>
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
