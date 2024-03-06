import { FormikProps } from 'formik'
import { memo, RefObject } from 'react'
import styled from 'styled-components'

import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'

import { GraduatedPercentageChargeTable } from './GraduatedPercentageChargeTable'
import { StandardCharge } from './StandardCharge'
import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'

import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

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
      <MargedWrapper>
        {localCharge.chargeModel === ChargeModelEnum.Standard && (
          <StandardCharge
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
            initialValuePointer={initialValuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Package && (
          <PackageCharge
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Graduated && (
          <GraduatedChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.GraduatedPercentage && (
          <GraduatedPercentageChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Percentage && (
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
        )}
        {localCharge.chargeModel === ChargeModelEnum.Volume && (
          <VolumeChargeTable
            chargeIndex={chargeIndex}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
      </MargedWrapper>
    )
  },
)

ChargeWrapperSwitch.displayName = 'ChargeWrapperSwitch'

const MargedWrapper = styled.div`
  margin: 16px;
`
