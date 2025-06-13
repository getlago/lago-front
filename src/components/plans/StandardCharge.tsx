import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { memo } from 'react'

import { AmountInput } from '~/components/form'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput, THandleUpdate } from './types'

gql`
  fragment StandardCharge on Properties {
    amount
    pricingGroupKeys
  }
`

interface StandardChargeProps {
  currency: CurrencyEnum
  disabled?: boolean
  handleUpdate: THandleUpdate
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const StandardCharge = memo(
  ({ currency, disabled, handleUpdate, propertyCursor, valuePointer }: StandardChargeProps) => {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-6">
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
