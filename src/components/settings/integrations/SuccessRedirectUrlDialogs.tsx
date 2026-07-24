import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { ADYEN_SUCCESS_LINK_SPEC_URL } from '~/core/constants/externalUrls'
import {
  AdyenForCreateAndEditSuccessRedirectUrlFragment,
  CashfreeForCreateAndEditSuccessRedirectUrlFragment,
  FlutterwaveForCreateAndEditSuccessRedirectUrlFragment,
  GocardlessForCreateAndEditSuccessRedirectUrlFragment,
  MoneyhashForCreateAndEditSuccessRedirectUrlFragment,
  StripeForCreateAndEditSuccessRedirectUrlFragment,
  useUpdateAdyenPaymentProviderMutation,
  useUpdateCashfreePaymentProviderMutation,
  useUpdateFlutterwavePaymentProviderSuccessRedirectUrlMutation,
  useUpdateGocardlessPaymentProviderMutation,
  useUpdateMoneyhashPaymentProviderMutation,
  useUpdateStripePaymentProviderMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment AdyenForCreateAndEditSuccessRedirectUrl on AdyenProvider {
    id
    successRedirectUrl
  }

  fragment CashfreeForCreateAndEditSuccessRedirectUrl on CashfreeProvider {
    id
    successRedirectUrl
  }

  fragment FlutterwaveForCreateAndEditSuccessRedirectUrl on FlutterwaveProvider {
    id
    successRedirectUrl
  }

  fragment gocardlessForCreateAndEditSuccessRedirectUrl on GocardlessProvider {
    id
    successRedirectUrl
  }

  fragment StripeForCreateAndEditSuccessRedirectUrl on StripeProvider {
    id
    successRedirectUrl
  }

  fragment MoneyhashForCreateAndEditSuccessRedirectUrl on MoneyhashProvider {
    id
    flowId
    successRedirectUrl
  }

  mutation updateAdyenPaymentProvider($input: UpdateAdyenPaymentProviderInput!) {
    updateAdyenPaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateCashfreePaymentProvider($input: UpdateCashfreePaymentProviderInput!) {
    updateCashfreePaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateFlutterwavePaymentProviderSuccessRedirectUrl(
    $input: UpdateFlutterwavePaymentProviderInput!
  ) {
    updateFlutterwavePaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateGocardlessPaymentProvider($input: UpdateGocardlessPaymentProviderInput!) {
    updateGocardlessPaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateStripePaymentProvider($input: UpdateStripePaymentProviderInput!) {
    updateStripePaymentProvider(input: $input) {
      id
      successRedirectUrl
    }
  }

  mutation updateMoneyhashPaymentProvider($input: UpdateMoneyhashPaymentProviderInput!) {
    updateMoneyhashPaymentProvider(input: $input) {
      id
      flowId
    }
  }
`

const SUCCESS_REDIRECT_URL_FORM_ID = 'success-redirect-url-form'

export const SuccessRedirectUrlProviderType = {
  Adyen: 'Adyen',
  Stripe: 'Stripe',
  GoCardless: 'GoCardless',
  Cashfree: 'Cashfree',
  Flutterwave: 'Flutterwave',
  Moneyhash: 'Moneyhash',
} as const

export type SuccessRedirectUrlProviderTypeKey = keyof typeof SuccessRedirectUrlProviderType

type SuccessRedirectUrlProviderFragment =
  | AdyenForCreateAndEditSuccessRedirectUrlFragment
  | CashfreeForCreateAndEditSuccessRedirectUrlFragment
  | FlutterwaveForCreateAndEditSuccessRedirectUrlFragment
  | GocardlessForCreateAndEditSuccessRedirectUrlFragment
  | StripeForCreateAndEditSuccessRedirectUrlFragment
  | MoneyhashForCreateAndEditSuccessRedirectUrlFragment

type AddEditSuccessRedirectUrlDialogData = {
  mode: 'Add' | 'Edit'
  type: SuccessRedirectUrlProviderTypeKey
  provider?: SuccessRedirectUrlProviderFragment | null
}

type DeleteSuccessRedirectUrlDialogData = {
  type: SuccessRedirectUrlProviderTypeKey
  provider?: SuccessRedirectUrlProviderFragment | null
}

type MutationResult = {
  errors?: readonly GraphQLFormattedError[] | null
  data?: Record<string, unknown> | null | undefined
}

const useSuccessRedirectUrlMutations = () => {
  const [updateAdyenProvider] = useUpdateAdyenPaymentProviderMutation()
  const [updateCashfreeProvider] = useUpdateCashfreePaymentProviderMutation()
  const [updateFlutterwaveProvider] =
    useUpdateFlutterwavePaymentProviderSuccessRedirectUrlMutation()
  const [updateGocardlessProvider] = useUpdateGocardlessPaymentProviderMutation()
  const [updateStripeProvider] = useUpdateStripePaymentProviderMutation()
  const [updateMoneyhashProvider] = useUpdateMoneyhashPaymentProviderMutation()

  const submit = ({
    type,
    id,
    successRedirectUrl,
  }: {
    type: SuccessRedirectUrlProviderTypeKey
    id: string
    successRedirectUrl: string | null
  }): Promise<MutationResult> => {
    const input = { id, successRedirectUrl }

    switch (type) {
      case SuccessRedirectUrlProviderType.Adyen:
        return updateAdyenProvider({ variables: { input } })
      case SuccessRedirectUrlProviderType.Stripe:
        return updateStripeProvider({ variables: { input } })
      case SuccessRedirectUrlProviderType.GoCardless:
        return updateGocardlessProvider({ variables: { input } })
      case SuccessRedirectUrlProviderType.Cashfree:
        return updateCashfreeProvider({ variables: { input } })
      case SuccessRedirectUrlProviderType.Flutterwave:
        return updateFlutterwaveProvider({ variables: { input } })
      case SuccessRedirectUrlProviderType.Moneyhash:
        return updateMoneyhashProvider({ variables: { input } })
    }
  }

  return { submit }
}

const validationSchema = z.object({
  successRedirectUrl: z.string().min(1),
})

type FormValues = { successRedirectUrl: string }

const initialValues: FormValues = { successRedirectUrl: '' }

export const useAddEditSuccessRedirectUrlDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const { submit } = useSuccessRedirectUrlMutations()
  const dataRef = useRef<AddEditSuccessRedirectUrlDialogData | null>(null)
  const successRef = useRef(false)

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: validationSchema },
    onSubmit: async ({ value, formApi }) => {
      const currentData = dataRef.current

      if (!currentData) return

      const res = await submit({
        type: currentData.type,
        id: currentData.provider?.id ?? '',
        successRedirectUrl: value.successRedirectUrl,
      })

      if (res.errors) {
        if (hasDefinedGQLError('UrlIsInvalid', res.errors ?? undefined)) {
          const message =
            currentData.type === SuccessRedirectUrlProviderType.Adyen
              ? translate('text_65367cb78324b77fcb6af2eb', { href: ADYEN_SUCCESS_LINK_SPEC_URL })
              : translate('text_6538d6f6c43ecb00706e6ab6')

          formApi.setErrorMap({
            onDynamic: {
              fields: {
                successRedirectUrl: {
                  message,
                  path: ['successRedirectUrl'],
                },
              },
            },
          })
        }
        return
      }

      successRef.current = true
      addToast({
        message: translate(
          currentData.mode === 'Add'
            ? 'text_65367cb78324b77fcb6af261'
            : 'text_65367cb78324b77fcb6af28f',
        ),
        severity: 'success',
      })
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

  const openAddEditSuccessRedirectUrlDialog = (data: AddEditSuccessRedirectUrlDialogData) => {
    dataRef.current = data

    form.reset()
    form.setFieldValue('successRedirectUrl', data.provider?.successRedirectUrl ?? '')

    const helperTextKey =
      data.type === SuccessRedirectUrlProviderType.Adyen
        ? 'text_65367cb78324b77fcb6af2e9'
        : 'text_6538d6c00f753e0085cbd4ba'

    formDialog
      .open({
        title: translate(
          data.mode === 'Edit' ? 'text_65367cb78324b77fcb6af216' : 'text_65367cb78324b77fcb6af1b4',
        ),
        description: translate('text_65367cb78324b77fcb6af224', {
          connectionName: data.type,
        }),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="p-8">
            <form.AppField name="successRedirectUrl">
              {(field) => (
                <field.TextInputField
                  label={translate('text_65367cb78324b77fcb6af1c6')}
                  placeholder={translate('text_65367cb78324b77fcb6af1d0')}
                  helperText={
                    <Typography
                      variant="caption"
                      color="grey600"
                      html={translate(helperTextKey, { href: ADYEN_SUCCESS_LINK_SPEC_URL })}
                    />
                  }
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>
              {translate(
                data.mode === 'Edit'
                  ? 'text_65367cb78324b77fcb6af249'
                  : 'text_65367cb78324b77fcb6af1ec',
              )}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: SUCCESS_REDIRECT_URL_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openAddEditSuccessRedirectUrlDialog }
}

export const useDeleteSuccessRedirectUrlDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const { submit } = useSuccessRedirectUrlMutations()

  const openDeleteSuccessRedirectUrlDialog = (data: DeleteSuccessRedirectUrlDialogData) => {
    centralizedDialog.open({
      title: translate('text_65367cb78324b77fcb6af200'),
      description: translate('text_65367cb78324b77fcb6af218', {
        connectionName: data.type,
      }),
      colorVariant: 'danger',
      actionText: translate('text_65367cb78324b77fcb6af255'),
      onAction: async () => {
        const res = await submit({
          type: data.type,
          id: data.provider?.id ?? '',
          successRedirectUrl: null,
        })

        if (!res.errors) {
          addToast({
            message: translate('text_65367cb78324b77fcb6af2c1'),
            severity: 'success',
          })
        }
      },
    })
  }

  return { openDeleteSuccessRedirectUrlDialog }
}
