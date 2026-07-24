import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { PaymentMethodComboBox } from '~/components/paymentMethodSelection/PaymentMethodComboBox'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  RESEND_INVOICE_PAYMENT_METHOD_INPUT_CLASSNAME,
} from '~/core/constants/form'
import {
  InvoiceForResendInvoiceForCollectionDialogFragment,
  LagoApiError,
  PaymentMethodTypeEnum,
  useRetryInvoicePaymentMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const RESEND_INVOICE_FOR_COLLECTION_DIALOG_CANCEL_BUTTON_TEST_ID =
  'resend-invoice-for-collection-dialog-cancel-button'
export const RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID =
  'resend-invoice-for-collection-dialog-submit-button'
export const RESEND_INVOICE_FOR_COLLECTION_FORM_ID = 'resend-invoice-for-collection-form'

gql`
  fragment InvoiceForResendInvoiceForCollectionDialog on Invoice {
    id
    number
    customer {
      id
      externalId
    }
  }
`

type ResendInvoiceForCollectionDialogData = {
  invoice?: InvoiceForResendInvoiceForCollectionDialogFragment | null
  preselectedPaymentMethodId?: string | null
}

const resendInvoiceForCollectionValidationSchema = z.object({
  paymentMethodId: z.string().min(1),
})

export const useResendInvoiceForCollectionDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const invoiceRef = useRef<InvoiceForResendInvoiceForCollectionDialogFragment | null | undefined>(
    null,
  )
  const paymentMethodTypeRef = useRef<PaymentMethodTypeEnum | undefined>(undefined)
  const successRef = useRef(false)

  const [retryInvoicePayment] = useRetryInvoicePaymentMutation({
    context: { silentErrorCodes: [LagoApiError.PaymentProcessorIsCurrentlyHandlingPayment] },
    onCompleted({ retryInvoicePayment: data }) {
      if (data?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_63ac86d897f728a87b2fa0b3',
        })
      }
    },
  })

  const form = useAppForm({
    defaultValues: {
      paymentMethodId: '',
    },
    validationLogic: revalidateLogic({ mode: 'change' }),
    validators: {
      onDynamic: resendInvoiceForCollectionValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const invoice = invoiceRef.current

      const { errors } = await retryInvoicePayment({
        variables: {
          input: {
            id: invoice?.id as string,
            paymentMethod: {
              paymentMethodId: value.paymentMethodId,
              paymentMethodType: paymentMethodTypeRef.current,
            },
          },
        },
      })

      if (hasDefinedGQLError('PaymentProcessorIsCurrentlyHandlingPayment', errors)) {
        addToast({
          severity: 'info',
          translateKey: 'text_63b6d06df1a53b7e2ad973ad',
        })

        return
      }

      if (!errors) {
        successRef.current = true
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

  const resetState = (): void => {
    form.reset()
    invoiceRef.current = null
    paymentMethodTypeRef.current = undefined
  }

  const openResendInvoiceForCollectionDialog = (
    data: ResendInvoiceForCollectionDialogData,
  ): void => {
    invoiceRef.current = data.invoice
    paymentMethodTypeRef.current = undefined

    form.reset()
    if (data.preselectedPaymentMethodId) {
      form.setFieldValue('paymentMethodId', data.preselectedPaymentMethodId)
    }

    formDialog
      .open({
        title: translate('text_17683906296679tuqxj77ou9'),
        description: translate('text_1768390629667tvmfcdlro8l', {
          invoiceNumber: data.invoice?.number,
        }),
        children: (
          <form.Subscribe selector={(state) => state.values.paymentMethodId}>
            {(paymentMethodId) => (
              <div className="p-8">
                <Typography variant="captionHl" color="textSecondary" className="mb-1">
                  {translate('text_17440371192353kif37ol194')}
                </Typography>
                <PaymentMethodComboBox
                  className={RESEND_INVOICE_PAYMENT_METHOD_INPUT_CLASSNAME}
                  externalCustomerId={data.invoice?.customer?.externalId}
                  selectedPaymentMethod={
                    paymentMethodId
                      ? {
                          paymentMethodId,
                          paymentMethodType: paymentMethodTypeRef.current,
                        }
                      : null
                  }
                  setSelectedPaymentMethod={(selected: SelectedPaymentMethod) => {
                    paymentMethodTypeRef.current = selected?.paymentMethodType ?? undefined
                    form.setFieldValue('paymentMethodId', selected?.paymentMethodId ?? '')
                  }}
                  PopperProps={{ displayInDialog: true }}
                />
              </div>
            )}
          </form.Subscribe>
        ),
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${RESEND_INVOICE_PAYMENT_METHOD_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        mainAction: (
          <form.AppForm>
            <form.Subscribe selector={(state) => !state.values.paymentMethodId}>
              {(isPaymentMethodEmpty) => (
                <form.SubmitButton
                  disabled={isPaymentMethodEmpty}
                  dataTest={RESEND_INVOICE_FOR_COLLECTION_DIALOG_SUBMIT_BUTTON_TEST_ID}
                >
                  {translate('text_63ac86d897f728a87b2fa039')}
                </form.SubmitButton>
              )}
            </form.Subscribe>
          </form.AppForm>
        ),
        form: {
          id: RESEND_INVOICE_FOR_COLLECTION_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          resetState()
        }
      })
  }

  return { openResendInvoiceForCollectionDialog }
}
