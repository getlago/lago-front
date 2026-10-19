import { CurrencyEnum, RateOverrideInput } from '~/generated/graphql'
import { RateDetailsWrapperSwitch } from '~/pages/catalog/rateProperties/RateDetailsWrapperSwitch'
import { isTieredRateModel } from '~/pages/catalog/rateProperties/tiers/rateTiers'
import { tw } from '~/styles/utils'

type RatePhaseRatePropertiesProps = {
  rate: RateOverrideInput
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
  isOverridden: boolean
}

export const RatePhaseRateProperties = ({
  rate,
  currency,
  pricingUnitShortName,
  isOverridden,
}: RatePhaseRatePropertiesProps): JSX.Element => {
  const isTiered = isTieredRateModel(rate.rateModel)

  return (
    <div
      className={tw(
        isOverridden &&
          (isTiered
            ? '[&_tbody_td:not(:first-child)>*]:w-fit [&_tbody_td:not(:first-child)>*]:bg-purple-100'
            : '[&_tbody_td>*]:w-fit [&_tbody_td>*]:bg-purple-100'),
      )}
    >
      <RateDetailsWrapperSwitch
        rateModel={rate.rateModel}
        rateProperties={rate.rateProperties}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    </div>
  )
}
