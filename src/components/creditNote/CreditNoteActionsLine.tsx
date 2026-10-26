import InputAdornment from '@mui/material/InputAdornment'

import { Typography } from '~/components/designSystem/Typography'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { withForm } from '~/hooks/forms/useAppform'
import { CREDIT_NOTE_DEFAULT_VALUES } from '~/pages/createCreditNote/validationSchema'

interface CreditNoteActionsLineExtraProps {
  details: string
  label: string
  currency: CurrencyEnum
  payBackIndex: number
  error?: string
  disabled?: boolean
  testId?: string
}

const creditNoteActionsLineDefaultProps: CreditNoteActionsLineExtraProps = {
  details: '',
  label: '',
  currency: CurrencyEnum.Usd,
  payBackIndex: 0,
}

export const CreditNoteActionsLine = withForm({
  defaultValues: CREDIT_NOTE_DEFAULT_VALUES,
  props: creditNoteActionsLineDefaultProps,
  render: function CreditNoteActionsLineRender({
    form,
    details,
    label,
    currency,
    payBackIndex,
    error,
    disabled,
    testId = '',
  }) {
    const currencySymbol = getCurrencySymbol(currency)

    return (
      <form.AppField name={`payBack[${payBackIndex}].value`}>
        {(field) => {
          const hasError = field.state.meta.errors.length > 0

          return (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="bodyHl" color="grey700">
                    {label}
                  </Typography>
                  {details && (
                    <Typography variant="caption" color="grey600">
                      {details}
                    </Typography>
                  )}
                </div>

                <field.AmountInputField
                  currency={currency}
                  className="max-w-42"
                  beforeChangeFormatter={['positiveNumber']}
                  errorOverride={hasError}
                  disabled={disabled}
                  inputProps={{ style: { textAlign: 'right' } }}
                  InputProps={
                    currency
                      ? {
                          startAdornment: (
                            <InputAdornment position="start">{currencySymbol}</InputAdornment>
                          ),
                        }
                      : {}
                  }
                  data-test={testId}
                />
              </div>
              {hasError && (
                <Typography variant="caption" color="danger600" className="mt-1 text-right">
                  {error}
                </Typography>
              )}
            </div>
          )
        }}
      </form.AppField>
    )
  },
})
