import { FormikProps, FormikState } from 'formik'
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
  chargeErrors: FormikState<PlanFormInput>['errors']
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  filterIndex?: number
  formikProps: FormikProps<PlanFormInput>
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const ChargeWrapperSwitch = memo(
  ({
    chargeCursor,
    chargeIndex,
    chargeErrors,
    chargePricingUnitShortName,
    currency,
    disabled,
    filterIndex,
    formikProps,
    premiumWarningDialogRef,
    propertyCursor,
    setFieldValue,
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
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Package && (
          <PackageCharge
            chargeCursor={chargeCursor}
            chargeErrors={chargeErrors}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
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
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
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
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Percentage && (
          <ChargePercentage
            chargeCursor={chargeCursor}
            chargeErrors={chargeErrors}
            chargeIndex={chargeIndex}
            chargePricingUnitShortName={chargePricingUnitShortName}
            currency={currency}
            disabled={disabled}
            filterIndex={filterIndex}
            premiumWarningDialogRef={premiumWarningDialogRef}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
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
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Custom && (
          <CustomCharge
            chargeCursor={chargeCursor}
            chargeErrors={chargeErrors}
            chargeIndex={chargeIndex}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge?.chargeModel === ChargeModelEnum.Dynamic && (
          <DynamicCharge
            chargeCursor={chargeCursor}
            chargeIndex={chargeIndex}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
      </div>
    )
  },
)

ChargeWrapperSwitch.displayName = 'ChargeWrapperSwitch'
