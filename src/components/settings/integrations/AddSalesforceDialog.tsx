import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { SALESFORCE_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  GetSalesforceIntegrationsListDocument,
  SalesforceForCreateDialogFragment,
  useCreateSalesforceIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateSalesforceIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment SalesforceForCreateDialog on SalesforceIntegration {
    id
    name
    code
    instanceId
  }

  mutation createSalesforceIntegration($input: CreateSalesforceIntegrationInput!) {
    createSalesforceIntegration(input: $input) {
      ...SalesforceForCreateDialog
    }
  }

  mutation updateSalesforceIntegration($input: UpdateSalesforceIntegrationInput!) {
    updateSalesforceIntegration(input: $input) {
      ...SalesforceForCreateDialog
    }
  }
`

const ADD_SALESFORCE_FORM_ID = 'form-add-salesforce-integration'

type AddSalesforceFormValues = {
  name: string
  code: string
  instanceId: string
}

const defaultFormValues: AddSalesforceFormValues = {
  name: '',
  code: '',
  instanceId: '',
}

const validationSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  instanceId: z.string().min(1),
})

type OpenAddSalesforceDialogData = {
  provider?: SalesforceForCreateDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddSalesforceDialog = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddSalesforceDialogData | null>(null)
  const successRef = useRef(false)

  const [showGlobalError, setShowGlobalError] = useState(false)

  const [createIntegration] = useCreateSalesforceIntegrationMutation({
    onCompleted({ createSalesforceIntegration }) {
      if (createSalesforceIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(SALESFORCE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createSalesforceIntegration.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_1731510123491jw90gdbc5kj'),
          severity: 'success',
        })
      }
    },
  })

  const [updateIntegration] = useUpdateSalesforceIntegrationMutation({
    onCompleted({ updateSalesforceIntegration }) {
      if (updateSalesforceIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_1731510123491t2zwypps84n'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteSalesforce] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setShowGlobalError(false)

      const salesforceProvider = dataRef.current?.provider
      const isEdition = !!salesforceProvider

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

      try {
        if (isEdition) {
          const res = await updateIntegration({
            variables: {
              input: {
                ...value,
                id: salesforceProvider?.id || '',
              },
            },
          })

          if (res.errors) {
            handleError(res.errors)
          }
        } else {
          const res = await createIntegration({
            variables: {
              input: value,
            },
          })

          if (res.errors) {
            handleError(res.errors)
          }
        }
      } catch {
        setShowGlobalError(true)
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

  const openAddSalesforceDialog = (data?: OpenAddSalesforceDialogData) => {
    setShowGlobalError(false)
    dataRef.current = data ?? null
    const salesforceProvider = data?.provider
    const isEdition = !!salesforceProvider

    form.reset()
    if (salesforceProvider) {
      form.setFieldValue('name', salesforceProvider.name || '')
      form.setFieldValue('code', salesforceProvider.code || '')
      form.setFieldValue('instanceId', salesforceProvider.instanceId || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_1731510123491sksb908hxue',
          {
            name: salesforceProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_1731510123491o9q0fi9aov2' : 'text_1731510123491i56n7tz55bx',
        ),
        children: (
          <div className="flex w-full flex-col gap-8 p-8">
            {showGlobalError && (
              <Alert type="danger">{translate('text_1749562792335fy21gc3sxn0')}</Alert>
            )}
            <div className="flex w-full flex-row items-start gap-6 *:flex-1">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    label={translate('text_6419c64eace749372fc72b0f')}
                    placeholder={translate('text_6584550dc4cec7adf861504f')}
                  />
                )}
              </form.AppField>
              <form.AppField name="code">
                {(field) => (
                  <field.TextInputField
                    beforeChangeFormatter="code"
                    label={translate('text_62876e85e32e0300e1803127')}
                    placeholder={translate('text_6584550dc4cec7adf8615053')}
                  />
                )}
              </form.AppField>
            </div>
            <form.AppField name="instanceId">
              {(field) => (
                <field.TextInputField
                  label={translate('text_1731510123491s8iyc3roglx')}
                  placeholder={translate('text_1731510123491bap94avpqyz')}
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        onEntered: isEdition ? undefined : focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_1731510123491sksb908hxue',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_SALESFORCE_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', {
            name: salesforceProvider?.name,
          }),
          description: translate('text_1731511951723v0hq5fotjrx'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const result = await deleteSalesforce({
              variables: {
                input: {
                  id: salesforceProvider?.id as string,
                },
              },
            })

            const destroyedId = result.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'SalesforceIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetSalesforceIntegrationsListDocument,
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

  return { openAddSalesforceDialog }
}
