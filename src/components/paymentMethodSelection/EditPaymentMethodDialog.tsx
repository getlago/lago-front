import { useEffect, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Dialog } from '~/components/designSystem/Dialog'
import { Radio } from '~/components/form/Radio/Radio'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodComboBox } from './PaymentMethodComboBox'
import { SelectedPaymentMethod } from './types'

import { VIEW_TYPE_TRANSLATION_KEYS, ViewTypeEnum } from '../paymentMethodsInvoiceSettings/types'

export const EDIT_PM_DIALOG_CANCEL_BUTTON_TEST_ID = 'edit-payment-method-dialog-cancel-button'
export const EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID = 'edit-payment-method-dialog-save-button'
export const EDIT_PM_DIALOG_FALLBACK_RADIO_TEST_ID = 'edit-payment-method-dialog-fallback-radio'
export const EDIT_PM_DIALOG_SPECIFIC_RADIO_TEST_ID = 'edit-payment-method-dialog-specific-radio'
export const EDIT_PM_DIALOG_MANUAL_RADIO_TEST_ID = 'edit-payment-method-dialog-manual-radio'

enum PaymentMethodBehavior {
  FALLBACK = 'fallback',
  SPECIFIC = 'specific',
  MANUAL = 'manual',
}

interface EditPaymentMethodDialogProps {
  open: boolean
  onClose: () => void
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  paymentMethodsList: PaymentMethodList
  viewType: ViewTypeEnum
}

export const EditPaymentMethodDialog = ({
  open,
  onClose,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  paymentMethodsList,
  viewType,
}: EditPaymentMethodDialogProps) => {
  const { translate } = useInternationalization()

  const [behavior, setBehavior] = useState<PaymentMethodBehavior>(PaymentMethodBehavior.FALLBACK)
  const [paymentMethodId, setPaymentMethodId] = useState<string>('')

  useEffect(() => {
    if (open) {
      let initialBehavior: PaymentMethodBehavior

      if (selectedPaymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual) {
        initialBehavior = PaymentMethodBehavior.MANUAL
      } else if (selectedPaymentMethod?.paymentMethodId) {
        initialBehavior = PaymentMethodBehavior.SPECIFIC
      } else {
        initialBehavior = PaymentMethodBehavior.FALLBACK
      }

      setBehavior(initialBehavior)
      setPaymentMethodId(selectedPaymentMethod?.paymentMethodId || '')
    }
  }, [open, selectedPaymentMethod])

  const handleSave = (): void => {
    let newPaymentMethod: SelectedPaymentMethod

    switch (behavior) {
      case PaymentMethodBehavior.FALLBACK:
        newPaymentMethod = {
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        }
        break
      case PaymentMethodBehavior.SPECIFIC:
        newPaymentMethod = {
          paymentMethodId: paymentMethodId || undefined,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        }
        break
      case PaymentMethodBehavior.MANUAL:
        newPaymentMethod = {
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Manual,
        }
        break
    }
    setSelectedPaymentMethod(newPaymentMethod)
    onClose()
  }

  const isSaveDisabled = (): boolean => {
    if (behavior === PaymentMethodBehavior.SPECIFIC) {
      return !paymentMethodId
    }
    return false
  }

  const viewTypeLabel = translate(VIEW_TYPE_TRANSLATION_KEYS[viewType])

  return (
    <Dialog
      open={open}
      title={translate('text_1764327933607ccgjo6zvcqe', { object: viewTypeLabel })}
      description={translate('text_1764327933607muwda2648vk', { object: viewTypeLabel })}
      onClose={onClose}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={closeDialog}
            data-test={EDIT_PM_DIALOG_CANCEL_BUTTON_TEST_ID}
          >
            {translate('text_63ea0f84f400488553caa6a5')}
          </Button>
          <Button
            variant="primary"
            disabled={isSaveDisabled()}
            onClick={handleSave}
            data-test={EDIT_PM_DIALOG_SAVE_BUTTON_TEST_ID}
          >
            {translate('text_1764327933607yodbve95igk')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex flex-col gap-4">
        <div data-test={EDIT_PM_DIALOG_FALLBACK_RADIO_TEST_ID}>
          <Radio
            name="behavior"
            value={PaymentMethodBehavior.FALLBACK}
            checked={behavior === PaymentMethodBehavior.FALLBACK}
            onChange={(value) => setBehavior(value as PaymentMethodBehavior)}
            label={translate('text_1764327933607vaxp26hr987')}
            labelVariant="body"
          />
        </div>
        <div>
          <div data-test={EDIT_PM_DIALOG_SPECIFIC_RADIO_TEST_ID}>
            <Radio
              name="behavior"
              value={PaymentMethodBehavior.SPECIFIC}
              checked={behavior === PaymentMethodBehavior.SPECIFIC}
              onChange={(value) => setBehavior(value as PaymentMethodBehavior)}
              label={translate('text_1764327933607k8rsl1pzong', { object: viewTypeLabel })}
              labelVariant="body"
            />
          </div>
          {behavior === PaymentMethodBehavior.SPECIFIC && (
            <div className="mt-4">
              <PaymentMethodComboBox
                paymentMethodsList={paymentMethodsList}
                selectedPaymentMethod={{
                  paymentMethodId: paymentMethodId || undefined,
                  paymentMethodType: PaymentMethodTypeEnum.Provider,
                }}
                setSelectedPaymentMethod={(value) => {
                  setPaymentMethodId(value?.paymentMethodId || '')
                }}
                PopperProps={{ displayInDialog: true }}
              />
            </div>
          )}
        </div>
        <div data-test={EDIT_PM_DIALOG_MANUAL_RADIO_TEST_ID}>
          <Radio
            name="behavior"
            value={PaymentMethodBehavior.MANUAL}
            checked={behavior === PaymentMethodBehavior.MANUAL}
            onChange={(value) => setBehavior(value as PaymentMethodBehavior)}
            label={translate('text_1764327933607gcy9fzbfkcs')}
            labelVariant="body"
          />
        </div>
      </div>
    </Dialog>
  )
}
