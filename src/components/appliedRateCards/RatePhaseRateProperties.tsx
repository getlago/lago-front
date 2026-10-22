import { CurrencyEnum, RateOverrideInput } from '~/generated/graphql'
import { RateDetailsWrapperSwitch } from '~/pages/catalog/rateProperties/RateDetailsWrapperSwitch'
import { isTieredRateModel } from '~/pages/catalog/rateProperties/tiers/rateTiers'
import { tw } from '~/styles/utils'

export const RATE_PHASE_RATE_PROPERTIES_TEST_ID = 'rate-phase-rate-properties'
const OVERRIDDEN_TIERED_RATE_PROPERTIES_CLASSNAME =
  '[&_tbody_td:not(:first-child)>*]:w-fit [&_tbody_td:not(:first-child)>*]:bg-purple-100'
const OVERRIDDEN_RATE_PROPERTIES_CLASSNAME = '[&_tbody_td>*]:w-fit [&_tbody_td>*]:bg-purple-100'

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
      data-test={RATE_PHASE_RATE_PROPERTIES_TEST_ID}
      className={tw(
        isOverridden &&
          (isTiered
            ? OVERRIDDEN_TIERED_RATE_PROPERTIES_CLASSNAME
            : OVERRIDDEN_RATE_PROPERTIES_CLASSNAME),
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
