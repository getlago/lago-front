import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { PaymentTermFormContent } from '~/components/paymentTerms/PaymentTermFormContent'
import { PAYMENT_TERM_FORM_DEFAULT_VALUES } from '~/components/paymentTerms/types'
import { isConcreteTermType } from '~/components/paymentTerms/utils'
import { paymentTermFormSchema } from '~/components/paymentTerms/validationSchema'
import { addToast } from '~/core/apolloClient'
import { MUI_INPUT_BASE_ROOT_CLASSNAME, PAYMENT_TERM_INPUT_CLASSNAME } from '~/core/constants/form'
import { buildPaymentTermInput } from '~/core/utils/paymentTerm'
import {
  useUpdateBillingEntityPaymentTermMutation,
  useUpdateCustomerPaymentTermMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID } from './dataTestConstants'
import { EditPaymentTermDialogData, ModelData, PaymentTermModelTypesEnum } from './types'
import { getInheritedFrom, getInitialFormValues, isCustomer } from './utils'

const EDIT_PAYMENT_TERM_FORM_ID = 'edit-payment-term-form'

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
    billingEntity {
      id
      paymentTerm {
        termType
        days
        dayOfMonth
        monthOffset
      }
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

export const useEditPaymentTermDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const modelRef = useRef<ModelData | null>(null)
  const isEditRef = useRef(false)
  const isClearingRef = useRef(false)
  const successRef = useRef(false)

  const onCompletedToast = () => {
    successRef.current = true

    if (isClearingRef.current) {
      return addToast({ severity: 'success', translateKey: 'text_1787603382163macepxq32tf' })
    }

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

      if (!model) return

      // The inherit choice sends `null`, which clears the override so the level above wins
      // again — the same payload the delete dialog sends.
      //
      // Otherwise only the chosen type's own fields are sent — the API rejects the others.
      // Never send `netPaymentTerm` alongside: the API mirrors the legacy alias itself.
      const paymentTerm = isConcreteTermType(value.termType)
        ? buildPaymentTermInput({
            termType: value.termType,
            days: value.days === '' ? 0 : Number(value.days),
            dayOfMonth: value.dayOfMonth === '' ? null : Number(value.dayOfMonth),
            monthOffset: value.monthOffset === '' ? null : Number(value.monthOffset),
          })
        : null

      // Inheriting a level that carries no term of its own changes nothing. Closing here
      // keeps the Add flow from clearing an absent term and reporting a deletion.
      if (!paymentTerm && !isEditRef.current) {
        successRef.current = true

        return
      }

      isClearingRef.current = !paymentTerm

      if (isCustomer(model)) {
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
    isClearingRef.current = false

    const inheritedFrom = getInheritedFrom(model ?? null)
    const seeded = getInitialFormValues(model ?? null, !!inheritedFrom)

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
            <PaymentTermFormContent form={form} displayInDialog inheritedFrom={inheritedFrom} />
          </div>
        ),
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest={EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID}>
              {translate('text_17432414198706rdwf76ek3u')}
            </form.SubmitButton>
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
          isClearingRef.current = false
        }
      })
  }

  return { openEditPaymentTermDialog }
}
