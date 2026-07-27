import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import {
  CHECKOUT_URL_TEXT_TEST_ID,
  GENERATE_CHECKOUT_URL_BUTTON_TEST_ID,
} from '~/components/customers/paymentMethodsDataTestConstants'
import { LinkedPaymentProvider } from '~/components/customers/types'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  ADD_PAYMENT_METHOD_PROVIDER_INPUT_CLASSNAME,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGenerateCheckoutUrlMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

const ADD_PAYMENT_METHOD_FORM_ID = 'add-payment-method-form'

const addPaymentMethodValidationSchema = z.object({
  paymentProvider: z.string().min(1),
})

gql`
  mutation generateCheckoutUrl($input: GenerateCheckoutUrlInput!) {
    generateCheckoutUrl(input: $input) {
      checkoutUrl
    }
  }
`

type AddPaymentMethodDialogData = {
  customerId: string
  linkedPaymentProvider: LinkedPaymentProvider
}

export const useAddPaymentMethodDialog = () => {
  const formDialog = useFormDialog()
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<AddPaymentMethodDialogData | null>(null)
  const checkoutUrlRef = useRef<string>('')

  const [generateCheckoutUrl] = useGenerateCheckoutUrlMutation()

  const form = useAppForm({
    defaultValues: {
      paymentProvider: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: addPaymentMethodValidationSchema,
    },
    onSubmit: async () => {
      const customerId = dataRef.current?.customerId

      if (!customerId) return

      const result = await generateCheckoutUrl({
        variables: { input: { customerId } },
      })

      const url = result.data?.generateCheckoutUrl?.checkoutUrl

      if (url) {
        checkoutUrlRef.current = url
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    checkoutUrlRef.current = ''
    await form.handleSubmit()

    if (!checkoutUrlRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success', params: { checkoutUrl: checkoutUrlRef.current } }
  }

  const onError = () => {
    addToast({
      severity: 'danger',
      translateKey: 'text_1762182354095wfjiizpju0e',
    })
  }

  const openCheckoutUrlDialog = (checkoutUrl: string) => {
    centralizedDialog.open({
      title: translate('text_1762184099398x60go694x4g'),
      children: (
        <div className="p-8">
          <Typography
            className="line-break-anywhere"
            variant="body"
            color="grey700"
            data-test={CHECKOUT_URL_TEXT_TEST_ID}
          >
            {checkoutUrl}
          </Typography>
        </div>
      ),
      actionText: translate('text_17460208605597iyd249v26z'),
      onAction: () => {
        copyToClipboard(checkoutUrl)
        addToast({
          severity: 'info',
          translateKey: 'text_1762185015908yvajftyvcnq',
        })
      },
    })
  }

  const openAddPaymentMethodDialog = (data: AddPaymentMethodDialogData) => {
    dataRef.current = data
    form.reset()

    if (data.linkedPaymentProvider) {
      form.setFieldValue('paymentProvider', data.linkedPaymentProvider.code)
    }

    const providerOptions = data.linkedPaymentProvider
      ? [
          {
            value: data.linkedPaymentProvider.code,
            label: data.linkedPaymentProvider.name,
          },
        ]
      : []
    const hasProviderOption = providerOptions.length > 0

    formDialog
      .open({
        title: translate('text_1761914802986ww4ima0w9w9'),
        description: translate('text_1761914802986ipq0aot8fas'),
        closeOnError: false,
        onError,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${ADD_PAYMENT_METHOD_PROVIDER_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: (
          <div className="p-8">
            <form.AppField name="paymentProvider">
              {(field) => (
                <field.ComboBoxField
                  className={ADD_PAYMENT_METHOD_PROVIDER_INPUT_CLASSNAME}
                  disabled={hasProviderOption}
                  disableClearable={hasProviderOption}
                  data={providerOptions}
                  label={translate('text_634ea0ecc6147de10ddb6631')}
                  placeholder={translate('text_1762173848714al2j36a59ce')}
                  emptyText={translate('text_1762173891817jhfenej7eho')}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.Subscribe
            selector={(state) => ({
              hasProvider: !!state.values.paymentProvider,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ hasProvider, isSubmitting }) => (
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!hasProvider}
                data-test={GENERATE_CHECKOUT_URL_BUTTON_TEST_ID}
              >
                {translate('text_1761914802986cu9mjc19csx')}
              </Button>
            )}
          </form.Subscribe>
        ),
        form: {
          id: ADD_PAYMENT_METHOD_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'success') {
          const { checkoutUrl } = (response.params ?? {}) as { checkoutUrl: string }

          openCheckoutUrlDialog(checkoutUrl)
        }

        form.reset()
        dataRef.current = null
        checkoutUrlRef.current = ''
      })
  }

  return { openAddPaymentMethodDialog }
}
