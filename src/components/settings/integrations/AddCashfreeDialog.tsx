import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'
import { z } from 'zod'

import { useFormDialogOpeningDialog } from '~/components/dialogs/FormDialogOpeningDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CASHFREE_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { zodOptionalUrl } from '~/formValidation/zodCustoms'
import {
  AddCashfreeProviderDialogFragment,
  CashfreeIntegrationDetailsFragmentDoc,
  DeleteCashfreeIntegrationDialogFragmentDoc,
  GetCashfreeIntegrationsListDocument,
  LagoApiError,
  useAddCashfreeApiKeyMutation,
  useDeleteCashfreeMutation,
  useGetProviderByCodeForCashfreeLazyQuery,
  useUpdateCashfreeApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddCashfreeProviderDialog on CashfreeProvider {
    id
    name
    code
    clientId
    clientSecret
    successRedirectUrl
  }

  query getProviderByCodeForCashfree($code: String) {
    paymentProvider(code: $code) {
      ... on CashfreeProvider {
        id
      }
      ... on GocardlessProvider {
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

  mutation addCashfreeApiKey($input: AddCashfreePaymentProviderInput!) {
    addCashfreePaymentProvider(input: $input) {
      id
      ...AddCashfreeProviderDialog
      ...CashfreeIntegrationDetails
    }
  }

  mutation updateCashfreeApiKey($input: UpdateCashfreePaymentProviderInput!) {
    updateCashfreePaymentProvider(input: $input) {
      id
      ...AddCashfreeProviderDialog
      ...CashfreeIntegrationDetails
    }
  }

  ${CashfreeIntegrationDetailsFragmentDoc}
  ${DeleteCashfreeIntegrationDialogFragmentDoc}
`

const ADD_CASHFREE_FORM_ID = 'form-add-cashfree-integration'

type AddCashfreeFormValues = {
  name: string
  code: string
  clientId: string
  clientSecret: string
  successRedirectUrl: string
}

const defaultFormValues: AddCashfreeFormValues = {
  name: '',
  code: '',
  clientId: '',
  clientSecret: '',
  successRedirectUrl: '',
}

const validationSchema = z.object({
  name: z.string(),
  code: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  successRedirectUrl: zodOptionalUrl,
})

type OpenAddCashfreeDialogData = {
  provider?: AddCashfreeProviderDialogFragment
  deleteCallback?: () => void
}

export const useAddCashfreeDialog = () => {
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddCashfreeDialogData | null>(null)
  const successRef = useRef(false)

  const [addApiKey] = useAddCashfreeApiKeyMutation({
    onCompleted({ addCashfreePaymentProvider }) {
      if (addCashfreePaymentProvider?.id) {
        successRef.current = true
        navigate(
          generatePath(CASHFREE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addCashfreePaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )

        addToast({
          message: translate('text_17276219350329d36mgsotee'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateCashfreeApiKeyMutation({
    onCompleted({ updateCashfreePaymentProvider }) {
      if (updateCashfreePaymentProvider?.id) {
        successRef.current = true
        navigate(
          generatePath(CASHFREE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: updateCashfreePaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )

        addToast({
          message: translate('text_1727621947600tg14usmdbb0'),
          severity: 'success',
        })
      }
    },
  })

  const [getCashfreeProviderByCode] = useGetProviderByCodeForCashfreeLazyQuery()

  const [deleteCashfree] = useDeleteCashfreeMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const cashfreeProvider = dataRef.current?.provider
      const isEdition = !!cashfreeProvider

      const res = await getCashfreeProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: value.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== cashfreeProvider?.id)

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

      const { clientId, clientSecret, successRedirectUrl, name, code } = value

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              id: cashfreeProvider?.id || '',
              name,
              code,
              successRedirectUrl: successRedirectUrl || undefined,
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: {
              name,
              code,
              clientId,
              clientSecret,
              successRedirectUrl: successRedirectUrl || undefined,
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

  const openAddCashfreeDialog = (data?: OpenAddCashfreeDialogData) => {
    dataRef.current = data ?? null
    const cashfreeProvider = data?.provider
    const isEdition = !!cashfreeProvider

    form.reset()
    if (cashfreeProvider) {
      form.setFieldValue('name', cashfreeProvider.name || '')
      form.setFieldValue('code', cashfreeProvider.code || '')
      form.setFieldValue('clientId', cashfreeProvider.clientId || '')
      form.setFieldValue('clientSecret', cashfreeProvider.clientSecret || '')
      form.setFieldValue('successRedirectUrl', cashfreeProvider.successRedirectUrl || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_658461066530343fe1808cd9' : 'text_172450747075633492aqpbm2',
          {
            name: cashfreeProvider?.name,
          },
        ),
        description: translate(
          isEdition ? 'text_1724507963056bu20ky8z98g' : 'text_17245079170372xxmw737fhf',
        ),
        children: (
          <div className="flex flex-col gap-6 p-6">
            <NameAndCodeGroup
              form={form}
              fields={{ name: 'name', code: 'code' }}
              disableAutoGenerateCode={isEdition}
              nameProps={{
                label: translate('text_6584550dc4cec7adf861504d'),
                placeholder: translate('text_6584550dc4cec7adf861504f'),
              }}
              codeProps={{
                label: translate('text_6584550dc4cec7adf8615051'),
                placeholder: translate('text_6584550dc4cec7adf8615053'),
              }}
            />
            <form.AppField name="clientId">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_1727620558031ftsky1vpr55')}
                  placeholder={translate('text_1727624537843s2ublm4rsyj')}
                />
              )}
            </form.AppField>
            <form.AppField name="clientSecret">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_1727620574228qfyoqtsdih7')}
                  placeholder={translate('text_17276245391922l9540z7f78')}
                />
              )}
            </form.AppField>
            <form.AppField name="successRedirectUrl">
              {(field) => (
                <field.TextInputField
                  label={translate('text_65367cb78324b77fcb6af21c')}
                  placeholder={translate('text_1733303818769298k0fvsgcz')}
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
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_172450747075633492aqpbm2',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_CASHFREE_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_658461066530343fe1808cd7', { name: cashfreeProvider?.name }),
          description: translate('text_1727621816788cygs13tsdyv'),
          actionText: translate('text_659d5de7c9b7f51394f7f3fd'),
          colorVariant: 'danger',
          onAction: async () => {
            const res = await deleteCashfree({
              variables: { input: { id: cashfreeProvider?.id as string } },
            })

            const destroyedId = res.data?.destroyPaymentProvider?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'CashfreeProvider',
                listFieldName: 'paymentProviders',
                listQueryDocument: GetCashfreeIntegrationsListDocument,
              })

              dataRef.current?.deleteCallback?.()

              addToast({
                message: translate('text_1727621949511zk6kkl99pzk'),
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

  return { openAddCashfreeDialog }
}
