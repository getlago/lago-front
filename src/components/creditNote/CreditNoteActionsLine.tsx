import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { FC } from 'react'

import { CreditNoteForm } from '~/components/creditNote/types'
import { Typography } from '~/components/designSystem'
import { AmountInputField } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'

interface CreditNoteActionsLineProps {
  label: string
  formikProps: FormikProps<Partial<CreditNoteForm>>
  currency: CurrencyEnum
  name: string
  error?: string
  hasError?: boolean
}

export const CreditNoteActionsLine: FC<CreditNoteActionsLineProps> = ({
  label,
  formikProps,
  currency,
  name,
  hasError,
  error,
}) => {
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div>
      <div className="flex items-center justify-between">
        <Typography variant="bodyHl" color="grey700">
          {label}
        </Typography>

        <AmountInputField
          name={name}
          formikProps={formikProps}
          currency={currency}
          className="max-w-42"
          beforeChangeFormatter={['positiveNumber']}
          error={!!error || hasError}
          inputProps={{ style: { textAlign: 'right' } }}
          InputProps={
            currency && {
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            }
          }
        />
      </div>
      {(!!error || hasError) && (
        <Typography variant="caption" color="danger600" className="mt-1 text-right">
          {error}
        </Typography>
      )}
    </div>
  )
}
