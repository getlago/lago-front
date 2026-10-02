import { gql } from '@apollo/client'
import { ReactNode } from 'react'

import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { CustomCharge } from '~/components/plans/CustomCharge'
import { DynamicCharge } from '~/components/plans/DynamicCharge'
import { PackageCharge } from '~/components/plans/PackageCharge'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { StandardCharge } from '~/components/plans/StandardCharge'
import { ChargeFormProvider } from '~/contexts/ChargeFormContext'
import {
  CurrencyEnum,
  CustomChargeForRateFragmentDoc,
  GraduatedPercentageRateTierFragmentDoc,
  GraduatedRateTierFragmentDoc,
  PackageChargeForRateFragmentDoc,
  PercentageChargeForRateFragmentDoc,
  PricingGroupKeysForRateFragmentDoc,
  ProductTypeEnum,
  RateCardRateModelEnum,
  StandardChargeForRateFragmentDoc,
  VolumeRateTierFragmentDoc,
} from '~/generated/graphql'
import { withForm } from '~/hooks/forms/useAppform'
import { RATE_CARD_RATE_FORM_DEFAULTS } from '~/pages/catalog/drawers/rateCardRate/constants'

import { GraduatedPercentageRateTiersTable } from './tiers/GraduatedPercentageRateTiersTable'
import { GraduatedRateTiersTable } from './tiers/GraduatedRateTiersTable'
import { VolumeRateTiersTable } from './tiers/VolumeRateTiersTable'

gql`
  fragment RatePropertiesForWrapperSwitch on RateProperties {
    ...StandardChargeForRate
    ...PackageChargeForRate
    ...PercentageChargeForRate
    ...CustomChargeForRate
    ...PricingGroupKeysForRate
    graduatedRanges {
      ...GraduatedRateTier
    }
    graduatedPercentageRanges {
      ...GraduatedPercentageRateTier
    }
    volumeRanges {
      ...VolumeRateTier
    }
  }

  ${StandardChargeForRateFragmentDoc}
  ${PackageChargeForRateFragmentDoc}
  ${PercentageChargeForRateFragmentDoc}
  ${CustomChargeForRateFragmentDoc}
  ${PricingGroupKeysForRateFragmentDoc}
  ${GraduatedRateTierFragmentDoc}
  ${GraduatedPercentageRateTierFragmentDoc}
  ${VolumeRateTierFragmentDoc}
`

type RateWrapperSwitchProps = {
  rateModel: RateCardRateModelEnum
  productType: ProductTypeEnum
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
  onExpandCustomCharge: (currentValue: string | undefined) => void
}

const rateWrapperSwitchDefaultProps: RateWrapperSwitchProps = {
  rateModel: RateCardRateModelEnum.Standard,
  productType: ProductTypeEnum.Metered,
  currency: CurrencyEnum.Usd,
  pricingUnitShortName: undefined,
  onExpandCustomCharge: () => undefined,
}

export const RateWrapperSwitch = withForm({
  defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
  props: rateWrapperSwitchDefaultProps,
  render: function RateWrapperSwitchRender({
    form,
    rateModel,
    productType,
    currency,
    pricingUnitShortName,
    onExpandCustomCharge,
  }) {
    const contentByRateModel: Record<RateCardRateModelEnum, ReactNode> = {
      [RateCardRateModelEnum.Standard]: <StandardCharge />,
      [RateCardRateModelEnum.Package]: <PackageCharge />,
      [RateCardRateModelEnum.Percentage]: <ChargePercentage />,
      [RateCardRateModelEnum.Custom]: <CustomCharge onExpandCustomCharge={onExpandCustomCharge} />,
      [RateCardRateModelEnum.Dynamic]: <DynamicCharge />,
      [RateCardRateModelEnum.Graduated]: (
        <GraduatedRateTiersTable
          form={form}
          currency={currency}
          pricingUnitShortName={pricingUnitShortName}
        />
      ),
      [RateCardRateModelEnum.GraduatedPercentage]: (
        <GraduatedPercentageRateTiersTable
          form={form}
          currency={currency}
          pricingUnitShortName={pricingUnitShortName}
        />
      ),
      [RateCardRateModelEnum.Volume]: (
        <VolumeRateTiersTable
          form={form}
          currency={currency}
          pricingUnitShortName={pricingUnitShortName}
        />
      ),
    }

    return (
      <ChargeFormProvider
        form={form}
        propertyCursor="properties"
        currency={currency}
        chargePricingUnitShortName={pricingUnitShortName}
      >
        <div className="flex flex-col gap-6">
          {contentByRateModel[rateModel]}
          {productType === ProductTypeEnum.Metered && <PricingGroupKeys />}
        </div>
      </ChargeFormProvider>
    )
  },
})
