import { ResolvablePaymentTerm } from '~/core/utils/paymentTerm'
import { type AddOnForPricingSectionFragment, CurrencyEnum } from '~/generated/graphql'
import { withForm } from '~/hooks/forms/useAppform'

import AddOnSelectionContent from './AddOnSelectionContent'
import { pricingDrawerDefaultValues } from './constants'

interface PricingDrawerContentExtraProps {
  currency: CurrencyEnum
  onAddOnPayloadCapture?: (localId: string, addOn: AddOnForPricingSectionFragment) => void
  paymentTerm?: ResolvablePaymentTerm | null
}

const pricingDrawerContentDefaultProps: PricingDrawerContentExtraProps = {
  currency: CurrencyEnum.Usd,
  onAddOnPayloadCapture: undefined,
  paymentTerm: undefined,
}

const PricingDrawerContent = withForm({
  defaultValues: pricingDrawerDefaultValues,
  props: pricingDrawerContentDefaultProps,
  render: function PricingDrawerContentRender({
    form,
    currency,
    onAddOnPayloadCapture,
    paymentTerm,
  }) {
    return (
      <AddOnSelectionContent
        form={form}
        currency={currency}
        onAddOnPayloadCapture={onAddOnPayloadCapture}
        paymentTerm={paymentTerm}
      />
    )
  },
})

export default PricingDrawerContent
