import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import {
  EDIT_INVOICE_ISSUING_DATE_POLICY_FORM_DEFAULT_VALUES,
  EditInvoiceIssuingDatePolicyFormContent,
} from '~/components/invoiceIssuingDatePolicy/EditInvoiceIssuingDatePolicyFormContent'
import { addToast } from '~/core/apolloClient'
import {
  CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum,
  CustomerSubscriptionInvoiceIssuingDateAnchorEnum,
  EditCustomerIssuingDatePolicyDialogFragment,
  useUpdateCustomerIssuingDatePolicyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment EditCustomerIssuingDatePolicyDialog on Customer {
    id
    invoiceGracePeriod
    externalId
    billingConfiguration {
      subscriptionInvoiceIssuingDateAdjustment
      subscriptionInvoiceIssuingDateAnchor
    }
  }

  mutation updateCustomerIssuingDatePolicy($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...EditCustomerIssuingDatePolicyDialog
    }
  }
`

export const EDIT_CUSTOMER_ISSUING_DATE_POLICY_FORM_ID = 'edit-customer-issuing-date-policy-form'

const validationSchema = z.object({
  subscriptionInvoiceIssuingDateAnchor: z.string(),
  subscriptionInvoiceIssuingDateAdjustment: z.string(),
})

type EditCustomerIssuingDatePolicyDialogData = {
  customer: EditCustomerIssuingDatePolicyDialogFragment
}

export const useEditCustomerIssuingDatePolicyDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<EditCustomerIssuingDatePolicyDialogData | null>(null)
  const successRef = useRef(false)

  const [updateCustomerIssuingDatePolicy] = useUpdateCustomerIssuingDatePolicyMutation({
    onCompleted(res) {
      if (!res?.updateCustomer) return

      successRef.current = true
      const isDeleting =
        !res.updateCustomer.billingConfiguration?.subscriptionInvoiceIssuingDateAdjustment &&
        !res.updateCustomer.billingConfiguration?.subscriptionInvoiceIssuingDateAnchor
      const translateKey = isDeleting
        ? 'text_1763407386499oel0dxfrp8i'
        : 'text_1763407386500wkf13gr42tj'

      addToast({
        severity: 'success',
        translateKey,
      })
    },
    refetchQueries: ['getCustomerSettings'],
  })

  const form = useAppForm({
    defaultValues: EDIT_INVOICE_ISSUING_DATE_POLICY_FORM_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const customer = dataRef.current?.customer

      if (!customer) return

      await updateCustomerIssuingDatePolicy({
        variables: {
          input: {
            id: customer.id,
            externalId: customer.externalId,
            billingConfiguration: {
              subscriptionInvoiceIssuingDateAdjustment:
                (value.subscriptionInvoiceIssuingDateAdjustment as
                  CustomerSubscriptionInvoiceIssuingDateAdjustmentEnum | '') || null,
              subscriptionInvoiceIssuingDateAnchor:
                (value.subscriptionInvoiceIssuingDateAnchor as
                  CustomerSubscriptionInvoiceIssuingDateAnchorEnum | '') || null,
            },
          },
        },
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

  const openEditCustomerIssuingDatePolicyDialog = (
    data: EditCustomerIssuingDatePolicyDialogData,
  ) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue(
      'subscriptionInvoiceIssuingDateAnchor',
      data.customer.billingConfiguration?.subscriptionInvoiceIssuingDateAnchor ?? '',
    )
    form.setFieldValue(
      'subscriptionInvoiceIssuingDateAdjustment',
      data.customer.billingConfiguration?.subscriptionInvoiceIssuingDateAdjustment ?? '',
    )

    formDialog
      .open({
        title: translate('text_1763407386500gd23ly5ygu8'),
        description: translate('text_1763407386500yt8w46cn30c'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <EditInvoiceIssuingDatePolicyFormContent
            form={form}
            gracePeriod={data.customer.invoiceGracePeriod}
          />
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17634073865002q0veaoj93x')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_CUSTOMER_ISSUING_DATE_POLICY_FORM_ID,
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

  return { openEditCustomerIssuingDatePolicyDialog }
}
