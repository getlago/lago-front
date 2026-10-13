import { gql } from '@apollo/client'
import { type AnyFormApi, type AppFieldExtendedReactFormApi } from '@tanstack/react-form'
import { ComponentType, ReactNode } from 'react'

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
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'

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

// `group.form` is typed as the core FormApi, the tier tables need the React-extended type: same
// runtime object, erased like `@tanstack/form-core`'s own `AnyFormApi`.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyReactFormApi = AppFieldExtendedReactFormApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>
/* eslint-enable @typescript-eslint/no-explicit-any */

// A concrete signature, not `hostForm` threaded through their generics: TanStack would infer
// `TFormData` from the widened `form`.
type RatePropertiesTierTableProps = {
  form: AnyReactFormApi
  fields: 'properties'
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
  disabled?: boolean
}

const BoundGraduatedRateTiersTable =
  GraduatedRateTiersTable as ComponentType<RatePropertiesTierTableProps>
const BoundGraduatedPercentageRateTiersTable =
  GraduatedPercentageRateTiersTable as ComponentType<RatePropertiesTierTableProps>
const BoundVolumeRateTiersTable =
  VolumeRateTiersTable as ComponentType<RatePropertiesTierTableProps>

export type RateWrapperSwitchProps = {
  rateModel: RateCardRateModelEnum
  productType: ProductTypeEnum
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
  disabled?: boolean
  onExpandCustomCharge: (currentValue: string | undefined) => void
}

const rateWrapperSwitchDefaultProps: RateWrapperSwitchProps = {
  rateModel: RateCardRateModelEnum.Standard,
  productType: ProductTypeEnum.Metered,
  currency: CurrencyEnum.Usd,
  pricingUnitShortName: undefined,
  disabled: false,
  onExpandCustomCharge: () => undefined,
}

export const RateWrapperSwitch = withFieldGroup({
  defaultValues: getRatePropertiesShape(),
  props: rateWrapperSwitchDefaultProps,
  render: function RateWrapperSwitchRender({
    group,
    rateModel,
    productType,
    currency,
    pricingUnitShortName,
    disabled,
    onExpandCustomCharge,
  }) {
    const hostForm = group.form as unknown as AnyReactFormApi

    const contentByRateModel: Record<RateCardRateModelEnum, ReactNode> = {
      [RateCardRateModelEnum.Standard]: <StandardCharge />,
      [RateCardRateModelEnum.Package]: <PackageCharge />,
      [RateCardRateModelEnum.Percentage]: <ChargePercentage />,
      [RateCardRateModelEnum.Custom]: (
        <CustomCharge onExpandCustomCharge={disabled ? undefined : onExpandCustomCharge} />
      ),
      [RateCardRateModelEnum.Dynamic]: <DynamicCharge />,
      [RateCardRateModelEnum.Graduated]: (
        <BoundGraduatedRateTiersTable
          form={hostForm}
          fields="properties"
          currency={currency}
          pricingUnitShortName={pricingUnitShortName}
          disabled={disabled}
        />
      ),
      [RateCardRateModelEnum.GraduatedPercentage]: (
        <BoundGraduatedPercentageRateTiersTable
          form={hostForm}
          fields="properties"
          currency={currency}
          pricingUnitShortName={pricingUnitShortName}
          disabled={disabled}
        />
      ),
      [RateCardRateModelEnum.Volume]: (
        <BoundVolumeRateTiersTable
          form={hostForm}
          fields="properties"
          currency={currency}
          pricingUnitShortName={pricingUnitShortName}
          disabled={disabled}
        />
      ),
    }

    return (
      <ChargeFormProvider
        form={group.form as unknown as AnyFormApi}
        propertyCursor="properties"
        currency={currency}
        disabled={disabled}
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
