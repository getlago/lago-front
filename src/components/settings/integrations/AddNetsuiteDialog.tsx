import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useId, useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { Checkbox } from '~/components/form'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { NETSUITE_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { zodOptionalUrl } from '~/formValidation/zodCustoms'
import {
  GetNetsuiteIntegrationsListDocument,
  NetsuiteForCreateDialogDialogFragment,
  useCreateNetsuiteIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateNetsuiteIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { NetsuiteIntegrationDetailsTabs } from '~/pages/settings/NetsuiteIntegrationDetails'

gql`
  fragment NetsuiteForCreateDialogDialog on NetsuiteIntegration {
    id
    accountId
    clientId
    clientSecret
    code
    name
    scriptEndpointUrl
    syncCreditNotes
    syncInvoices
    syncPayments
    tokenId
    tokenSecret
  }

  mutation createNetsuiteIntegration($input: CreateNetsuiteIntegrationInput!) {
    createNetsuiteIntegration(input: $input) {
      ...NetsuiteForCreateDialogDialog
    }
  }

  mutation updateNetsuiteIntegration($input: UpdateNetsuiteIntegrationInput!) {
    updateNetsuiteIntegration(input: $input) {
      ...NetsuiteForCreateDialogDialog
    }
  }
`

const ADD_NETSUITE_FORM_ID = 'form-add-netsuite-integration'

type AddNetsuiteFormValues = {
  name: string
  code: string
  accountId: string
  clientId: string
  clientSecret: string
  tokenId: string
  tokenSecret: string
  scriptEndpointUrl: string
  syncCreditNotes: boolean
  syncInvoices: boolean
  syncPayments: boolean
}

const defaultFormValues: AddNetsuiteFormValues = {
  name: '',
  code: '',
  accountId: '',
  clientId: '',
  clientSecret: '',
  tokenId: '',
  tokenSecret: '',
  scriptEndpointUrl: '',
  syncCreditNotes: false,
  syncInvoices: false,
  syncPayments: false,
}

const validationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  accountId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  clientId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  clientSecret: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  tokenId: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  tokenSecret: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  scriptEndpointUrl: z
    .string()
    .min(1, { message: 'text_624ea7c29103fd010732ab7d' })
    .and(zodOptionalUrl),
  syncCreditNotes: z.boolean(),
  syncInvoices: z.boolean(),
  syncPayments: z.boolean(),
})

type OpenAddNetsuiteDialogData = {
  provider?: NetsuiteForCreateDialogDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddNetsuiteDialog = () => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()

  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddNetsuiteDialogData | null>(null)
  const successRef = useRef(false)

  const [showGlobalError, setShowGlobalError] = useState(false)

  const [createIntegration] = useCreateNetsuiteIntegrationMutation({
    onCompleted({ createNetsuiteIntegration }) {
      if (createNetsuiteIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(NETSUITE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createNetsuiteIntegration.id,
            tab: NetsuiteIntegrationDetailsTabs.Settings,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2c4'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getNetsuiteIntegrationsList'],
  })

  const [updateIntegration] = useUpdateNetsuiteIntegrationMutation({
    onCompleted({ updateNetsuiteIntegration }) {
      if (updateNetsuiteIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_661ff6e56ef7e1b7c542b2cc'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteNetsuite] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setShowGlobalError(false)

      const netsuiteProvider = dataRef.current?.provider
      const isEdition = !!netsuiteProvider

      const handleError = (errors: readonly GraphQLFormattedError[]) => {
        if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
          formApi.setErrorMap({
            onDynamic: {
              fields: {
                code: {
                  message: translate('text_632a2d437e341dcc76817556'),
                  path: ['code'],
                },
              },
            },
          })

          const modalContainer = document.getElementsByClassName('MuiDialog-container')[0]

          if (modalContainer) {
            modalContainer.scrollTo({ top: 0 })
          }
        }
      }

      if (isEdition) {
        const res = await updateIntegration({
          variables: {
            input: {
              ...value,
              id: netsuiteProvider?.id || '',
            },
          },
        })

        if (res.errors) {
          handleError(res.errors)
        }
      } else {
        const connectionId = `netsuite-tba-${componentId.replaceAll(':', '')}-${Date.now()}`
        const Nango = (await import('@nangohq/frontend')).default
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoAuthResult = await nango.auth('netsuite-tba', connectionId, {
            params: { accountId: value.accountId },
            credentials: {
              token_id: value.tokenId,
              token_secret: value.tokenSecret,
              oauth_client_id_override: value.clientId,
              oauth_client_secret_override: value.clientSecret,
            },
          })

          if (!!nangoAuthResult) {
            const res = await createIntegration({
              variables: {
                input: { ...value, connectionId },
              },
            })

            if (res.errors) {
              handleError(res.errors)
            }
          }
        } catch {
          setShowGlobalError(true)
        }
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openAddNetsuiteDialog = (data?: OpenAddNetsuiteDialogData) => {
    setShowGlobalError(false)
    dataRef.current = data ?? null
    const netsuiteProvider = data?.provider
    const isEdition = !!netsuiteProvider

    form.reset()
    if (netsuiteProvider) {
      form.setFieldValue('name', netsuiteProvider.name || '')
      form.setFieldValue('code', netsuiteProvider.code || '')
      form.setFieldValue('accountId', netsuiteProvider.accountId || '')
      form.setFieldValue('clientId', netsuiteProvider.clientId || '')
      form.setFieldValue('clientSecret', netsuiteProvider.clientSecret || '')
      form.setFieldValue('tokenId', netsuiteProvider.tokenId || '')
      form.setFieldValue('tokenSecret', netsuiteProvider.tokenSecret || '')
      form.setFieldValue('scriptEndpointUrl', netsuiteProvider.scriptEndpointUrl || '')
      form.setFieldValue('syncCreditNotes', !!netsuiteProvider.syncCreditNotes)
      form.setFieldValue('syncInvoices', !!netsuiteProvider.syncInvoices)
      form.setFieldValue('syncPayments', !!netsuiteProvider.syncPayments)
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_661ff6e56ef7e1b7c542b326',
          {
            name: netsuiteProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_661ff6e56ef7e1b7c542b1da' : 'text_661ff6e56ef7e1b7c542b1d6',
        ),
        children: (
          <div className="flex flex-col gap-8 p-8">
            {showGlobalError && (
              <Alert type="danger">{translate('text_1749562792335fy21gc3sxn0')}</Alert>
            )}

            <div className="flex flex-col gap-6">
              <div className="flex flex-row items-start gap-6">
                <form.AppField name="name">
                  {(field) => (
                    <field.TextInputField
                      className="flex-1"
                      label={translate('text_6419c64eace749372fc72b0f')}
                      placeholder={translate('text_6584550dc4cec7adf861504f')}
                    />
                  )}
                </form.AppField>
                <form.AppField name="code">
                  {(field) => (
                    <field.TextInputField
                      className="flex-1"
                      beforeChangeFormatter="code"
                      label={translate('text_62876e85e32e0300e1803127')}
                      placeholder={translate('text_6584550dc4cec7adf8615053')}
                    />
                  )}
                </form.AppField>
              </div>

              <form.AppField name="accountId">
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter={['lowercase', 'trim', 'dashSeparator']}
                    disabled={isEdition}
                    label={translate('text_661ff6e56ef7e1b7c542b216')}
                    placeholder={translate('text_661ff6e56ef7e1b7c542b224')}
                  />
                )}
              </form.AppField>
              <form.AppField name="clientId">
                {(field) => (
                  <field.TextInputField
                    disabled={isEdition}
                    label={translate('text_661ff6e56ef7e1b7c542b230')}
                    placeholder={translate('text_661ff6e56ef7e1b7c542b23b')}
                  />
                )}
              </form.AppField>
              <form.AppField name="clientSecret">
                {(field) => (
                  <field.TextInputField
                    disabled={isEdition}
                    label={translate('text_661ff6e56ef7e1b7c542b247')}
                    placeholder={translate('text_661ff6e56ef7e1b7c542b251')}
                  />
                )}
              </form.AppField>
              <form.AppField name="tokenId">
                {(field) => (
                  <field.TextInputField
                    disabled={isEdition}
                    label={translate('text_6683cd0bab4ac0007e913af7')}
                    placeholder={translate('text_6683cd1bb93b060070e9a596')}
                  />
                )}
              </form.AppField>
              <form.AppField name="tokenSecret">
                {(field) => (
                  <field.TextInputField
                    disabled={isEdition}
                    label={translate('text_6683cd29cfb79500e588ee47')}
                    placeholder={translate('text_6683cd3f33ac8f005b67345c')}
                  />
                )}
              </form.AppField>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_661ff6e56ef7e1b7c542b25b')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_661ff6e56ef7e1b7c542b267')}
                </Typography>
              </div>

              <form.AppField name="scriptEndpointUrl">
                {(field) => (
                  <field.TextInputField
                    label={translate('text_661ff6e56ef7e1b7c542b271')}
                    placeholder={translate('text_661ff6e56ef7e1b7c542b27d')}
                  />
                )}
              </form.AppField>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_661ff6e56ef7e1b7c542b286')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_661ff6e56ef7e1b7c542b28e')}
                </Typography>
              </div>

              <div className="flex flex-col gap-4">
                <Checkbox
                  disabled
                  label={
                    <NetsuiteSyncLabel
                      firstPart={translate('text_661ff6e56ef7e1b7c542b296')}
                      code={translate('text_661ff6e56ef7e1b7c542b2c2')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <form.AppField name="syncCreditNotes">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <NetsuiteSyncLabel
                          firstPart={translate('text_661ff6e56ef7e1b7c542b296')}
                          code={translate('text_661ff6e56ef7e1b7c542b2e9')}
                          lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                        />
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="syncInvoices">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <NetsuiteSyncLabel
                          firstPart={translate('text_661ff6e56ef7e1b7c542b296')}
                          code={translate('text_661ff6e56ef7e1b7c542b2ff')}
                          lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                        />
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="syncPayments">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <NetsuiteSyncLabel
                          firstPart={translate('text_661ff6e56ef7e1b7c542b296')}
                          code={translate('text_661ff6e56ef7e1b7c542b311')}
                          lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                        />
                      }
                    />
                  )}
                </form.AppField>
              </div>
            </div>
          </div>
        ),
        closeOnError: false,
        onEntered: isEdition ? undefined : focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_661ff6e56ef7e1b7c542b326',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_NETSUITE_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: netsuiteProvider?.name }),
          description: translate('text_661ff6e56ef7e1b7c542b1ec'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const res = await deleteNetsuite({
              variables: { input: { id: netsuiteProvider?.id as string } },
            })

            const destroyedId = res.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'NetsuiteIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetNetsuiteIntegrationsListDocument,
              })

              data?.deleteDialogCallback?.()

              addToast({
                message: translate('text_661ff6e56ef7e1b7c542b2f9'),
                severity: 'success',
              })
            }
          },
        },
      })
      .then((response) => {
        if (response.reason === 'close' || response.reason === 'open-other-dialog') {
          form.reset()
          dataRef.current = null
          setShowGlobalError(false)
        }
      })
  }

  return { openAddNetsuiteDialog }
}

const NetsuiteSyncLabel = ({
  firstPart,
  code,
  lastPart,
}: {
  firstPart: string
  code: string
  lastPart: string
}) => {
  return (
    <div className="flex flex-row flex-wrap items-center gap-1">
      <Typography variant="body" color="grey700">
        {firstPart}
      </Typography>
      <Chip size="small" label={code} color="danger600" />
      <Typography variant="body" color="grey700">
        {lastPart}
      </Typography>
    </div>
  )
}
