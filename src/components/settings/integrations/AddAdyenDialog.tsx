import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ADYEN_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddAdyenPaymentProviderInput,
  AddAdyenProviderDialogFragment,
  AdyenIntegrationDetailsFragmentDoc,
  GetAdyenIntegrationsListDocument,
  LagoApiError,
  useAddAdyenApiKeyMutation,
  useDeleteAdyenIntegrationMutation,
  useGetProviderByCodeForAdyenLazyQuery,
  useUpdateAdyenApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddAdyenProviderDialog on AdyenProvider {
    id
    name
    code
    apiKey
    hmacKey
    livePrefix
    merchantAccount
  }

  query getProviderByCodeForAdyen($code: String) {
    paymentProvider(code: $code) {
      ... on AdyenProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on FlutterwaveProvider {
        id
      }
      ... on CashfreeProvider {
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

  mutation addAdyenApiKey($input: AddAdyenPaymentProviderInput!) {
    addAdyenPaymentProvider(input: $input) {
      id

      ...AddAdyenProviderDialog
      ...AdyenIntegrationDetails
    }
  }

  mutation updateAdyenApiKey($input: UpdateAdyenPaymentProviderInput!) {
    updateAdyenPaymentProvider(input: $input) {
      id

      ...AddAdyenProviderDialog
      ...AdyenIntegrationDetails
    }
  }

  mutation deleteAdyenIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }

  ${AdyenIntegrationDetailsFragmentDoc}
`

const ADD_ADYEN_FORM_ID = 'form-add-adyen-integration'

type OpenAddAdyenDialogData = {
  provider?: AddAdyenProviderDialogFragment
  deleteCallback?: () => void
}

const defaultFormValues: AddAdyenPaymentProviderInput = {
  name: '',
  code: '',
  apiKey: '',
  hmacKey: '',
  livePrefix: '',
  merchantAccount: '',
}

const validationSchema = z.object({
  name: z.string(),
  code: z.string().min(1),
  apiKey: z.string().min(1),
  hmacKey: z.string().optional(),
  livePrefix: z.string().optional(),
  merchantAccount: z.string().min(1),
})

export const useAddAdyenDialog = () => {
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddAdyenDialogData | null>(null)
  const successRef = useRef(false)

  const [addApiKey] = useAddAdyenApiKeyMutation({
    onCompleted({ addAdyenPaymentProvider }) {
      if (addAdyenPaymentProvider?.id) {
        successRef.current = true
        navigate(
          generatePath(ADYEN_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addAdyenPaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_645d071272418a14c1c76a93'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateAdyenApiKeyMutation({
    onCompleted({ updateAdyenPaymentProvider }) {
      if (updateAdyenPaymentProvider?.id) {
        successRef.current = true
        addToast({
          message: translate('text_645d071272418a14c1c76a3e'),
          severity: 'success',
        })
      }
    },
  })

  const [getAdyenProviderByCode] = useGetProviderByCodeForAdyenLazyQuery()

  const [deleteAdyen] = useDeleteAdyenIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const adyenProvider = dataRef.current?.provider
      const isEdition = !!adyenProvider

      const res = await getAdyenProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: value.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== adyenProvider?.id)

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

      const { apiKey, merchantAccount, hmacKey, livePrefix, ...rest } = value

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              ...rest,
              id: adyenProvider?.id || '',
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: { ...rest, apiKey, merchantAccount, hmacKey, livePrefix },
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

  const openAddAdyenDialog = (data?: OpenAddAdyenDialogData) => {
    dataRef.current = data ?? null
    const adyenProvider = data?.provider
    const isEdition = !!adyenProvider

    form.reset()
    if (adyenProvider) {
      form.setFieldValue('name', adyenProvider.name || '')
      form.setFieldValue('code', adyenProvider.code || '')
      form.setFieldValue('apiKey', adyenProvider.apiKey || '')
      form.setFieldValue('hmacKey', adyenProvider.hmacKey || '')
      form.setFieldValue('livePrefix', adyenProvider.livePrefix || '')
      form.setFieldValue('merchantAccount', adyenProvider.merchantAccount || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_658466afe6140b469140e1fa',
          {
            name: adyenProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_65846a0ed9fdbd46c4afc42d' : 'text_658466afe6140b469140e1fc',
        ),
        children: (
          <div className="mb-8 flex flex-col gap-6">
            <div className="flex flex-row items-start gap-6">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    className="flex-1"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
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
                  label={translate('text_645d071272418a14c1c76a77')}
                  placeholder={translate('text_645d071272418a14c1c76a83')}
                />
              )}
            </form.AppField>
            <form.AppField name="merchantAccount">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_645d071272418a14c1c76a8f')}
                  placeholder={translate('text_645d071272418a14c1c76a9c')}
                />
              )}
            </form.AppField>
            {(!isEdition || !!adyenProvider.livePrefix) && (
              <form.AppField name="livePrefix">
                {(field) => (
                  <field.TextInputField
                    disabled={isEdition}
                    label={translate('text_645d071272418a14c1c76aa6')}
                    placeholder={translate('text_645d071272418a14c1c76ab0')}
                  />
                )}
              </form.AppField>
            )}
            {(!isEdition || !!adyenProvider.hmacKey) && (
              <form.AppField name="hmacKey">
                {(field) => (
                  <field.TextInputField
                    disabled={isEdition}
                    label={translate('text_645d071272418a14c1c76aba')}
                    placeholder={translate('text_645d071272418a14c1c76ac4')}
                  />
                )}
              </form.AppField>
            )}
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                isEdition ? 'text_645d071272418a14c1c76a67' : 'text_645d071272418a14c1c76ad8',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_ADYEN_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: adyenProvider?.name }),
          description: translate('text_658461066530343fe1808cc2'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const result = await deleteAdyen({
              variables: { input: { id: adyenProvider?.id as string } },
            })

            const destroyedId = result.data?.destroyPaymentProvider?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'AdyenProvider',
                listFieldName: 'paymentProviders',
                listQueryDocument: GetAdyenIntegrationsListDocument,
              })

              data?.deleteCallback?.()

              addToast({
                message: translate('text_645d071272418a14c1c76b25'),
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

  return { openAddAdyenDialog }
}
