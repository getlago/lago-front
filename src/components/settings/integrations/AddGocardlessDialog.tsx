import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { buildGocardlessAuthUrl } from '~/core/constants/externalUrls'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { GOCARDLESS_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddGocardlessProviderDialogFragment,
  GetGocardlessIntegrationsListDocument,
  GocardlessIntegrationDetailsFragmentDoc,
  LagoApiError,
  useDeleteGocardlessMutation,
  useGetProviderByCodeForGocardlessLazyQuery,
  useUpdateGocardlessApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddGocardlessProviderDialog on GocardlessProvider {
    id
    name
    code
  }

  query getProviderByCodeForGocardless($code: String) {
    paymentProvider(code: $code) {
      ... on GocardlessProvider {
        id
      }
      ... on CashfreeProvider {
        id
      }
      ... on FlutterwaveProvider {
        id
      }
      ... on AdyenProvider {
        id
      }
      ... on StripeProvider {
        id
      }
      ... on MoneyhashProvider {
        id
      }
    }
  }

  mutation updateGocardlessApiKey($input: UpdateGocardlessPaymentProviderInput!) {
    updateGocardlessPaymentProvider(input: $input) {
      id
      ...AddGocardlessProviderDialog
      ...GocardlessIntegrationDetails
    }
  }

  ${GocardlessIntegrationDetailsFragmentDoc}
`

const ADD_GOCARDLESS_FORM_ID = 'form-add-gocardless-integration'

type AddGocardlessFormValues = {
  name: string
  code: string
}

const defaultFormValues: AddGocardlessFormValues = {
  name: '',
  code: '',
}

const validationSchema = z.object({
  name: z.string(),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
})

type OpenAddGocardlessDialogData = {
  provider?: AddGocardlessProviderDialogFragment
  deleteDialogCallback?: () => void
}

export const useAddGocardlessDialog = () => {
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { lagoOauthProxyUrl } = envGlobalVar()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddGocardlessDialogData | null>(null)
  const successRef = useRef(false)

  const [updateApiKey] = useUpdateGocardlessApiKeyMutation({
    onCompleted({ updateGocardlessPaymentProvider }) {
      if (updateGocardlessPaymentProvider?.id) {
        successRef.current = true
        navigate(
          generatePath(GOCARDLESS_INTEGRATION_DETAILS_ROUTE, {
            integrationId: updateGocardlessPaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        const toastKey = dataRef.current?.provider
          ? 'Edit gocardless success toast'
          : 'Add gocardless success toast'

        addToast({
          message: translate(toastKey),
          severity: 'success',
        })
      }
    },
  })

  const [getGocardlessProviderByCode] = useGetProviderByCodeForGocardlessLazyQuery()

  const [deleteGocardless] = useDeleteGocardlessMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const gocardlessProvider = dataRef.current?.provider
      const isEdition = !!gocardlessProvider

      const res = await getGocardlessProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: value.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== gocardlessProvider?.id)

      if (isNotAllowedToMutate) {
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
        return
      }

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: { ...value, id: gocardlessProvider?.id || '' },
          },
        })
      } else {
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = buildGocardlessAuthUrl(lagoOauthProxyUrl, value.name, value.code)
          myWindow?.focus()
          successRef.current = true
          return
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
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

  const openAddGocardlessDialog = (data?: OpenAddGocardlessDialogData) => {
    dataRef.current = data ?? null
    const gocardlessProvider = data?.provider
    const isEdition = !!gocardlessProvider

    form.reset()
    if (gocardlessProvider) {
      form.setFieldValue('name', gocardlessProvider.name || '')
      form.setFieldValue('code', gocardlessProvider.code || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_658466afe6140b469140e1f9',
          {
            name: gocardlessProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_658461066530343fe1808cdd' : 'text_658466afe6140b469140e1fb',
        ),
        children: (
          <div className="flex flex-row items-start gap-6 p-8">
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
        ),
        closeOnError: false,
        onEntered: focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_658466afe6140b469140e207',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_GOCARDLESS_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: gocardlessProvider?.name }),
          description: translate('text_65846181a741a1401ecdddb7'),
          actionText: translate('text_659d5de7c9b7f51394f7f3fd'),
          colorVariant: 'danger',
          onAction: async () => {
            const res = await deleteGocardless({
              variables: { input: { id: gocardlessProvider?.id as string } },
            })

            const destroyedId = res.data?.destroyPaymentProvider?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'GocardlessProvider',
                listFieldName: 'paymentProviders',
                listQueryDocument: GetGocardlessIntegrationsListDocument,
              })

              data?.deleteDialogCallback?.()

              addToast({
                message: translate('text_62b1edddbf5f461ab9712758'),
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

  return { openAddGocardlessDialog }
}
