import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { TextInput } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { getBillingEntityNumberPreview } from '~/core/utils/billingEntityNumberPreview'
import {
  BillingEntityDocumentNumberingEnum,
  useUpdateBillingEntityInvoiceNumberingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

const DynamicPrefixTranslationLookup: Record<BillingEntityDocumentNumberingEnum, string> = {
  [BillingEntityDocumentNumberingEnum.PerCustomer]: 'text_6566f920a1d6c35693d6cce0',
  [BillingEntityDocumentNumberingEnum.PerBillingEntity]: 'YYYYMM',
}

gql`
  fragment EditBillingEntityInvoiceNumberingDialog on BillingEntity {
    id
    documentNumbering
    documentNumberPrefix
  }

  mutation updateBillingEntityInvoiceNumbering($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityInvoiceNumberingDialog
    }
  }
`

const editBillingEntityInvoiceNumberingValidationSchema = z.object({
  documentNumbering: z.enum(BillingEntityDocumentNumberingEnum),
  documentNumberPrefix: z.string().min(1).max(10, { message: 'text_6566f920a1d6c35693d6cd77' }),
})

type EditBillingEntityInvoiceNumberingDialogData = {
  id: string
  documentNumbering?: BillingEntityDocumentNumberingEnum | null
  documentNumberPrefix?: string | null
}

const FORM_ID = 'edit-billing-entity-invoice-numbering-form'

export const useEditBillingEntityInvoiceNumberingDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()

  const dataRef = useRef<EditBillingEntityInvoiceNumberingDialogData | null>(null)
  const successRef = useRef(false)

  const [updateBillingEntityInvoiceNumbering] = useUpdateBillingEntityInvoiceNumberingMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        addToast({
          severity: 'success',
          translateKey: 'text_6566f920a1d6c35693d6ce0f',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })

  const form = useAppForm({
    defaultValues: {
      documentNumbering: BillingEntityDocumentNumberingEnum.PerCustomer,
      documentNumberPrefix: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: editBillingEntityInvoiceNumberingValidationSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateBillingEntityInvoiceNumbering({
        variables: {
          input: {
            id: dataRef.current?.id as string,
            documentNumbering: value.documentNumbering,
            documentNumberPrefix: value.documentNumberPrefix,
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

  const openEditBillingEntityInvoiceNumberingDialog = (
    data: EditBillingEntityInvoiceNumberingDialogData,
  ) => {
    dataRef.current = data
    form.reset()
    if (data.documentNumbering) {
      form.setFieldValue('documentNumbering', data.documentNumbering)
    }
    form.setFieldValue('documentNumberPrefix', data.documentNumberPrefix ?? '')

    formDialog
      .open({
        title: translate('text_6566f920a1d6c35693d6cc8c'),
        description: translate('text_6566f920a1d6c35693d6cc94'),
        children: (
          <div className="mb-8 flex flex-col gap-8 p-6">
            <div className="flex items-center gap-3 rounded-xl border border-grey-300 p-3">
              <Chip label={translate('text_6566f920a1d6c35693d6cc9e')} />
              <form.Subscribe
                selector={(state) => ({
                  documentNumbering: state.values.documentNumbering,
                  documentNumberPrefix: state.values.documentNumberPrefix,
                })}
              >
                {({ documentNumbering, documentNumberPrefix }) => (
                  <Typography variant="body" color="grey700">
                    {getBillingEntityNumberPreview(documentNumbering, documentNumberPrefix || '')}
                  </Typography>
                )}
              </form.Subscribe>
            </div>

            <form.AppField name="documentNumbering">
              {(field) => (
                <field.RadioGroupField
                  label={translate('text_6566f920a1d6c35693d6ccae')}
                  options={[
                    {
                      label: translate('text_6566f920a1d6c35693d6ccb8'),
                      value: BillingEntityDocumentNumberingEnum.PerCustomer,
                    },
                    {
                      label: translate('text_6566f920a1d6c35693d6ccc0'),
                      value: BillingEntityDocumentNumberingEnum.PerBillingEntity,
                    },
                  ]}
                />
              )}
            </form.AppField>

            <div className="grid grid-cols-[1fr_8px_1fr_8px_80px] gap-3">
              <form.AppField name="documentNumberPrefix">
                {(field) => (
                  <field.TextInputField label={translate('text_6566f920a1d6c35693d6ccc8')} />
                )}
              </form.AppField>
              <Typography className="mt-[38px] h-fit" variant="body">
                -
              </Typography>
              <form.Subscribe selector={(state) => state.values.documentNumbering}>
                {(documentNumbering) => (
                  <TextInput
                    disabled
                    label={translate('text_6566f920a1d6c35693d6ccd8')}
                    value={translate(DynamicPrefixTranslationLookup[documentNumbering])}
                  />
                )}
              </form.Subscribe>
              <Typography className="mt-[38px] h-fit" variant="body">
                -
              </Typography>
              <TextInput
                disabled
                label={translate('text_6566f920a1d6c35693d6cce8')}
                value={'001'}
              />
            </div>
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

  return { openEditBillingEntityInvoiceNumberingDialog }
}
