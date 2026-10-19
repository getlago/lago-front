import { CurrencyEnum, RateOverrideInput } from '~/generated/graphql'
import { RateDetailsWrapperSwitch } from '~/pages/catalog/rateProperties/RateDetailsWrapperSwitch'
import { isTieredRateModel } from '~/pages/catalog/rateProperties/tiers/rateTiers'
import { tw } from '~/styles/utils'

export const RATE_PHASE_RATE_PROPERTIES_TEST_ID = 'rate-phase-rate-properties'

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
