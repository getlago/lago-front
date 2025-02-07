import { InputAdornment } from '@mui/material'
import { FC } from 'react'

import { Typography } from '~/components/designSystem'
import { AmountInput } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'

interface CreditNoteActionsLineProps {
  label: string
  currency: CurrencyEnum
  inputName: string
  error?: string
}

export const CreditNoteActionsLine: FC<CreditNoteActionsLineProps> = ({
  label,
  currency,
  inputName,
  error,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Typography variant="bodyHl" color="grey700">
          {label}
        </Typography>

        <AmountInput
          className="max-w-42"
          error={!!error}
          inputProps={{
            style: {
              textAlign: 'right',
            },
          }}
          name={inputName}
          currency={currency}
          beforeChangeFormatter={['positiveNumber']}
          InputProps={
            currency
              ? {
                  startAdornment: (
                    <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>
                  ),
                }
              : {}
          }
        />
      </div>
      {error && (
        <Typography variant="caption" color="danger600" className="mt-1 text-right">
          {error}
        </Typography>
      )}
    </div>
  )
}
