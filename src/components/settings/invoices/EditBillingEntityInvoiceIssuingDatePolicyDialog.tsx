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
  BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum,
  BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum,
  EditBillingEntityInvoiceIssuingDatePolicyDialogFragment,
  useUpdateBillingEntityInvoiceIssuingDatePolicyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment EditBillingEntityInvoiceIssuingDatePolicyDialog on BillingEntity {
    id
    billingConfiguration {
      invoiceGracePeriod
      subscriptionInvoiceIssuingDateAdjustment
      subscriptionInvoiceIssuingDateAnchor
    }
  }

  mutation updateBillingEntityInvoiceIssuingDatePolicy($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityInvoiceIssuingDatePolicyDialog
    }
  }
`

export const EDIT_BILLING_ENTITY_INVOICE_ISSUING_DATE_POLICY_FORM_ID =
  'edit-billing-entity-invoice-issuing-date-policy-form'

const validationSchema = z.object({
  subscriptionInvoiceIssuingDateAnchor: z.string(),
  subscriptionInvoiceIssuingDateAdjustment: z.string(),
})

type EditBillingEntityInvoiceIssuingDatePolicyDialogData = {
  billingEntity: EditBillingEntityInvoiceIssuingDatePolicyDialogFragment
}

export const useEditBillingEntityInvoiceIssuingDatePolicyDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<EditBillingEntityInvoiceIssuingDatePolicyDialogData | null>(null)
  const successRef = useRef(false)

  const [updateBillingEntityInvoiceIssuingDatePolicy] =
    useUpdateBillingEntityInvoiceIssuingDatePolicyMutation({
      onCompleted(res) {
        if (!res?.updateBillingEntity) return

        successRef.current = true
        addToast({
          severity: 'success',
          translateKey: 'text_1763407386500wkf13gr42tj',
        })
      },
      refetchQueries: ['getBillingEntitySettings'],
    })

  const form = useAppForm({
    defaultValues: EDIT_INVOICE_ISSUING_DATE_POLICY_FORM_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const billingEntity = dataRef.current?.billingEntity

      if (!billingEntity) return

      await updateBillingEntityInvoiceIssuingDatePolicy({
        variables: {
          input: {
            id: billingEntity.id,
            billingConfiguration: {
              subscriptionInvoiceIssuingDateAdjustment:
                (value.subscriptionInvoiceIssuingDateAdjustment as
                  BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum | '') ||
                BillingEntitySubscriptionInvoiceIssuingDateAdjustmentEnum.AlignWithFinalizationDate,
              subscriptionInvoiceIssuingDateAnchor:
                (value.subscriptionInvoiceIssuingDateAnchor as
                  BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum | '') ||
                BillingEntitySubscriptionInvoiceIssuingDateAnchorEnum.NextPeriodStart,
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

  const openEditBillingEntityInvoiceIssuingDatePolicyDialog = (
    data: EditBillingEntityInvoiceIssuingDatePolicyDialogData,
  ) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue(
      'subscriptionInvoiceIssuingDateAnchor',
      data.billingEntity.billingConfiguration?.subscriptionInvoiceIssuingDateAnchor ?? '',
    )
    form.setFieldValue(
      'subscriptionInvoiceIssuingDateAdjustment',
      data.billingEntity.billingConfiguration?.subscriptionInvoiceIssuingDateAdjustment ?? '',
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
            gracePeriod={data.billingEntity.billingConfiguration?.invoiceGracePeriod}
          />
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17634073865002q0veaoj93x')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_BILLING_ENTITY_INVOICE_ISSUING_DATE_POLICY_FORM_ID,
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

  return { openEditBillingEntityInvoiceIssuingDatePolicyDialog }
}
