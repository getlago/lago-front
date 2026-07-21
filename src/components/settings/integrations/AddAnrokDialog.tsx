import { FetchResult, gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useId, useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, envGlobalVar, hasDefinedGQLError } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANROK_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddAnrokIntegrationDialogFragment,
  AnrokIntegrationDetailsFragmentDoc,
  CreateAnrokIntegrationMutation,
  GetAnrokIntegrationsListDocument,
  LagoApiError,
  UpdateAnrokIntegrationMutation,
  useCreateAnrokIntegrationMutation,
  useDestroyNangoIntegrationMutation,
  useUpdateAnrokIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AnrokIntegrationDetailsTabs } from '~/pages/settings/AnrokIntegrationDetails'

gql`
  fragment AddAnrokIntegrationDialog on AnrokIntegration {
    id
    name
    code
    apiKey
  }

  mutation createAnrokIntegration($input: CreateAnrokIntegrationInput!) {
    createAnrokIntegration(input: $input) {
      id
      ...AddAnrokIntegrationDialog
      ...AnrokIntegrationDetails
    }
  }

  mutation updateAnrokIntegration($input: UpdateAnrokIntegrationInput!) {
    updateAnrokIntegration(input: $input) {
      id
      ...AddAnrokIntegrationDialog
      ...AnrokIntegrationDetails
    }
  }

  ${AnrokIntegrationDetailsFragmentDoc}
`

const ADD_ANROK_FORM_ID = 'form-add-anrok-integration'

type AddAnrokFormValues = {
  name: string
  code: string
  apiKey: string
}

const defaultFormValues: AddAnrokFormValues = {
  name: '',
  code: '',
  apiKey: '',
}

const validationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  apiKey: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
})

type OpenAddAnrokDialogData = {
  integration?: AddAnrokIntegrationDialogFragment
  deleteCallback?: () => void
}

export const useAddAnrokDialog = () => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddAnrokDialogData | null>(null)
  const successRef = useRef(false)

  const [addAnrok] = useCreateAnrokIntegrationMutation({
    onCompleted({ createAnrokIntegration }) {
      if (createAnrokIntegration?.id) {
        successRef.current = true
        navigate(
          generatePath(ANROK_INTEGRATION_DETAILS_ROUTE, {
            integrationId: createAnrokIntegration.id,
            tab: AnrokIntegrationDetailsTabs.Settings,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_6668821d94e4da4dfd8b38e9'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateAnrokIntegrationMutation({
    onCompleted({ updateAnrokIntegration }) {
      if (updateAnrokIntegration?.id) {
        successRef.current = true
        addToast({
          message: translate('text_6668821d94e4da4dfd8b38f3'),
          severity: 'success',
        })
      }
    },
  })

  const [deleteAnrok] = useDestroyNangoIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const anrokIntegration = dataRef.current?.integration
      const isEdition = !!anrokIntegration
      const { apiKey, ...values } = value

      let res: FetchResult<CreateAnrokIntegrationMutation | UpdateAnrokIntegrationMutation> = {}

      if (isEdition) {
        res = await updateApiKey({
          variables: {
            input: {
              id: anrokIntegration?.id || '',
              ...values,
            },
          },
          context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
        })
      } else {
        const Nango = (await import('@nangohq/frontend')).default
        const connectionId = `anrok-${componentId.replaceAll(':', '')}-${Date.now()}`
        const nango = new Nango({ publicKey: nangoPublicKey })

        try {
          const nangoApiKeyConnection = await nango.auth('anrok', connectionId, {
            credentials: {
              apiKey,
            },
          })

          res = await addAnrok({
            variables: {
              input: {
                ...values,
                apiKey,
                connectionId: nangoApiKeyConnection?.connectionId || '',
              },
            },
            context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
          })
        } catch {
          // Nango auth failed — nothing to report to the form
        }
      }

      if (hasDefinedGQLError('ValueAlreadyExist', res.errors)) {
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

  const openAddAnrokDialog = (data?: OpenAddAnrokDialogData) => {
    dataRef.current = data ?? null
    const anrokIntegration = data?.integration
    const isEdition = !!anrokIntegration

    form.reset()
    if (anrokIntegration) {
      form.setFieldValue('name', anrokIntegration.name || '')
      form.setFieldValue('code', anrokIntegration.code || '')
      form.setFieldValue('apiKey', anrokIntegration.apiKey || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_666887f6c4d092aa1e1a8477',
          {
            name: anrokIntegration?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_666889d43a2ea34eb2aa3e55' : 'text_666887f6c4d092aa1e1a8478',
        ),
        children: (
          <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-row items-start gap-6">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    className="flex-1"
                    label={translate('text_6584550dc4cec7adf861504d')}
                    placeholder={translate('text_6584550dc4cec7adf861504f')}
                  />
                )}
              </form.AppField>
              <form.AppField name="code">
                {(field) => (
                  <field.TextInputField
                    className="flex-1"
                    label={translate('text_6584550dc4cec7adf8615051')}
                    placeholder={translate('text_6584550dc4cec7adf8615053')}
                  />
                )}
              </form.AppField>
            </div>

            <form.AppField name="apiKey">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_6668821d94e4da4dfd8b38d5')}
                  placeholder={translate('text_666887f6c4d092aa1e1a847e')}
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        onEntered: focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_666887f6c4d092aa1e1a8477',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_ANROK_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: anrokIntegration?.name }),
          description: translate('text_6668870bc8bdb352948ffb5f'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const res = await deleteAnrok({
              variables: { input: { id: anrokIntegration?.id as string } },
            })

            const destroyedId = res.data?.destroyIntegration?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'AnrokIntegration',
                listFieldName: 'integrations',
                listQueryDocument: GetAnrokIntegrationsListDocument,
              })

              data?.deleteCallback?.()

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
        }
      })
  }

  return { openAddAnrokDialog }
}
