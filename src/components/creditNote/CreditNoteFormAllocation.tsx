import { useStore } from '@tanstack/react-form'

import { CreditNoteActionsLine } from '~/components/creditNote/CreditNoteActionsLine'
import { Alert } from '~/components/designSystem/Alert'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { isZodErrors } from '~/core/form/isZodErrors'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import {
  CREDIT_NOTE_DEFAULT_VALUES,
  PAY_BACK_ERRORS_PATH,
} from '~/pages/createCreditNote/validationSchema'

import { PayBackErrorEnum } from './types'
import { getPayBackFields } from './utils'

export const CREDIT_AMOUNT_INPUT_TEST_ID = 'credit-amount-input'
export const REFUND_AMOUNT_INPUT_TEST_ID = 'refund-amount-input'
export const OFFSET_AMOUNT_INPUT_TEST_ID = 'offset-amount-input'

const firstErrorMessage = (errors: unknown): string | undefined => {
  if (!isZodErrors(errors)) return undefined

  return errors[0]?.message
}

interface CreditNoteFormAllocationExtraProps {
  currency: CurrencyEnum
  maxCreditableAmount: number
  maxRefundableAmount: number
  maxOffsettableAmount: number
  totalTaxIncluded: number
  estimationLoading?: boolean
}

const creditNoteFormAllocationDefaultProps: CreditNoteFormAllocationExtraProps = {
  currency: CurrencyEnum.Usd,
  maxCreditableAmount: 0,
  maxRefundableAmount: 0,
  maxOffsettableAmount: 0,
  totalTaxIncluded: 0,
}

export const CreditNoteFormAllocation = withForm({
  defaultValues: CREDIT_NOTE_DEFAULT_VALUES,
  props: creditNoteFormAllocationDefaultProps,
  render: function CreditNoteFormAllocationRender({
    form,
    currency,
    maxCreditableAmount,
    maxRefundableAmount,
    maxOffsettableAmount,
    totalTaxIncluded,
    estimationLoading,
  }) {
    const { translate } = useInternationalization()

    const maxRefundableAmountFormatted = intlFormatNumber(maxRefundableAmount, { currency })
    const maxCreditableAmountFormatted = intlFormatNumber(maxCreditableAmount, { currency })
    const maxOffsettableAmountFormatted = intlFormatNumber(maxOffsettableAmount, { currency })

    const payBack = useStore(form.store, (state) => state.values.payBack)

    // Validator errors sit directly on `errorMap.onDynamic`, keyed by field path
    const dynamicErrors = useStore(
      form.store,
      (state) => (state.errorMap as { onDynamic?: Record<string, unknown> })?.onDynamic ?? {},
    )

    const { credit, refund, offset } = getPayBackFields(payBack)

    const allocatedSoFar = credit.value + refund.value + offset.value
    const remainingToAllocate = totalTaxIncluded - allocatedSoFar

    const hasPayBackErrors = !!firstErrorMessage(dynamicErrors[PAY_BACK_ERRORS_PATH])

    const allocationCaptionColor = hasPayBackErrors ? 'danger600' : 'grey600'
    const allocationValueColor = hasPayBackErrors ? 'danger600' : 'grey700'

    const getRowError = (
      path: string,
      expectedCode: PayBackErrorEnum,
      message: string,
    ): string | undefined => {
      if (firstErrorMessage(dynamicErrors[path]) !== expectedCode) return undefined

      return message
    }

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
            <Typography variant="caption" color={allocationCaptionColor}>
              {translate('text_1766162940956q60f79xxr11')}
            </Typography>
            {estimationLoading ? (
              <Skeleton variant="text" color="dark" className="w-20" />
            ) : (
              <Typography variant="body" color={allocationValueColor}>
                {intlFormatNumber(allocatedSoFar, { currency })}
              </Typography>
            )}
          </div>
          <div>
            <Typography variant="caption" color={allocationCaptionColor}>
              {translate('text_1766162940956fzxpt25f23k')}
            </Typography>
            {estimationLoading ? (
              <Skeleton variant="text" color="dark" className="w-20" />
            ) : (
              <Typography variant="body" color={allocationValueColor}>
                {intlFormatNumber(remainingToAllocate, { currency })}
              </Typography>
            )}
          </div>
        </div>

        {hasPayBackErrors && (
          <Alert type="danger">
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_1767884759747gd07dh4ihn9')}
            </Typography>
            <Typography color="textSecondary" html={translate('text_637e334680481f653e8caa9d')} />
          </Alert>
        )}

        <div className="flex flex-col gap-4">
          {offset.show && (
            <CreditNoteActionsLine
              form={form}
              details={translate('text_1767883339944hsqsrt3tg8a', {
                max: maxOffsettableAmountFormatted,
              })}
              payBackIndex={offset.index}
              currency={currency}
              label={translate('text_1767883339943r32jn2ioyeu')}
              error={getRowError(
                offset.path,
                PayBackErrorEnum.maxOffset,
                translate('text_1767890728665ukf38vdx6t3', { max: maxOffsettableAmountFormatted }),
              )}
              testId={OFFSET_AMOUNT_INPUT_TEST_ID}
            />
          )}

          {refund.show && (
            <CreditNoteActionsLine
              form={form}
              details={translate('text_17661623560070v25swovor4', {
                max: maxRefundableAmountFormatted,
              })}
              payBackIndex={refund.index}
              currency={currency}
              label={translate('text_17270794543889mcmuhfq70p')}
              error={getRowError(
                refund.path,
                PayBackErrorEnum.maxRefund,
                translate('text_637e23e47a15bf0bd71e0d03', { max: maxRefundableAmountFormatted }),
              )}
              testId={REFUND_AMOUNT_INPUT_TEST_ID}
            />
          )}

          {credit.show && (
            <CreditNoteActionsLine
              form={form}
              details={translate('text_1766162519559r3f2pkqdp79', {
                max: maxCreditableAmountFormatted,
              })}
              payBackIndex={credit.index}
              currency={currency}
              label={translate('text_637d0e720ace4ea09aaf0630')}
              error={getRowError(
                credit.path,
                PayBackErrorEnum.maxCredit,
                translate('text_1738751394771xq525lyxj9k', { max: maxCreditableAmountFormatted }),
              )}
              testId={CREDIT_AMOUNT_INPUT_TEST_ID}
            />
          )}
        </div>
      </div>
    )
  },
})
