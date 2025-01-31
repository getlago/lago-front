import { FormikProps } from 'formik'
import { memo, RefObject } from 'react'

import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { CustomCharge } from '~/components/plans/CustomCharge'
import { DynamicCharge } from '~/components/plans/DynamicCharge'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { GraduatedPercentageChargeTable } from '~/components/plans/GraduatedPercentageChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { StandardCharge } from '~/components/plans/StandardCharge'
import {
  LocalChargeFilterInput,
  LocalPropertiesInput,
  PlanFormInput,
} from '~/components/plans/types'
import { VolumeChargeTable } from '~/components/plans/VolumeChargeTable'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'

interface ChargeWrapperSwitchProps {
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
  chargeIndex: number
  filterIndex?: number
  initialValuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
}

export const ChargeWrapperSwitch = memo(
  ({
    currency,
    disabled,
    formikProps,
    chargeIndex,
    filterIndex,
    initialValuePointer,
    premiumWarningDialogRef,
    propertyCursor,
    valuePointer,
  }: ChargeWrapperSwitchProps) => {
    const localCharge = formikProps.values.charges[chargeIndex]

    return (
      <div className="m-4">
        {localCharge.chargeModel === ChargeModelEnum.Standard ? (
          <StandardCharge
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
            initialValuePointer={initialValuePointer}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.Package ? (
          <PackageCharge
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.Graduated ? (
          <GraduatedChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.GraduatedPercentage ? (
          <GraduatedPercentageChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.Percentage ? (
          <ChargePercentage
            chargeIndex={chargeIndex}
            filterIndex={filterIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.Volume ? (
          <VolumeChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.Custom ? (
          <CustomCharge
            disabled={disabled}
            chargeIndex={chargeIndex}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        ) : localCharge.chargeModel === ChargeModelEnum.Dynamic ? (
          <DynamicCharge
            chargeIndex={chargeIndex}
            disabled={disabled}
            formikProps={formikProps}
            initialValuePointer={initialValuePointer}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        ) : null}
      </div>
    )
  },
)

ChargeWrapperSwitch.displayName = 'ChargeWrapperSwitch'
