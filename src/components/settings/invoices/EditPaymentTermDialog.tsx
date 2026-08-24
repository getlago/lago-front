import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import {
  PAYMENT_TERM_FORM_DEFAULT_VALUES,
  paymentTermFormSchema,
  PaymentTermFormContent,
  PaymentTermFormValues,
} from '~/components/paymentTerms/PaymentTermFormContent'
import { addToast } from '~/core/apolloClient'
import { MUI_INPUT_BASE_ROOT_CLASSNAME, PAYMENT_TERM_INPUT_CLASSNAME } from '~/core/constants/form'
import { PAYMENT_TERM_DEFAULT_MONTH_OFFSET } from '~/core/constants/paymentTerm'
import { buildPaymentTermInput } from '~/core/utils/paymentTerm'
import {
  EditBillingEntityPaymentTermForDialogFragment,
  EditCustomerPaymentTermForDialogFragment,
  useUpdateBillingEntityPaymentTermMutation,
  useUpdateCustomerPaymentTermMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const EDIT_PAYMENT_TERM_FORM_ID = 'edit-payment-term-form'

gql`
  fragment EditCustomerPaymentTermForDialog on Customer {
    id
    externalId
    name
    paymentTerm {
      termType
      days
      dayOfMonth
      monthOffset
    }
  }

  fragment EditBillingEntityPaymentTermForDialog on BillingEntity {
    id
    paymentTerm {
      termType
      days
      dayOfMonth
      monthOffset
    }
  }

  mutation updateCustomerPaymentTerm($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...EditCustomerPaymentTermForDialog
    }
  }

  mutation updateBillingEntityPaymentTerm($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      ...EditBillingEntityPaymentTermForDialog
    }
  }
`

enum PaymentTermModelTypesEnum {
  Customer = 'Customer',
  BillingEntity = 'BillingEntity',
}

type ModelData =
  EditCustomerPaymentTermForDialogFragment | EditBillingEntityPaymentTermForDialogFragment

const getInitialFormValues = (model: ModelData | null): PaymentTermFormValues => {
  const paymentTerm = model?.paymentTerm

  if (!paymentTerm) return PAYMENT_TERM_FORM_DEFAULT_VALUES

  return {
    termType: paymentTerm.termType,
    days: paymentTerm.days ?? PAYMENT_TERM_FORM_DEFAULT_VALUES.days,
    dayOfMonth: paymentTerm.dayOfMonth ?? PAYMENT_TERM_FORM_DEFAULT_VALUES.dayOfMonth,
    monthOffset: paymentTerm.monthOffset ?? PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  }
}

type EditPaymentTermDialogData = {
  model: ModelData | null | undefined
}

export const useEditPaymentTermDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const modelRef = useRef<ModelData | null>(null)
  const isEditRef = useRef(false)
  const successRef = useRef(false)

  const onCompletedToast = () => {
    successRef.current = true
    addToast({
      severity: 'success',
      translateKey: isEditRef.current
        ? 'text_1787603382163qy0ie341vhf'
        : 'text_17876033821633lw8i7rs3et',
    })
  }

  const [updateBillingEntity] = useUpdateBillingEntityPaymentTermMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) onCompletedToast()
    },
    refetchQueries: ['getBillingEntitySettings'],
  })
  const [updateCustomer] = useUpdateCustomerPaymentTermMutation({
    onCompleted(res) {
      if (res?.updateCustomer) onCompletedToast()
    },
  })

  const form = useAppForm({
    defaultValues: PAYMENT_TERM_FORM_DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: paymentTermFormSchema },
    onSubmit: async ({ value }) => {
      const model = modelRef.current

      if (!model || !value.termType) return

      // Only the chosen type's own fields are sent — the API rejects the others. Never
      // send `netPaymentTerm` alongside: the API mirrors the legacy alias itself.
      const paymentTerm = buildPaymentTermInput({
        termType: value.termType,
        days: value.days === '' ? 0 : Number(value.days),
        dayOfMonth: value.dayOfMonth === '' ? null : Number(value.dayOfMonth),
        monthOffset: value.monthOffset === '' ? null : Number(value.monthOffset),
      })

      if (model.__typename === PaymentTermModelTypesEnum.Customer) {
        await updateCustomer({
          variables: {
            input: {
              id: model.id,
              // UpdateCustomerInput requires both, even when only the term changes.
              externalId: model.externalId,
              name: model.name || '',
              paymentTerm,
            },
          },
        })
      } else if (model.__typename === PaymentTermModelTypesEnum.BillingEntity) {
        await updateBillingEntity({ variables: { input: { id: model.id, paymentTerm } } })
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

  const openEditPaymentTermDialog = ({ model }: EditPaymentTermDialogData) => {
    modelRef.current = model ?? null
    isEditRef.current = !!model?.paymentTerm

    const seeded = getInitialFormValues(model ?? null)

    form.reset()
    form.setFieldValue('termType', seeded.termType)
    form.setFieldValue('days', seeded.days)
    form.setFieldValue('dayOfMonth', seeded.dayOfMonth)
    form.setFieldValue('monthOffset', seeded.monthOffset)

    formDialog
      .open({
        title: translate(
          isEditRef.current ? 'text_1787603382163c3k425lvr34' : 'text_1787603382163dshrngxccpy',
        ),
        description: translate('text_1787603382163te0ngv2t7cv'),
        closeOnError: false,
        onEntered: (container) => {
          container
            .querySelector<HTMLElement>(
              `.${PAYMENT_TERM_INPUT_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
            )
            ?.click()
        },
        children: (
          <div className="p-8">
            <PaymentTermFormContent form={form} displayInDialog />
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('text_17432414198706rdwf76ek3u')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: EDIT_PAYMENT_TERM_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          modelRef.current = null
          isEditRef.current = false
        }
      })
  }

  return { openEditPaymentTermDialog }
}
