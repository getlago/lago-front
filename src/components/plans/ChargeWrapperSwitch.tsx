import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, RefObject } from 'react'
import styled from 'styled-components'

import { AmountInput } from '~/components/form'
import { ChargePercentage } from '~/components/plans/ChargePercentage'
import { GraduatedChargeTable } from '~/components/plans/GraduatedChargeTable'
import { PackageCharge } from '~/components/plans/PackageCharge'
import { TimebasedCharge } from '~/components/plans/TimebasedCharge'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import {
  ChargeModelEnum,
  CurrencyEnum,
  InputMaybe,
  PropertiesInput,
  TaxForPlanChargeAccordionFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { GraduatedPercentageChargeTable } from './GraduatedPercentageChargeTable'
import { PackageGroupChildCharge } from './PackageGroupChildCharge'
import { PlanFormInput } from './types'
import { VolumeChargeTable } from './VolumeChargeTable'

import { PremiumWarningDialogRef } from '../PremiumWarningDialog'

interface ChargeWrapperSwitchProps {
  propertyCursor: string
  index: number
  valuePointer: InputMaybe<PropertiesInput> | undefined
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  premiumWarningDialogRef?: RefObject<PremiumWarningDialogRef>
  handleUpdate: (
    name: string,
    value: string | boolean | TaxForPlanChargeAccordionFragment[],
  ) => void
}

export const ChargeWrapperSwitch = memo(
  ({
    propertyCursor,
    valuePointer,
    index,
    currency,
    disabled,
    premiumWarningDialogRef,
    handleUpdate,
    formikProps,
  }: ChargeWrapperSwitchProps) => {
    const { translate } = useInternationalization()
    const localCharge = formikProps.values.charges[index]

    return (
      <MargedWrapper>
        {localCharge.chargeModel === ChargeModelEnum.Standard && (
          <AmountInput
            name={`${propertyCursor}.amount`}
            currency={currency}
            beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
            disabled={disabled}
            label={translate('text_624453d52e945301380e49b6')}
            value={valuePointer?.amount || ''}
            onChange={(value) => handleUpdate(`${propertyCursor}.amount`, value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
              ),
            }}
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
        {localCharge.chargeModel === ChargeModelEnum.PackageGroup && (
          <PackageGroupChildCharge
            chargeIndex={index}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
          />
        )}
        {localCharge.chargeModel === ChargeModelEnum.Timebased && (
          <TimebasedCharge
            chargeIndex={index}
            currency={currency}
            disabled={disabled}
            formikProps={formikProps}
            propertyCursor={propertyCursor}
            valuePointer={valuePointer}
            isGroupCharge={!!localCharge.chargeGroupId || !!localCharge.chargeGroup}
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
