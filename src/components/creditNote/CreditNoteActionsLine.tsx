import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { FC } from 'react'

import { CreditNoteForm } from '~/components/creditNote/types'
import { Typography } from '~/components/designSystem'
import { AmountInputField } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'

export const CREDIT_AMOUNT_INPUT_TEST_ID = 'credit-amount-input'
export const REFUND_AMOUNT_INPUT_TEST_ID = 'refund-amount-input'

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

  let testId: string | undefined

  if (name === 'payBack.0.value') {
    testId = CREDIT_AMOUNT_INPUT_TEST_ID
  } else if (name === 'payBack.1.value') {
    testId = REFUND_AMOUNT_INPUT_TEST_ID
  }

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
          data-test={testId}
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
