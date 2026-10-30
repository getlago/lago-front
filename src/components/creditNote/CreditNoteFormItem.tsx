import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import _get from 'lodash/get'

import { CreditNoteFeeErrorEnum } from '~/components/creditNote/types'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { isZodErrors } from '~/core/form/isZodErrors'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { CREDIT_NOTE_DEFAULT_VALUES } from '~/pages/createCreditNote/validationSchema'

// The three field paths a fee row can sit on; keeping the union (rather than `string`)
// is what lets `form.AppField` resolve `${fieldKey}.checked` and `${fieldKey}.value`.
export type CreditNoteFeeFieldKey =
  `creditFee[${number}]` | `addOnFee[${number}]` | `fees.${string}.fees[${number}]`

interface CreditNoteFormItemExtraProps {
  currency: CurrencyEnum
  feeName: string
  fieldKey: CreditNoteFeeFieldKey
  maxValue: number
  feeSucceededAt?: string
  isReadOnly?: boolean
}

const creditNoteFormItemDefaultProps: CreditNoteFormItemExtraProps = {
  currency: CurrencyEnum.Usd,
  feeName: '',
  fieldKey: 'creditFee[0]',
  maxValue: 0,
}

export const CreditNoteFormItem = withForm({
  defaultValues: CREDIT_NOTE_DEFAULT_VALUES,
  props: creditNoteFormItemDefaultProps,
  render: function CreditNoteFormItemRender({
    form,
    currency,
    fieldKey,
    maxValue,
    feeName,
    feeSucceededAt,
    isReadOnly,
  }) {
    const { translate } = useInternationalization()

    const isChecked = useStore(form.store, (state) =>
      Boolean(_get(state.values, `${fieldKey}.checked`)),
    )

    const formattedMaxValue = intlFormatNumber(deserializeAmount(maxValue || 0, currency), {
      currencyDisplay: 'symbol',
      currency,
    })

    const getErrorTitle = (errors: unknown): string => {
      const isMinZero =
        isZodErrors(errors) &&
        errors.some((error) => error.message === CreditNoteFeeErrorEnum.minZero)

      if (isMinZero) {
        return translate('text_6374e868262bab8719eac121', {
          min: intlFormatNumber(0, { currencyDisplay: 'symbol', currency }),
        })
      }

      return translate('text_6374e868262bab8719eac11f', { max: formattedMaxValue })
    }

    return (
      <div className="flex min-h-17 items-center justify-between gap-8 py-2 shadow-b">
        <form.AppField name={`${fieldKey}.checked`}>
          {(field) => (
            <field.CheckboxField
              label={
                <Typography color="grey700">
                  {feeName}
                  <Typography variant="caption">
                    {feeSucceededAt && `${feeSucceededAt} • `}
                    {translate('text_636bedf292786b19d3398efc', { max: formattedMaxValue })}
                  </Typography>
                </Typography>
              }
            />
          )}
        </form.AppField>

        <form.AppField name={`${fieldKey}.value`}>
          {(field) => {
            const hasError = field.state.meta.errors.length > 0

            return (
              <Tooltip
                className="shrink-0"
                placement="top-end"
                title={getErrorTitle(field.state.meta.errors)}
                disableHoverListener={!hasError}
              >
                <field.AmountInputField
                  className="max-w-42"
                  inputProps={{ style: { textAlign: 'right' } }}
                  currency={currency}
                  displayErrorText={false}
                  disabled={!isChecked || isReadOnly}
                  beforeChangeFormatter={['positiveNumber']}
                  InputProps={
                    currency
                      ? {
                          startAdornment: (
                            <InputAdornment position="start">
                              {getCurrencySymbol(currency)}
                            </InputAdornment>
                          ),
                        }
                      : {}
                  }
                />
              </Tooltip>
            )
          }}
        </form.AppField>
      </div>
    )
  },
})
