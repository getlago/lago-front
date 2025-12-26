import { FormikProps, getIn } from 'formik'
import { useMemo } from 'react'

import { CreditNoteActionsLine } from '~/components/creditNote/CreditNoteActionsLine'
import { Alert, Skeleton, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, LagoApiError } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { CreditNoteForm, PayBackErrorEnum } from './types'

interface CreditNoteFormAllocationProps {
  formikProps: FormikProps<Partial<CreditNoteForm>>
  currency: CurrencyEnum
  maxCreditableAmount: number
  maxRefundableAmount: number
  totalTaxIncluded: number
  estimationLoading?: boolean
}

export const CreditNoteFormAllocation = ({
  formikProps,
  currency,
  maxCreditableAmount,
  maxRefundableAmount,
  totalTaxIncluded,
  estimationLoading,
}: CreditNoteFormAllocationProps) => {
  const { translate } = useInternationalization()

  const maxRefundableAmountFormatted = intlFormatNumber(maxRefundableAmount, { currency })
  const maxCreditableAmountFormatted = intlFormatNumber(maxCreditableAmount, { currency })

  const creditValue = Number(getIn(formikProps.values, 'payBack.0.value') || 0)
  const refundValue = Number(getIn(formikProps.values, 'payBack.1.value') || 0)
  const allocatedSoFar = creditValue + refundValue
  const remainingToAllocate = totalTaxIncluded - allocatedSoFar

  const alertTypographyProps = useMemo(() => {
    const payBackErrors = getIn(formikProps.errors, 'payBackErrors')
    const payBackValueError = getIn(formikProps.errors, 'payBack.0.value')

    if (
      payBackErrors === PayBackErrorEnum.maxTotalInvoice ||
      payBackValueError === LagoApiError.DoesNotMatchItemAmounts
    ) {
      return {
        html: translate('text_637e334680481f653e8caa9d', {
          total: intlFormatNumber(totalTaxIncluded || 0, { currency }),
        }),
      }
    }

    return {}
  }, [formikProps.errors, totalTaxIncluded, currency, translate])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography className="mb-2" variant="subhead1" color="grey700">
          {translate('text_1766135526530syun4t00t28')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_1766135526530nw5fnkx9f2x')}
        </Typography>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-xl bg-grey-100 p-4">
        <div>
          <Typography variant="caption" color="grey600">
            {translate('text_637ccf8133d2c9a7d11ce745')}
          </Typography>
          {estimationLoading ? (
            <Skeleton variant="text" color="dark" className="w-20" />
          ) : (
            <Typography variant="body" color="grey700">
              {intlFormatNumber(totalTaxIncluded, { currency })}
            </Typography>
          )}
        </div>
        <div>
          <Typography variant="caption" color="grey600">
            {translate('text_1766162940956q60f79xxr11')}
          </Typography>
          {estimationLoading ? (
            <Skeleton variant="text" color="dark" className="w-20" />
          ) : (
            <Typography variant="body" color="grey700">
              {intlFormatNumber(allocatedSoFar, { currency })}
            </Typography>
          )}
        </div>
        <div>
          <Typography variant="caption" color="grey600">
            {translate('text_1766162940956fzxpt25f23k')}
          </Typography>
          {estimationLoading ? (
            <Skeleton variant="text" color="dark" className="w-20" />
          ) : (
            <Typography variant="body" color="grey700">
              {intlFormatNumber(remainingToAllocate, { currency })}
            </Typography>
          )}
        </div>
      </div>

      {getIn(formikProps.errors, 'payBackErrors') && (
        <Alert type="danger">
          <Typography color="textSecondary" {...alertTypographyProps} />
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <CreditNoteActionsLine
          details={translate('text_17661623560070v25swovor4', {
            max: maxRefundableAmountFormatted,
          })}
          formikProps={formikProps}
          name="payBack.1.value"
          currency={currency}
          label={translate('text_17270794543889mcmuhfq70p')}
          hasError={
            !!getIn(formikProps.errors, 'payBack.1.value') ||
            !!getIn(formikProps.errors, 'payBackErrors')
          }
          error={
            getIn(formikProps.errors, 'payBack.1.value') === PayBackErrorEnum.maxRefund
              ? translate('text_637e23e47a15bf0bd71e0d03', {
                  max: intlFormatNumber(maxRefundableAmount, { currency }),
                })
              : undefined
          }
        />
        <CreditNoteActionsLine
          details={translate('text_1766162519559r3f2pkqdp79', {
            max: maxCreditableAmountFormatted,
          })}
          formikProps={formikProps}
          name="payBack.0.value"
          currency={currency}
          label={translate('text_637d0e720ace4ea09aaf0630')}
          hasError={
            !!getIn(formikProps.errors, 'payBack.0.value') ||
            !!getIn(formikProps.errors, 'payBackErrors')
          }
          error={
            getIn(formikProps.errors, 'payBack.0.value') === PayBackErrorEnum.maxCredit
              ? translate('text_1738751394771xq525lyxj9k', {
                  max: maxCreditableAmountFormatted,
                })
              : undefined
          }
        />
      </div>
    </div>
  )
}
