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
import { FLUTTERWAVE_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { zodOptionalUrl } from '~/formValidation/zodCustoms'
import {
  FlutterwaveIntegrationDetailsFragment,
  GetFlutterwaveIntegrationsListDocument,
  LagoApiError,
  useAddFlutterwavePaymentProviderMutation,
  useDeleteFlutterwaveIntegrationMutation,
  useGetProviderByCodeForFlutterwaveLazyQuery,
  useUpdateFlutterwavePaymentProviderMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AddFlutterwaveProviderDialog on FlutterwaveProvider {
    id
    name
    code
    secretKey
    webhookSecret
    successRedirectUrl
  }

  query getProviderByCodeForFlutterwave($code: String) {
    paymentProvider(code: $code) {
      ... on FlutterwaveProvider {
        id
      }
      ... on CashfreeProvider {
        id
      }
      ... on GocardlessProvider {
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

  mutation addFlutterwavePaymentProvider($input: AddFlutterwavePaymentProviderInput!) {
    addFlutterwavePaymentProvider(input: $input) {
      id
      ...AddFlutterwaveProviderDialog
    }
  }

  mutation updateFlutterwavePaymentProvider($input: UpdateFlutterwavePaymentProviderInput!) {
    updateFlutterwavePaymentProvider(input: $input) {
      id
      ...AddFlutterwaveProviderDialog
    }
  }
`

const ADD_FLUTTERWAVE_FORM_ID = 'form-add-flutterwave-integration'

type AddFlutterwaveFormValues = {
  name: string
  code: string
  secretKey: string
  successRedirectUrl: string
}

const defaultFormValues: AddFlutterwaveFormValues = {
  name: '',
  code: '',
  secretKey: '',
  successRedirectUrl: '',
}

const validationSchema = z.object({
  name: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  code: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  secretKey: z.string().min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
  successRedirectUrl: zodOptionalUrl,
})

type OpenAddFlutterwaveDialogData = {
  provider?: FlutterwaveIntegrationDetailsFragment
  deleteCallback?: () => void
}

export const useAddFlutterwaveDialog = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const formDialogOpeningDialog = useFormDialogOpeningDialog()
  const client = useApolloClient()

  const dataRef = useRef<OpenAddFlutterwaveDialogData | null>(null)
  const successRef = useRef(false)

  const [addFlutterwaveProvider] = useAddFlutterwavePaymentProviderMutation({
    onCompleted(data) {
      if (data?.addFlutterwavePaymentProvider) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_1749803444837pl1ketrhm8a',
        })
        navigate(
          generatePath(FLUTTERWAVE_INTEGRATION_DETAILS_ROUTE, {
            integrationId: data.addFlutterwavePaymentProvider.id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )
      }
    },
  })

  const [updateFlutterwaveProvider] = useUpdateFlutterwavePaymentProviderMutation({
    onCompleted(data) {
      if (data?.updateFlutterwavePaymentProvider) {
        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_174980344483769h5q79g4ap',
        })
      }
    },
    onError() {
      addToast({
        severity: 'danger',
        translateKey: 'text_629728388c4d2300e2d380d5',
      })
    },
  })

  const [getProviderByCode] = useGetProviderByCodeForFlutterwaveLazyQuery()

  const [deleteFlutterwave] = useDeleteFlutterwaveIntegrationMutation()

  const form = useAppForm({
    defaultValues: defaultFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const flutterwaveProvider = dataRef.current?.provider
      const isEdition = !!flutterwaveProvider
      const { name, code, secretKey, successRedirectUrl } = value

      const res = await getProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== flutterwaveProvider?.id)

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
        await updateFlutterwaveProvider({
          variables: {
            input: {
              id: flutterwaveProvider?.id || '',
              name,
              code,
              successRedirectUrl: successRedirectUrl || undefined,
            },
          },
        })
      } else {
        await addFlutterwaveProvider({
          variables: {
            input: {
              name,
              code,
              secretKey,
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

  const openAddFlutterwaveDialog = (data?: OpenAddFlutterwaveDialogData) => {
    dataRef.current = data ?? null
    const flutterwaveProvider = data?.provider
    const isEdition = !!flutterwaveProvider

    form.reset()
    if (flutterwaveProvider) {
      form.setFieldValue('name', flutterwaveProvider.name || '')
      form.setFieldValue('code', flutterwaveProvider.code || '')
      form.setFieldValue('secretKey', flutterwaveProvider.secretKey || '')
      form.setFieldValue('successRedirectUrl', flutterwaveProvider.successRedirectUrl || '')
    }

    formDialogOpeningDialog
      .open({
        title: translate(
          isEdition ? 'text_1749725331374i3p14ewcpn5' : 'text_1749725331374clf07sez01f',
        ),
        description: translate('text_174972533137460li1pvmw34'),
        children: (
          <div className="flex flex-col gap-6 p-8">
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
            <form.AppField name="secretKey">
              {(field) => (
                <field.TextInputField
                  disabled={isEdition}
                  label={translate('text_17497252876688ai900wowoc')}
                  placeholder={translate('text_1749725331374uzvwfxs7m82')}
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
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_1749725331374clf07sez01f',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: ADD_FLUTTERWAVE_FORM_ID,
          submit: handleSubmit,
        },
        canOpenDialog: isEdition,
        openDialogText: translate('text_65845f35d7d69c3ab4793dad'),
        otherDialogProps: {
          title: translate('text_1749799070145vfvz9sq757a', { name: flutterwaveProvider?.name }),
          description: translate('text_1749799070145zdncdpo3g37'),
          actionText: translate('text_1749799070145czycjo9guoq'),
          colorVariant: 'danger',
          onAction: async () => {
            const result = await deleteFlutterwave({
              variables: { input: { id: flutterwaveProvider?.id as string } },
            })

            const destroyedId = result.data?.destroyPaymentProvider?.id

            if (destroyedId) {
              evictFromCache(client, {
                id: destroyedId,
                __typename: 'FlutterwaveProvider',
                listFieldName: 'paymentProviders',
                listQueryDocument: GetFlutterwaveIntegrationsListDocument,
              })

              data?.deleteCallback?.()

              addToast({
                message: translate('text_1749799070145axw96s27789'),
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

  return { openAddFlutterwaveDialog }
}
