import { FormikErrors } from 'formik'
import { memo, RefObject, useCallback } from 'react'

import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { CustomCharge } from '~/components/plans/CustomCharge'
import { DynamicCharge } from '~/components/plans/DynamicCharge'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { GraduatedPercentageChargeTable } from '~/components/plans/GraduatedPercentageChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { StandardCharge } from '~/components/plans/StandardCharge'
import {
  LocalChargeFilterInput,
  LocalChargeInput,
  PlanFormInput,
  TChargeErrors,
  THandleUpdate,
  TSetFieldValue,
} from '~/components/plans/types'
import { VolumeChargeTable } from '~/components/plans/VolumeChargeTable'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ChargeModelEnum, CurrencyEnum, PropertiesInput } from '~/generated/graphql'

interface ChargeWrapperSwitchProps {
  chargeErrors: TChargeErrors
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  filterIndex?: number
  formikErrors: FormikErrors<PlanFormInput>
  localCharge: LocalChargeInput
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  propertyCursor: string
  setFieldValue: TSetFieldValue
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const ChargeWrapperSwitch = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    filterIndex,
    formikErrors,
    localCharge,
    premiumWarningDialogRef,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: ChargeWrapperSwitchProps) => {
    const handleUpdate: THandleUpdate = useCallback(
      (name, value) => {
        setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    return (
      <div className="m-4">
        {localCharge.chargeModel === ChargeModelEnum.Standard && (
          <StandardCharge
            currency={currency}
            disabled={disabled}
            handleUpdate={handleUpdate}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Package && (
          <PackageCharge
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikErrors={formikErrors}
            handleUpdate={handleUpdate}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Graduated && (
          <GraduatedChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            propertyCursor={propertyCursor}
            setFieldValue={setFieldValue}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.GraduatedPercentage && (
          <GraduatedPercentageChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            setFieldValue={setFieldValue}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Percentage && (
          <ChargePercentage
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            filterIndex={filterIndex}
            formikErrors={formikErrors}
            handleUpdate={handleUpdate}
            premiumWarningDialogRef={premiumWarningDialogRef}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Volume && (
          <VolumeChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            setFieldValue={setFieldValue}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Custom && (
          <CustomCharge
            disabled={disabled}
            chargeIndex={chargeIndex}
            handleUpdate={handleUpdate}
            formikErrors={formikErrors}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Dynamic && (
          <DynamicCharge
            disabled={disabled}
            handleUpdate={handleUpdate}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
      </div>
    )
  },
)

ChargeWrapperSwitch.displayName = 'ChargeWrapperSwitch'
