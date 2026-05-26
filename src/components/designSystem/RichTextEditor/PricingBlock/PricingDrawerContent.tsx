import {
  OrderTypeEnum,
  useGetAddOnsForFixedChargesSectionQuery,
  usePlansQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { pricingDrawerDefaultValues } from './constants'

interface PricingDrawerContentExtraProps {
  quoteType: OrderTypeEnum
}

const PricingDrawerContent = withForm({
  defaultValues: pricingDrawerDefaultValues,
  props: {} as PricingDrawerContentExtraProps,
  render: function Render({ form, quoteType }) {
    const { translate } = useInternationalization()
    const isPlanSelection =
      quoteType === OrderTypeEnum.SubscriptionCreation ||
      quoteType === OrderTypeEnum.SubscriptionAmendment

    const { data: plansData, loading: plansLoading } = usePlansQuery({
      variables: { limit: 100 },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      skip: !isPlanSelection,
    })

    const { data: addOnsData, loading: addOnsLoading } = useGetAddOnsForFixedChargesSectionQuery({
      variables: { limit: 100 },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
      skip: isPlanSelection,
    })

    if (isPlanSelection) {
      const comboBoxData = (plansData?.plans?.collection ?? []).map((plan) => ({
        value: plan.id,
        label: `${plan.name} (${plan.code})`,
      }))

      return (
        <form.AppField name="planId">
          {(field) => (
            <field.ComboBoxField
              data={comboBoxData}
              loading={plansLoading}
              label={translate('text_63d3a658c6d84a5843032145')}
              placeholder={translate('text_63d3a658c6d84a5843032147')}
            />
          )}
        </form.AppField>
      )
    }

    const comboBoxData = (addOnsData?.addOns?.collection ?? []).map((addOn) => ({
      value: addOn.id,
      label: `${addOn.name} (${addOn.code})`,
    }))

    return (
      <form.AppField name="addOnIds">
        {(field) => (
          <field.MultipleComboBoxField
            data={comboBoxData}
            loading={addOnsLoading}
            label={translate('text_1779802343220xh5jm32or13')}
            placeholder={translate('text_17798023432203q6hytdp7om')}
          />
        )}
      </form.AppField>
    )
  },
})

export default PricingDrawerContent
