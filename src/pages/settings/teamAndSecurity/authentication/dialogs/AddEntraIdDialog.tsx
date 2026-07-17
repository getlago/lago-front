import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { zodDomain, zodOptionalHost } from '~/formValidation/zodCustoms'
import {
  AddEntraIdIntegrationDialogFragment,
  AuthenticationMethodsEnum,
  CreateEntraIdIntegrationInput,
  DeleteEntraIdIntegrationDialogFragmentDoc,
  useCreateEntraIdIntegrationMutation,
  useDestroyIntegrationMutation,
  useUpdateEntraIdIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment AddEntraIdIntegrationDialog on EntraIdIntegration {
    id
    domain
    clientId
    clientSecret
    tenantId
    host
    ...DeleteEntraIdIntegrationDialog
  }

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

  ${DeleteEntraIdIntegrationDialogFragmentDoc}
`

const ADD_ENTRA_ID_FORM_ID = 'form-add-entra-id-integration'

export const ENTRA_ID_INTEGRATION_SUBMIT_BTN = 'add-entra-id-dialog-submit-button'

type OpenAddEntraIdDialogData = {
  integration?: AddEntraIdIntegrationDialogFragment
  callback?: (id: string) => void
  deleteCallback?: () => void
}

const defaultFormValues: CreateEntraIdIntegrationInput = {
  domain: '',
  host: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
}

const validationSchema = z.object({
  domain: zodDomain,
  host: zodOptionalHost,
  clientId: z.string(),
  clientSecret: z.string(),
  tenantId: z.string(),
})

export const useAddEntraIdDialog = () => {
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()

  const dataRef = useRef<OpenAddEntraIdDialogData | null>(null)
  const successRef = useRef(false)

  const [createIntegration] = useCreateEntraIdIntegrationMutation({
    onCompleted: (res) => {
      if (!res.createEntraIdIntegration) return

      successRef.current = true
      dataRef.current?.callback?.(res.createEntraIdIntegration.id)
      addToast({
        severity: 'success',
        message: translate('text_17843073442557vlbdr7do0l', {
          integration: translate('text_17843073442548zt904xoinv'),
        }),
      })
    },
  })

  const [updateIntegration] = useUpdateEntraIdIntegrationMutation({
    onCompleted: (res) => {
      if (!res.updateEntraIdIntegration) return

      successRef.current = true
      dataRef.current?.callback?.(res.updateEntraIdIntegration.id)
      addToast({
        severity: 'success',
        message: translate('text_1784307344255zrzb2qqjiig', {
          integration: translate('text_17843073442548zt904xoinv'),
        }),
      })
    },
  })

  const [deleteIntegration] = useDestroyIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const integration = dataRef.current?.integration

      if (integration) {
        await updateIntegration({
          variables: {
            input: {
              ...value,
              id: integration.id,
            },
          },
        })
      } else {
        await createIntegration({ variables: { input: value } })
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
      (method) => method !== AuthenticationMethodsEnum.EntraId,
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
        title: translate(
          isEdition ? 'text_1784307344255fc26gfvrmb5' : 'text_1784307344255w8by29g8nm6',
        ),
        description: translate(
          isEdition ? 'text_17843073442551nurtvrqz3y' : 'text_1784307344255lwooki6f5o9',
        ),
        children: (
          <div className="flex flex-col gap-6 p-8">
            <form.AppField name="domain">
              {(field) => (
                <field.TextInputField
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  label={translate('text_1784307344255m1d8phj5f9r')}
                  placeholder={translate('text_1784307344255j97hb85e9r0')}
                  helperText={translate('text_1784307344255lryszig50wc')}
                />
              )}
            </form.AppField>
            <form.AppField name="host">
              {(field) => (
                <field.TextInputField
                  label={translate('text_17843073442557gr1lnot7cr')}
                  placeholder={translate('text_1784307344255q2974p1d3gs')}
                />
              )}
            </form.AppField>
            <form.AppField name="clientId">
              {(field) => (
                <field.TextInputField
                  label={translate('text_17843073442552x8gcpunesv')}
                  placeholder={translate('text_1784307344255kkmg7664unz')}
                />
              )}
            </form.AppField>
            <form.AppField name="clientSecret">
              {(field) => (
                <field.TextInputField
                  label={translate('text_17843073442551xjnrw1h4bc')}
                  placeholder={translate('text_1784307344255ofy9u1w0hqh')}
                />
              )}
            </form.AppField>
            <form.AppField name="tenantId">
              {(field) => (
                <field.TextInputField
                  label={translate('text_1784307344255tyzraziy4d1')}
                  placeholder={translate('text_1784307344255xv4zgs56gin')}
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest={ENTRA_ID_INTEGRATION_SUBMIT_BTN}>
              {translate(
                isEdition ? 'text_664c732c264d7eed1c74fdaa' : 'text_17843073442559h8ul6r7wf1',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_ENTRA_ID_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog:
          isEdition && !!data?.deleteCallback && !!hasOtherAuthenticationMethodsThanEntraId,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_1784307344255lgty3uwoghl'),
          description: translate('text_17843073442556cjrcl7drw6'),
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
              addToast({
                message: translate('text_17843073442557u380a217wd', {
                  integration: translate('text_17843073442548zt904xoinv'),
                }),
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

  return { openAddEntraIdDialog }
}
