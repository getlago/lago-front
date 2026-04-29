import { gql, useMutation } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { zodDomain, zodOptionalHost } from '~/formValidation/zodCustoms'
import { AuthenticationMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  mutation createEntraIdIntegration($input: CreateEntraIdIntegrationInput!) {
    createEntraIdIntegration(input: $input) {
      id
    }
  }

  mutation updateEntraIdIntegration($input: UpdateEntraIdIntegrationInput!) {
    updateEntraIdIntegration(input: $input) {
      id
    }
  }

  mutation DestroyIntegration($input: DestroyIntegrationInput!) {
    destroyIntegration(input: $input) {
      id
    }
  }
`

type EntraIdIntegrationForm = {
  id: string
  domain?: string | null
  host?: string | null
  clientId?: string | null
  clientSecret?: string | null
  tenantId?: string | null
}

type OpenAddEntraIdDialogData = {
  integration?: EntraIdIntegrationForm
  callback?: (id: string) => void
  deleteCallback?: () => void
}

type EntraIdInput = {
  domain: string
  host: string
  clientId: string
  clientSecret: string
  tenantId: string
}

const defaultFormValues: EntraIdInput = {
  domain: '',
  host: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
}

const validationSchema = z.object({
  domain: zodDomain,
  host: zodOptionalHost,
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  tenantId: z.string().min(1),
})

const ENTRA_ID_METHOD = 'entra_id' as AuthenticationMethodsEnum

export const useAddEntraIdDialog = () => {
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()

  const dataRef = useRef<OpenAddEntraIdDialogData | null>(null)
  const successRef = useRef(false)

  const [createIntegration] = useMutation<{ createEntraIdIntegration?: { id: string } }>(gql`
    mutation createEntraIdIntegration($input: CreateEntraIdIntegrationInput!) {
      createEntraIdIntegration(input: $input) {
        id
      }
    }
  `)

  const [updateIntegration] = useMutation<{ updateEntraIdIntegration?: { id: string } }>(gql`
    mutation updateEntraIdIntegration($input: UpdateEntraIdIntegrationInput!) {
      updateEntraIdIntegration(input: $input) {
        id
      }
    }
  `)

  const [deleteIntegration] = useMutation<{ destroyIntegration?: { id: string } }>(gql`
    mutation DestroyIntegration($input: DestroyIntegrationInput!) {
      destroyIntegration(input: $input) {
        id
      }
    }
  `)

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const integration = dataRef.current?.integration

      if (integration) {
        const res = await updateIntegration({
          variables: {
            input: {
              id: integration.id,
              domain: value.domain,
              host: value.host,
              clientId: value.clientId,
              clientSecret: value.clientSecret,
              tenantId: value.tenantId,
            },
          },
        })

        if (res.data?.updateEntraIdIntegration?.id) {
          successRef.current = true
          dataRef.current?.callback?.(res.data.updateEntraIdIntegration.id)
          addToast({ severity: 'success', message: 'Entra ID integration updated' })
        }
      } else {
        const res = await createIntegration({
          variables: {
            input: {
              domain: value.domain,
              host: value.host,
              clientId: value.clientId,
              clientSecret: value.clientSecret,
              tenantId: value.tenantId,
            },
          },
        })

        if (res.data?.createEntraIdIntegration?.id) {
          successRef.current = true
          dataRef.current?.callback?.(res.data.createEntraIdIntegration.id)
          addToast({ severity: 'success', message: 'Entra ID integration created' })
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

  const openAddEntraIdDialog = (data?: OpenAddEntraIdDialogData) => {
    dataRef.current = data ?? null
    const integration = data?.integration
    const isEdition = !!integration

    const hasOtherAuthenticationMethodsThanEntraId = organization?.authenticationMethods.some(
      (method) => method !== ENTRA_ID_METHOD,
    )

    form.reset()
    if (integration) {
      form.setFieldValue('domain', integration.domain || '')
      form.setFieldValue('host', integration.host || '')
      form.setFieldValue('clientId', integration.clientId || '')
      form.setFieldValue('clientSecret', integration.clientSecret || '')
      form.setFieldValue('tenantId', integration.tenantId || '')
    }

    formDialogOpeningDialog
      .open({
        title: isEdition ? 'Edit Entra ID integration' : 'Add Entra ID integration',
        description: 'Configure Microsoft Entra ID SSO settings.',
        children: (
          <div className="flex flex-col gap-6 p-8">
            <form.AppField name="domain">
              {(field) => (
                <field.TextInputField
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  label="Email domain"
                  placeholder="example.com"
                  helperText="Only users from this email domain can use this SSO provider."
                />
              )}
            </form.AppField>
            <form.AppField name="host">
              {(field) => (
                <field.TextInputField
                  label="Host (optional)"
                  placeholder="login.microsoftonline.com"
                />
              )}
            </form.AppField>
            <form.AppField name="tenantId">
              {(field) => (
                <field.TextInputField
                  label="Tenant ID"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              )}
            </form.AppField>
            <form.AppField name="clientId">
              {(field) => (
                <field.TextInputField
                  label="Client ID"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              )}
            </form.AppField>
            <form.AppField name="clientSecret">
              {(field) => (
                <field.TextInputField label="Client secret" placeholder="Client secret value" />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest="add-entra-id-dialog-submit-button">
              {translate(
                isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_664c732c264d7eed1c74fdcb',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: 'form-add-entra-id-integration',
          submit: handleSubmit,
        },
        canOpenDialog:
          isEdition && !!data?.deleteCallback && !!hasOtherAuthenticationMethodsThanEntraId,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_664c900d2d312a01546bd84b'),
          description: translate('text_664c900d2d312a01546bd84c'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const result = await deleteIntegration({
              variables: {
                input: {
                  id: integration?.id ?? '',
                },
              },
              update(cache) {
                cache.evict({ id: `EntraIdIntegration:${integration?.id}` })
              },
            })

            if (result.data?.destroyIntegration) {
              data?.deleteCallback?.()
              addToast({ message: 'Entra ID integration deleted', severity: 'success' })
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

  return { openAddEntraIdDialog }
}
