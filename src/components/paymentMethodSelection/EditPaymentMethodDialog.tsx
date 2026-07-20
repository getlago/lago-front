import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID } from './dataTestConstants'
import { PaymentMethodFields } from './PaymentMethodFields'
import { deriveBehavior, PaymentMethodBehavior, SelectedPaymentMethod } from './types'

import { VIEW_TYPE_TRANSLATION_KEYS, ViewTypeEnum } from '../paymentMethodsInvoiceSettings/types'

export const EDIT_PAYMENT_METHOD_FORM_ID = 'edit-payment-method-form'

type OpenEditPaymentMethodDialogParams = {
  externalCustomerId: string
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  viewType: ViewTypeEnum
}

type SetDisabledRef = React.MutableRefObject<(disabled: boolean) => void>

const EditPaymentMethodSaveButton = ({ setDisabledRef }: { setDisabledRef: SetDisabledRef }) => {
  const { translate } = useInternationalization()
  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    setDisabledRef.current = setDisabled
  }, [setDisabledRef])

  return (
    <Button
      variant="primary"
      type="submit"
      disabled={disabled}
      data-test={EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID}
    >
      {translate('text_1764327933607yodbve95igk')}
    </Button>
  )
}

type EditPaymentMethodDialogContentProps = {
  externalCustomerId: string
  seedValue: SelectedPaymentMethod
  viewType: ViewTypeEnum
  onDraftChange: (draft: SelectedPaymentMethod, behavior: PaymentMethodBehavior) => void
}

const EditPaymentMethodDialogContent = ({
  externalCustomerId,
  seedValue,
  viewType,
  onDraftChange,
}: EditPaymentMethodDialogContentProps) => {
  const [draft, setDraft] = useState<SelectedPaymentMethod>(seedValue)
  const [behavior, setBehavior] = useState<PaymentMethodBehavior>(() => deriveBehavior(seedValue))

  useEffect(() => {
    onDraftChange(draft, behavior)
  }, [draft, behavior, onDraftChange])

  return (
    <div className="p-8">
      <PaymentMethodFields
        viewType={viewType}
        externalCustomerId={externalCustomerId}
        value={seedValue}
        onChange={setDraft}
        onBehaviorChange={setBehavior}
      />
    </div>
  )
}

export const useEditPaymentMethodDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  const draftRef = useRef<SelectedPaymentMethod>(undefined)
  const setSelectedPaymentMethodRef = useRef<((value: SelectedPaymentMethod) => void) | null>(null)
  const setDisabledRef: SetDisabledRef = useRef<(disabled: boolean) => void>(() => {})

  const handleSubmit = async (): Promise<DialogResult> => {
    if (!setSelectedPaymentMethodRef.current) {
      throw new Error('Submit failed')
    }

    setSelectedPaymentMethodRef.current(draftRef.current)

    return { reason: 'success' }
  }

  const openEditPaymentMethodDialog = ({
    externalCustomerId,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    viewType,
  }: OpenEditPaymentMethodDialogParams) => {
    draftRef.current = selectedPaymentMethod
    setSelectedPaymentMethodRef.current = setSelectedPaymentMethod

    const handleDraftChange = (
      nextDraft: SelectedPaymentMethod,
      nextBehavior: PaymentMethodBehavior,
    ) => {
      draftRef.current = nextDraft
      // Picking "specific" without a payment method must block save (legacy guard).
      const isSaveDisabled =
        nextBehavior === PaymentMethodBehavior.SPECIFIC && !nextDraft?.paymentMethodId

      setDisabledRef.current(isSaveDisabled)
    }

    const viewTypeLabel = translate(VIEW_TYPE_TRANSLATION_KEYS[viewType])

    formDialog
      .open({
        title: translate('text_1764327933607ccgjo6zvcqe', { object: viewTypeLabel }),
        description: translate('text_1764327933607muwda2648vk', { object: viewTypeLabel }),
        closeOnError: false,
        onEntered: focusFirstInput,
        children: (
          <EditPaymentMethodDialogContent
            externalCustomerId={externalCustomerId}
            seedValue={selectedPaymentMethod}
            viewType={viewType}
            onDraftChange={handleDraftChange}
          />
        ),
        mainAction: <EditPaymentMethodSaveButton setDisabledRef={setDisabledRef} />,
        form: {
          id: EDIT_PAYMENT_METHOD_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then(() => {
        draftRef.current = undefined
        setSelectedPaymentMethodRef.current = null
      })
  }

  return { openEditPaymentMethodDialog }
}
