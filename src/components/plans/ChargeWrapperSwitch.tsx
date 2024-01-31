import { FormikProps } from 'formik'
import { memo, RefObject } from 'react'
import styled from 'styled-components'

import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { ChargeModelEnum, CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'

import { GraduatedPercentageChargeTable } from './GraduatedPercentageChargeTable'
import { StandardCharge } from './StandardCharge'
import { PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'

import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

interface ChargeWrapperSwitchProps {
  currency: CurrencyEnum
  formikProps: FormikProps<PlanFormInput>
  index: number
  initialValuePointer: InputMaybe<PropertiesInput> | undefined
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
  disabled?: boolean
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
}

export const ChargeWrapperSwitch = memo(
  ({
    currency,
    disabled,
    formikProps,
    index,
    initialValuePointer,
    premiumWarningDialogRef,
    propertyCursor,
    valuePointer,
  }: ChargeWrapperSwitchProps) => {
    const localCharge = formikProps.values.charges[index]

    return (
      <MargedWrapper>
        {localCharge.chargeModel === ChargeModelEnum.Standard && (
          <StandardCharge
            chargeIndex={index}
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
            chargeIndex={index}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Graduated && (
          <GraduatedChargeTable
            chargeIndex={index}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.GraduatedPercentage && (
          <GraduatedPercentageChargeTable
            chargeIndex={index}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Percentage && (
          <ChargePercentage
            chargeIndex={index}
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
            chargeIndex={index}
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
