import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { addToast } from '~/core/apolloClient'
import {
  FINALIZE_ZERO_AMOUNT_INVOICE_INPUT_CLASSNAME,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import {
  EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment,
  EditCustomerFinalizeZeroAmountInvoiceForDialogFragment,
  FinalizeZeroAmountInvoiceEnum,
  useUpdateBillingEntityFinalizeZeroAmountInvoiceMutation,
  useUpdateCustomerFinalizeZeroAmountInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment EditCustomerFinalizeZeroAmountInvoiceForDialog on Customer {
    id
    externalId
    name
    finalizeZeroAmountInvoice
  }

  fragment EditBillingEntityFinalizeZeroAmountInvoiceForDialog on BillingEntity {
    id
    finalizeZeroAmountInvoice
  }

  mutation updateCustomerFinalizeZeroAmountInvoice($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...EditCustomerFinalizeZeroAmountInvoiceForDialog
    }
  }

  mutation updateBillingEntityFinalizeZeroAmountInvoice($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityFinalizeZeroAmountInvoiceForDialog
    }
  }
`

export const EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_FORM_ID = 'edit-finalize-zero-amount-invoice-form'

export const EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_SUBMIT_BUTTON_TEST_ID =
  'edit-finalize-zero-amount-invoice-submit-button'

const validationSchema = z.object({
  finalizeZeroAmountInvoice: z.string().min(1),
})

type FormValues = z.infer<typeof validationSchema>

const initialValues: FormValues = {
  finalizeZeroAmountInvoice: '',
}

type EditFinalizeZeroAmountInvoiceDialogData = {
  entity?:
    | EditCustomerFinalizeZeroAmountInvoiceForDialogFragment
    | EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment
    | null
  finalizeZeroAmountInvoice?: FinalizeZeroAmountInvoiceEnum | boolean | null
}

const getInitialValue = (data: EditFinalizeZeroAmountInvoiceDialogData): string => {
  const isCustomer = data.entity?.__typename === 'Customer'

  if (isCustomer) {
    if (data.finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Inherit) return ''

    return (data.finalizeZeroAmountInvoice as FinalizeZeroAmountInvoiceEnum | undefined) ?? ''
  }

  return data.finalizeZeroAmountInvoice?.toString() ?? ''
}

export const useEditFinalizeZeroAmountInvoiceDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const dataRef = useRef<EditFinalizeZeroAmountInvoiceDialogData | null>(null)
  const successRef = useRef(false)

  const [updateCustomerFinalizeZeroAmountInvoice] =
    useUpdateCustomerFinalizeZeroAmountInvoiceMutation({
      onCompleted(res) {
        if (res?.updateCustomer) {
          successRef.current = true
          addToast({
            severity: 'success',
            translateKey: translate('text_1725549671288cyc585wdz35'),
          })
        }
      },
    })

  const [updateBillingEntityFinalizeZeroAmountInvoice] =
    useUpdateBillingEntityFinalizeZeroAmountInvoiceMutation({
      onCompleted(res) {
        if (res?.updateBillingEntity) {
          successRef.current = true
          addToast({
            severity: 'success',
            translateKey: translate('text_17255496712882bspi9zp0ii'),
          })
        }
      },
      refetchQueries: ['getBillingEntitySettings'],
    })

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value }) => {
      const data = dataRef.current

      if (!data?.entity || !value.finalizeZeroAmountInvoice) return

      const isCustomer = data.entity.__typename === 'Customer'

      if (isCustomer) {
        const customer = data.entity as EditCustomerFinalizeZeroAmountInvoiceForDialogFragment

        await updateCustomerFinalizeZeroAmountInvoice({
          variables: {
            input: {
              id: customer.id,
              externalId: customer.externalId,
              name: customer.name || '',
              finalizeZeroAmountInvoice:
                value.finalizeZeroAmountInvoice as FinalizeZeroAmountInvoiceEnum,
            },
          },
        })

        return
      }

      const billingEntity =
        data.entity as EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment

      await updateBillingEntityFinalizeZeroAmountInvoice({
        variables: {
          input: {
            id: billingEntity.id,
            finalizeZeroAmountInvoice: value.finalizeZeroAmountInvoice === 'true',
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

  const openEditFinalizeZeroAmountInvoiceDialog = (
    data: EditFinalizeZeroAmountInvoiceDialogData,
  ) => {
    dataRef.current = data
    form.reset()
    form.setFieldValue('finalizeZeroAmountInvoice', getInitialValue(data))

    const isCustomer = data.entity?.__typename === 'Customer'
    const comboBoxData = isCustomer
      ? [
          { value: 'finalize', label: translate('text_1725549671287ancbf00edxx') },
          { value: 'skip', label: translate('text_1725549671288zkq9sr0y46l') },
        ]
      : [
          { value: 'true', label: translate('text_1725549671287ancbf00edxx') },
          { value: 'false', label: translate('text_1725549671288zkq9sr0y46l') },
        ]

    formDialog
      .open({
        title: translate('text_17255383402002zmj6x02fx8'),
        description: translate('text_1725538340200495slgen6ji'),
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${FINALIZE_ZERO_AMOUNT_INVOICE_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: (
          <div className="p-8">
            <form.AppField name="finalizeZeroAmountInvoice">
              {(field) => (
                <field.ComboBoxField
                  className={FINALIZE_ZERO_AMOUNT_INVOICE_INPUT_CLASSNAME}
                  disableClearable
                  placeholder={translate('text_1725550661207stz6kovtzkp')}
                  label={translate('text_1725549671288gcrvgdn7rml')}
                  data={comboBoxData}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest={EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_SUBMIT_BUTTON_TEST_ID}>
              {translate('text_17432414198706rdwf76ek3u')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_FORM_ID,
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

  return { openEditFinalizeZeroAmountInvoiceDialog }
}
