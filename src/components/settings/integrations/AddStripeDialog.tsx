import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { STRIPE_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import {
  AddStripePaymentProviderInput,
  AddStripeProviderDialogFragment,
  GetStripeIntegrationsListDocument,
  LagoApiError,
  StripeIntegrationDetailsFragmentDoc,
  useAddStripeApiKeyMutation,
  useDeleteStripeMutation,
  useGetProviderByCodeForStripeLazyQuery,
  useUpdateStripeApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddStripeProviderDialog on StripeProvider {
    id
    name
    code
    secretKey
    supports3ds
  }

  query getProviderByCodeForStripe($code: String) {
    paymentProvider(code: $code) {
      ... on StripeProvider {
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
      ... on AdyenProvider {
        id
      }
      ... on MoneyhashProvider {
        id
      }
    }
  }

  mutation addStripeApiKey($input: AddStripePaymentProviderInput!) {
    addStripePaymentProvider(input: $input) {
      id
      ...AddStripeProviderDialog
      ...StripeIntegrationDetails
    }
  }

  mutation updateStripeApiKey($input: UpdateStripePaymentProviderInput!) {
    updateStripePaymentProvider(input: $input) {
      id
      ...AddStripeProviderDialog
      ...StripeIntegrationDetails
    }
  }

  ${StripeIntegrationDetailsFragmentDoc}
`

const ADD_STRIPE_FORM_ID = 'form-add-stripe-integration'

type OpenAddStripeDialogData = {
  provider?: AddStripeProviderDialogFragment
  deleteCallback?: () => void
}

const defaultFormValues: AddStripePaymentProviderInput = {
  name: '',
  code: '',
  secretKey: '',
  supports3ds: false,
}

const validationSchema = z.object({
  name: z.string(),
  code: z.string().min(1),
  secretKey: z.string().min(1),
  supports3ds: z.boolean().optional(),
})

export const useAddStripeDialog = () => {
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddStripeDialogData | null>(null)
  const successRef = useRef(false)

  const [addApiKey] = useAddStripeApiKeyMutation({
    onCompleted({ addStripePaymentProvider }) {
      if (addStripePaymentProvider?.id) {
        successRef.current = true
        navigate(
          generatePath(STRIPE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addStripePaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Lago,
          }),
        )

        addToast({
          message: translate('text_62b1edddbf5f461ab9712743'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateStripeApiKeyMutation({
    onCompleted({ updateStripePaymentProvider }) {
      if (updateStripePaymentProvider?.id) {
        successRef.current = true
        addToast({
          message: translate('text_62b1edddbf5f461ab97126f6'),
          severity: 'success',
        })
      }
    },
  })

  const [getStripeProviderByCode] = useGetProviderByCodeForStripeLazyQuery()

  const [deleteStripe] = useDeleteStripeMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const stripeProvider = dataRef.current?.provider
      const isEdition = !!stripeProvider

      const res = await getStripeProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: value.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== stripeProvider?.id)

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

      const { secretKey, ...rest } = value

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              ...rest,
              id: stripeProvider?.id || '',
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: { ...rest, secretKey },
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

  const openAddStripeDialog = (data?: OpenAddStripeDialogData) => {
    dataRef.current = data ?? null
    const stripeProvider = data?.provider
    const isEdition = !!stripeProvider

    form.reset()
    if (stripeProvider) {
      form.setFieldValue('name', stripeProvider.name || '')
      form.setFieldValue('code', stripeProvider.code || '')
      form.setFieldValue('secretKey', stripeProvider.secretKey || '')
      form.setFieldValue('supports3ds', stripeProvider.supports3ds || false)
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_6584550dc4cec7adf8615049',
          {
            name: stripeProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_6584697bc905b246e70e5528' : 'text_6584550dc4cec7adf861504b',
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

            <form.AppField name="secretKey">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  description={isEdition ? translate('text_637f813d31381b1ed90ab30e') : undefined}
                  label={translate('text_62b1edddbf5f461ab9712748')}
                  placeholder={translate('text_62b1edddbf5f461ab9712756')}
                />
              )}
            </form.AppField>

            <form.AppField name="supports3ds">
              {(field) => (
                <field.SwitchField
                  label={translate('text_1764107468210ibi78qsrukx')}
                  subLabel={translate('text_1764107468210lbhkj5no1vh')}
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
                isEdition ? 'text_62b1edddbf5f461ab9712769' : 'text_62b1edddbf5f461ab9712773',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_STRIPE_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: stripeProvider?.name }),
          description: translate('text_658461066530343fe1808cdb'),
          colorVariant: 'danger',
          actionText: translate('text_645d071272418a14c1c76a81'),
          onAction: async () => {
            const result = await deleteStripe({
              variables: { input: { id: stripeProvider?.id as string } },
            })

            const destroyedId = result.data?.destroyPaymentProvider?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'StripeProvider',
                listFieldName: 'paymentProviders',
                listQueryDocument: GetStripeIntegrationsListDocument,
              })

              data?.deleteCallback?.()

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

  return { openAddStripeDialog }
}
