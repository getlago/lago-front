import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { useUpdateCustomerInvoiceGracePeriodMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const EDIT_CUSTOMER_INVOICE_GRACE_PERIOD_FORM_ID = 'edit-customer-invoice-grace-period-form'

gql`
  fragment EditCustomerInvoiceGracePeriod on Customer {
    id
    invoiceGracePeriod
  }

  mutation updateCustomerInvoiceGracePeriod($input: UpdateCustomerInvoiceGracePeriodInput!) {
    updateCustomerInvoiceGracePeriod(input: $input) {
      id
      ...EditCustomerInvoiceGracePeriod
    }
  }
`

const editCustomerInvoiceGracePeriodValidationSchema = z.object({
  // An empty input is allowed and submits as 0 (see onSubmit).
  invoiceGracePeriod: z.union([
    z.number().max(365, { message: 'text_63bed78ae69de9cad5c348e4' }),
    z.literal(''),
  ]),
})

type EditCustomerInvoiceGracePeriodDialogData = {
  customerId: string
  invoiceGracePeriod: number | undefined | null
}

export const useEditCustomerInvoiceGracePeriodDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<EditCustomerInvoiceGracePeriodDialogData | null>(null)
  const successRef = useRef(false)

  const [updateCustomerInvoiceGracePeriod] = useUpdateCustomerInvoiceGracePeriodMutation({
    onCompleted(res) {
      if (res?.updateCustomerInvoiceGracePeriod) {
        addToast({
          severity: 'success',
          translateKey: 'text_638dff9779fb99299bee914a',
        })
      }
    },
  })

  const form = useAppForm({
    defaultValues: {
      invoiceGracePeriod: '' as number | '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editCustomerInvoiceGracePeriodValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateCustomerInvoiceGracePeriod({
        variables: {
          input: {
            id: dataRef.current?.customerId || '',
            invoiceGracePeriod: Number(value.invoiceGracePeriod) || 0,
          },
        },
      })

      if (result.data?.updateCustomerInvoiceGracePeriod) {
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

  const openEditCustomerInvoiceGracePeriodDialog = (
    data: EditCustomerInvoiceGracePeriodDialogData,
  ) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue('invoiceGracePeriod', (data.invoiceGracePeriod ?? '') as number | '')

    formDialog
      .open({
        title: translate('text_638dff9779fb99299bee90b0'),
        description: translate('text_638dff9779fb99299bee90b4'),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <div className="p-8">
            <form.AppField name="invoiceGracePeriod">
              {(field) => (
                <field.TextInputField
                  beforeChangeFormatter={['positiveNumber', 'int']}
                  label={translate('text_638dff9779fb99299bee90bc')}
                  placeholder={translate('text_638dff9779fb99299bee90c0')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {translate('text_638dff9779fb99299bee90c4')}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_638dff9779fb99299bee90cc')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_CUSTOMER_INVOICE_GRACE_PERIOD_FORM_ID,
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

  return { openEditCustomerInvoiceGracePeriodDialog }
}
