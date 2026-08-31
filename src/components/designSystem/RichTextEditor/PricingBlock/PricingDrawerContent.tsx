import { type AddOnForPricingSectionFragment, CurrencyEnum } from '~/generated/graphql'
import { withForm } from '~/hooks/forms/useAppform'

import AddOnSelectionContent from './AddOnSelectionContent'
import { pricingDrawerDefaultValues } from './constants'

interface PricingDrawerContentExtraProps {
  currency: CurrencyEnum
  onAddOnPayloadCapture?: (localId: string, addOn: AddOnForPricingSectionFragment) => void
  netPaymentTerm?: number | null
}

const pricingDrawerContentDefaultProps: PricingDrawerContentExtraProps = {
  currency: CurrencyEnum.Usd,
  onAddOnPayloadCapture: undefined,
  netPaymentTerm: undefined,
}

const PricingDrawerContent = withForm({
  defaultValues: pricingDrawerDefaultValues,
  props: pricingDrawerContentDefaultProps,
  render: function PricingDrawerContentRender({
    form,
    currency,
    onAddOnPayloadCapture,
    netPaymentTerm,
  }) {
    return (
      <AddOnSelectionContent
        form={form}
        currency={currency}
        onAddOnPayloadCapture={onAddOnPayloadCapture}
        netPaymentTerm={netPaymentTerm}
      />
    )
  },
})

export default PricingDrawerContent
