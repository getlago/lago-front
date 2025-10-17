import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useCallback } from 'react'

import { AmountInput } from '~/components/form'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment StandardCharge on Properties {
    amount
    pricingGroupKeys
  }
`

interface StandardChargeProps {
  chargeCursor: ChargeCursor
  chargeIndex: number
  chargePricingUnitShortName: string | undefined
  currency: CurrencyEnum
  disabled?: boolean
  propertyCursor: string
  setFieldValue: FormikProps<PlanFormInput>['setFieldValue']
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const StandardCharge = memo(
  ({
    chargeCursor,
    chargeIndex,
    chargePricingUnitShortName,
    currency,
    disabled,
    propertyCursor,
    setFieldValue,
    valuePointer,
  }: StandardChargeProps) => {
    const { translate } = useInternationalization()

    const handleUpdate = useCallback(
      (name: string, value: string | string[]) => {
        setFieldValue(`${chargeCursor}.${chargeIndex}.${name}`, value)
      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeCursor, chargeIndex],
    )

    return (
      <div className="flex flex-col gap-6">
        <AmountInput
          name={`${propertyCursor}.amount`}
          chargePricingUnitShortName={chargePricingUnitShortName}
          currency={currency}
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
          disabled={disabled}
          label={translate('text_624453d52e945301380e49b6')}
          value={valuePointer?.amount || ''}
          onChange={(value) => handleUpdate(`${propertyCursor}.amount`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {chargePricingUnitShortName || getCurrencySymbol(currency)}
              </InputAdornment>
            ),
          }}
        />

        <PricingGroupKeys
          disabled={disabled}
          handleUpdate={handleUpdate}
          propertyCursor={propertyCursor}
          valuePointer={valuePointer}
        />
      </div>
    )
  },
)

StandardCharge.displayName = 'StandardCharge'
