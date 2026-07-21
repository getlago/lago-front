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
import { useNavigate, XERO_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  GetXeroIntegrationsListDocument,
  useCreateXeroIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateXeroIntegrationMutation,
  XeroForCreateDialogDialogFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { XeroIntegrationDetailsTabs } from '~/pages/settings/XeroIntegrationDetails'

gql`
  fragment XeroForCreateDialogDialog on XeroIntegration {
    id
    code
    connectionId
    hasMappingsConfigured
    name
    syncCreditNotes
    syncInvoices
    syncPayments
  }

  mutation createXeroIntegration($input: CreateXeroIntegrationInput!) {
    createXeroIntegration(input: $input) {
      ...XeroForCreateDialogDialog
    }
  }

  mutation updateXeroIntegration($input: UpdateXeroIntegrationInput!) {
    updateXeroIntegration(input: $input) {
      ...XeroForCreateDialogDialog
    }
  }
`

const ADD_XERO_FORM_ID = 'form-add-xero-integration'

type AddXeroFormValues = {
  name: string
  code: string
  syncCreditNotes: boolean
  syncInvoices: boolean
  syncPayments: boolean
}

const defaultFormValues: AddXeroFormValues = {
  name: '',
  code: '',
  syncCreditNotes: false,
  syncInvoices: false,
  syncPayments: false,
}

const validationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  syncCreditNotes: z.boolean(),
  syncInvoices: z.boolean(),
  syncPayments: z.boolean(),
})

type OpenAddXeroDialogData = {
  provider?: XeroForCreateDialogDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddXeroDialog = () => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()

  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddXeroDialogData | null>(null)
  const successRef = useRef(false)

  const [showGlobalError, setShowGlobalError] = useState(false)

  const [createIntegration] = useCreateXeroIntegrationMutation({
    onCompleted({ createXeroIntegration }) {
      if (createXeroIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(XERO_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createXeroIntegration.id,
            tab: XeroIntegrationDetailsTabs.Settings,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_6672ebb8b1b50be550eccb00'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getXeroIntegrationsList'],
  })

  const [updateIntegration] = useUpdateXeroIntegrationMutation({
    onCompleted({ updateXeroIntegration }) {
      if (updateXeroIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_6672ebb8b1b50be550eccb0b'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteXero] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setShowGlobalError(false)

      const xeroProvider = dataRef.current?.provider
      const isEdition = !!xeroProvider

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
              id: xeroProvider?.id || '',
            },
          },
        })

        if (res.errors) {
          handleError(res.errors)
        }
      } else {
        const connectionId = `xero-${componentId.replaceAll(':', '')}-${Date.now()}`
        const Nango = (await import('@nangohq/frontend')).default
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoAuthResult = await nango.auth('xero', connectionId)

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

  const openAddXeroDialog = (data?: OpenAddXeroDialogData) => {
    setShowGlobalError(false)
    dataRef.current = data ?? null
    const xeroProvider = data?.provider
    const isEdition = !!xeroProvider

    form.reset()
    if (xeroProvider) {
      form.setFieldValue('name', xeroProvider.name || '')
      form.setFieldValue('code', xeroProvider.code || '')
      form.setFieldValue('syncCreditNotes', !!xeroProvider.syncCreditNotes)
      form.setFieldValue('syncInvoices', !!xeroProvider.syncInvoices)
      form.setFieldValue('syncPayments', !!xeroProvider.syncPayments)
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_6672ebb8b1b50be550ecca9e',
          {
            name: xeroProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_6672ee6c7b6cb300d6cc31f3' : 'text_6672ebb8b1b50be550eccaa6',
        ),
        children: (
          <div className="flex flex-col gap-8 p-8">
            {showGlobalError && (
              <Alert type="danger">{translate('text_1749562792335fy21gc3sxn0')}</Alert>
            )}

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

            <div className="flex flex-col gap-6">
              <div>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_6672ebb8b1b50be550eccad6')}
                </Typography>
                <Typography variant="caption" color="grey600">
                  {translate('text_661ff6e56ef7e1b7c542b28e')}
                </Typography>
              </div>

              <div className="flex flex-col gap-4">
                <Checkbox
                  disabled
                  label={
                    <XeroSyncLabel
                      firstPart={translate('text_6672ebb8b1b50be550eccaee')}
                      code={translate('text_661ff6e56ef7e1b7c542b2a6')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <Checkbox
                  disabled
                  label={
                    <XeroSyncLabel
                      firstPart={translate('text_6672ebb8b1b50be550eccaee')}
                      code={translate('text_661ff6e56ef7e1b7c542b2c2')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <Checkbox
                  disabled
                  label={
                    <XeroSyncLabel
                      firstPart={translate('text_6672ebb8b1b50be550eccaee')}
                      code={translate('text_661ff6e56ef7e1b7c542b2d7')}
                      lastPart={translate('text_661ff6e56ef7e1b7c542b29e')}
                    />
                  }
                  value={true}
                />
                <form.AppField name="syncCreditNotes">
                  {(field) => (
                    <field.CheckboxField
                      label={
                        <XeroSyncLabel
                          firstPart={translate('text_6672ebb8b1b50be550eccaee')}
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
                        <XeroSyncLabel
                          firstPart={translate('text_6672ebb8b1b50be550eccaee')}
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
                        <XeroSyncLabel
                          firstPart={translate('text_6672ebb8b1b50be550eccaee')}
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
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_6672ebb8b1b50be550ecca9e',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_XERO_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: xeroProvider?.name }),
          description: translate('text_6672ebb8b1b50be550eccada'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const res = await deleteXero({
              variables: { input: { id: xeroProvider?.id as string } },
            })

            const destroyedId = res.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'XeroIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetXeroIntegrationsListDocument,
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

  return { openAddXeroDialog }
}

const XeroSyncLabel = ({
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
