import { ReactNode } from 'react'

import { CustomChargeDetails } from '~/components/plans/details/CustomChargeDetails'
import { PackageChargeDetails } from '~/components/plans/details/PackageChargeDetails'
import { PercentageChargeDetails } from '~/components/plans/details/PercentageChargeDetails'
import { PricingGroupKeysDetails } from '~/components/plans/details/PricingGroupKeysDetails'
import { StandardChargeDetails } from '~/components/plans/details/StandardChargeDetails'
import { DynamicCharge } from '~/components/plans/DynamicCharge'
import {
  CurrencyEnum,
  PropertiesForRateCardRateFragment,
  RateCardRateModelEnum,
} from '~/generated/graphql'

import { GraduatedPercentageRateTiersDetails } from './tiers/GraduatedPercentageRateTiersDetails'
import { GraduatedRateTiersDetails } from './tiers/GraduatedRateTiersDetails'
import { VolumeRateTiersDetails } from './tiers/VolumeRateTiersDetails'

type RateDetailsWrapperSwitchProps = {
  rateModel: RateCardRateModelEnum
  rateProperties: PropertiesForRateCardRateFragment
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const RateDetailsWrapperSwitch = ({
  rateModel,
  rateProperties,
  currency,
  pricingUnitShortName,
}: RateDetailsWrapperSwitchProps): JSX.Element => {
  const contentByRateModel: Record<RateCardRateModelEnum, ReactNode> = {
    [RateCardRateModelEnum.Standard]: (
      <StandardChargeDetails
        amount={rateProperties.amount}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    ),
    [RateCardRateModelEnum.Package]: (
      <PackageChargeDetails
        amount={rateProperties.amount}
        packageSize={rateProperties.packageSize}
        freeUnits={rateProperties.freeUnits}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    ),
    [RateCardRateModelEnum.Percentage]: (
      <PercentageChargeDetails
        rate={rateProperties.rate}
        fixedAmount={rateProperties.fixedAmount}
        freeUnitsPerEvents={rateProperties.freeUnitsPerEvents}
        freeUnitsPerTotalAggregation={rateProperties.freeUnitsPerTotalAggregation}
        perTransactionMinAmount={rateProperties.perTransactionMinAmount}
        perTransactionMaxAmount={rateProperties.perTransactionMaxAmount}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    ),
    [RateCardRateModelEnum.Custom]: (
      <CustomChargeDetails customProperties={rateProperties.customProperties} />
    ),
    [RateCardRateModelEnum.Dynamic]: <DynamicCharge />,
    [RateCardRateModelEnum.Graduated]: (
      <GraduatedRateTiersDetails
        tiers={rateProperties.graduatedRanges ?? []}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    ),
    [RateCardRateModelEnum.GraduatedPercentage]: (
      <GraduatedPercentageRateTiersDetails
        tiers={rateProperties.graduatedPercentageRanges ?? []}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    ),
    [RateCardRateModelEnum.Volume]: (
      <VolumeRateTiersDetails
        tiers={rateProperties.volumeRanges ?? []}
        currency={currency}
        pricingUnitShortName={pricingUnitShortName}
      />
    ),
  }

  return (
    <div className="flex flex-col gap-4">
      {contentByRateModel[rateModel]}
      <PricingGroupKeysDetails pricingGroupKeys={rateProperties.pricingGroupKeys} />
    </div>
  )
}
