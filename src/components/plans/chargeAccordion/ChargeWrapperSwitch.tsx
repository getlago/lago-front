import { FormikProps } from 'formik'
import { memo, RefObject } from 'react'

import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { CustomCharge } from '~/components/plans/CustomCharge'
import { DynamicCharge } from '~/components/plans/DynamicCharge'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { GraduatedPercentageChargeTable } from '~/components/plans/GraduatedPercentageChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { StandardCharge } from '~/components/plans/StandardCharge'
import { LocalChargeFilterInput, PlanFormInput } from '~/components/plans/types'
import { VolumeChargeTable } from '~/components/plans/VolumeChargeTable'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ChargeModelEnum, CurrencyEnum, PropertiesInput } from '~/generated/graphql'

export type ChargeCursor = keyof Pick<PlanFormInput, 'charges' | 'fixedCharges'>

interface ChargeWrapperSwitchProps {
  chargeCursor: ChargeCursor
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  filterIndex?: number
  formikProps: FormikProps<PlanFormInput>
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const ChargeWrapperSwitch = memo(
  ({
    chargeCursor,
    chargeIndex,
    chargePricingUnitShortName,
    currency,
    disabled,
    filterIndex,
    formikProps,
    premiumWarningDialogRef,
    propertyCursor,
    valuePointer,
  }: ChargeWrapperSwitchProps) => {
    const localCharge = formikProps.values[chargeCursor]?.[chargeIndex]

    return (
      <div className="m-4">
        {localCharge?.chargeModel === ChargeModelEnum.Standard && (
          <StandardCharge
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Package && (
          <PackageCharge
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Graduated && (
          <GraduatedChargeTable
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.GraduatedPercentage && (
          <GraduatedPercentageChargeTable
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Percentage && (
          <ChargePercentage
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            filterIndex={filterIndex}
            formikProps={formikProps}
            premiumWarningDialogRef={premiumWarningDialogRef}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Volume && (
          <VolumeChargeTable
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Custom && (
          <CustomCharge
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Dynamic && (
          <DynamicCharge
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
      </div>
    )
  },
)

ChargeWrapperSwitch.displayName = 'ChargeWrapperSwitch'
