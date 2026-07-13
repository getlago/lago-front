import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { useUpdateBillingEntityInvoiceTemplateMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

const MAX_CHAR_LIMIT = 600

gql`
  fragment EditBillingEntityInvoiceTemplateDialog on BillingEntity {
    billingConfiguration {
      id
      invoiceFooter
    }
  }

  mutation updateBillingEntityInvoiceTemplate($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityInvoiceTemplateDialog
    }
  }
`

const editBillingEntityInvoiceTemplateValidationSchema = z.object({
  invoiceFooter: z.string().max(MAX_CHAR_LIMIT, { message: 'text_62bb10ad2a10bd182d00203b' }),
})

type EditBillingEntityInvoiceTemplateDialogData = {
  id: string
  invoiceFooter: string
}

const FORM_ID = 'edit-billing-entity-invoice-template-form'

export const useEditBillingEntityInvoiceTemplateDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()

  const dataRef = useRef<EditBillingEntityInvoiceTemplateDialogData | null>(null)
  const successRef = useRef(false)

  const [updateBillingEntityInvoiceTemplate] = useUpdateBillingEntityInvoiceTemplateMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        addToast({
          severity: 'success',
          translateKey: 'text_62bb10ad2a10bd182d002077',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })

  const form = useAppForm({
    defaultValues: {
      invoiceFooter: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editBillingEntityInvoiceTemplateValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateBillingEntityInvoiceTemplate({
        variables: {
          input: {
            id: dataRef.current?.id as string,
            billingConfiguration: {
              invoiceFooter: value.invoiceFooter,
            },
          },
        },
      })

      if (result.data?.updateBillingEntity) {
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

  const openEditBillingEntityInvoiceTemplateDialog = (
    data: EditBillingEntityInvoiceTemplateDialogData,
  ) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue('invoiceFooter', data.invoiceFooter)

    formDialog
      .open({
        title: translate('text_62bb10ad2a10bd182d00201d'),
        children: (
          <div className="p-6">
            <form.AppField name="invoiceFooter">
              {(field) => (
                <field.TextInputField
                  className="whitespace-pre-line"
                  rows="4"
                  multiline
                  label={translate('text_62bb10ad2a10bd182d002023')}
                  placeholder={translate('text_62bb10ad2a10bd182d00202b')}
                  helperText={
                    <div className="flex justify-between">
                      <div className="flex-1">{translate('text_62bc52dd8536260acc9eb762')}</div>
                      <div className="shrink-0">
                        {field.state.value.length}/{MAX_CHAR_LIMIT}
                      </div>
                    </div>
                  }
                />
              )}
            </form.AppField>
          </div>
        ),
        closeOnError: false,
        onEntered: focusFirstInput,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17432414198706rdwf76ek3u')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: FORM_ID,
          submit: handleSubmit,
        },
      })
      .then(() => {
        form.reset()
        dataRef.current = null
      })
  }

  return { openEditBillingEntityInvoiceTemplateDialog }
}
