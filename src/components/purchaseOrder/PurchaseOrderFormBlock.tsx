import { useState } from 'react'

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
  // `revealed` tracks a user interaction (add click, typing) that keeps the
  // input open even while the value is empty; a non-empty value (e.g. an
  // async prefill landing after mount) reveals it on its own, so the value
  // stays the single source of truth for whether content exists.
  const [revealed, setRevealed] = useState(false)
  // Only focus the input when it was revealed by a click on the add button,
  // not when it shows up because a prefilled value loaded.
  const [focusOnReveal, setFocusOnReveal] = useState(false)
  const showInput = revealed || !!normalizePurchaseOrderNumber(value)

  const renderInputOrAddButton = () => {
    if (!showInput) {
      return (
        <PurchaseOrder.AddButton
          onClick={() => {
            setFocusOnReveal(true)
            setRevealed(true)
          }}
        />
      )
    }

    // Mirrors the metrics of sibling input+trash rows (e.g. the subscription
    // name row): medium trash button so both inputs end at the same width.
    return (
      <div className="flex items-center gap-3">
        <TextInput
          className="grow"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={focusOnReveal}
          value={value || ''}
          placeholder={translate(PURCHASE_ORDER_TRANSLATIONS.placeholder)}
          disabled={disabled}
          // Typing is hard-capped (same behaviour as the PO number filter);
          // the error only surfaces for programmatically-seeded overlong
          // values, and the shared schema issue gates the submit.
          inputProps={{ maxLength: PURCHASE_ORDER_NUMBER_MAX_LENGTH }}
          error={
            (value?.length ?? 0) > PURCHASE_ORDER_NUMBER_MAX_LENGTH
              ? translate(PURCHASE_ORDER_TRANSLATIONS.maxLength)
              : undefined
          }
          onChange={(newValue) => {
            // Typing counts as revealing: without this, deleting the last
            // character of a prefilled value would collapse the input mid-edit.
            setRevealed(true)
            onChange?.(newValue)
          }}
          data-test={PURCHASE_ORDER_FORM_BLOCK_INPUT_TEST_ID}
        />
        <PurchaseOrder.TrashButton
          size="medium"
          onClick={() => {
            onChange?.(null)
            setRevealed(false)
            setFocusOnReveal(false)
          }}
        />
      </div>
    )
  }

  return (
    <PurchaseOrder value={value} onChange={onChange} disabled={disabled} {...props}>
      <div className="flex flex-col gap-1">
        <PurchaseOrder.Title />
        <PurchaseOrder.Description />
      </div>
      {renderInputOrAddButton()}
    </PurchaseOrder>
  )
}
