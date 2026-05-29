import { CurrencyEnum, OrderTypeEnum } from '~/generated/graphql'
import { withForm } from '~/hooks/forms/useAppform'

import AddOnSelectionContent from './AddOnSelectionContent'
import { pricingDrawerDefaultValues } from './constants'
import PlanSelectionContent from './PlanSelectionContent'

interface PricingDrawerContentExtraProps {
  quoteType: OrderTypeEnum
  currency: CurrencyEnum
}

const pricingDrawerContentDefaultProps: PricingDrawerContentExtraProps = {
  quoteType: OrderTypeEnum.OneOff,
  currency: CurrencyEnum.Usd,
}

const PricingDrawerContent = withForm({
  defaultValues: pricingDrawerDefaultValues,
  props: pricingDrawerContentDefaultProps,
  render: function PricingDrawerContent({ form, quoteType, currency }) {
    const isPlanSelection =
      quoteType === OrderTypeEnum.SubscriptionCreation ||
      quoteType === OrderTypeEnum.SubscriptionAmendment

    if (isPlanSelection) {
      return <PlanSelectionContent form={form} />
    }

    return <AddOnSelectionContent form={form} currency={currency} />
  },
})

export default PricingDrawerContent
