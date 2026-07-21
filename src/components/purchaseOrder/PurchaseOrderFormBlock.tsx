import { useEffect, useState } from 'react'

import { TextInput } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PURCHASE_ORDER_NUMBER_MAX_LENGTH, PURCHASE_ORDER_TRANSLATIONS } from './constants'
import { PurchaseOrder } from './PO'
import { PurchaseOrderRootProps } from './types'
import { normalizePurchaseOrderNumber } from './utils'

type PurchaseOrderFormBlockProps = Omit<PurchaseOrderRootProps, 'children'>

export const PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID = 'purchase-order-form-block-input'

// Vertical PO layout shared by the wallet, top-up and subscription forms:
// title + description, then "+ Add purchase order number" which reveals an
// inline input (no dialog) with a trash button that clears and collapses it.
export const PurchaseOrderFormBlock = ({
  value,
  onChange,
  disabled,
  ...props
}: PurchaseOrderFormBlockProps) => {
  const { translate } = useInternationalization()
  const [showInput, setShowInput] = useState(!!normalizePurchaseOrderNumber(value))
  // Only focus the input when it was revealed by a click on the add button,
  // not when it shows up because a prefilled value loaded.
  const [focusOnReveal, setFocusOnReveal] = useState(false)

  // Prefilled values load asynchronously (e.g. the edit-wallet query resolving
  // after mount) — reveal the input once a value lands.
  useEffect(() => {
    if (normalizePurchaseOrderNumber(value)) {
      setShowInput(true)
    }
  }, [value])

  return (
    <PurchaseOrder
      className="gap-3"
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <PurchaseOrder.Title />
        <PurchaseOrder.Description />
      </div>
      {showInput ? (
        // Mirrors the metrics of sibling input+trash rows (e.g. the subscription
        // name row): medium trash button so both inputs end at the same width.
        <div className="flex items-center gap-3">
          <TextInput
            className="grow"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={focusOnReveal}
            value={value || ''}
            placeholder={translate(PURCHASE_ORDER_TRANSLATIONS.placeholder)}
            disabled={disabled}
            error={
              (value?.length ?? 0) > PURCHASE_ORDER_NUMBER_MAX_LENGTH
                ? translate(PURCHASE_ORDER_TRANSLATIONS.maxLength)
                : undefined
            }
            onChange={(newValue) => onChange?.(newValue)}
            data-test={PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID}
          />
          <PurchaseOrder.TrashButton
            size="medium"
            onClick={() => {
              onChange?.(null)
              setShowInput(false)
              setFocusOnReveal(false)
            }}
          />
        </div>
      ) : (
        <PurchaseOrder.AddButton
          onClick={() => {
            setFocusOnReveal(true)
            setShowInput(true)
          }}
        />
      )}
    </PurchaseOrder>
  )
}
