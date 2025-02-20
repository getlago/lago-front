import { gql } from '@apollo/client'
import { FormikProps, getIn } from 'formik'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo } from 'react'
import { array, number, object, Schema, string, ValidationError } from 'yup'

import { CreditNoteActionsLine } from '~/components/creditNote/CreditNoteActionsLine'
import { CreditNoteEstimationLine } from '~/components/creditNote/CreditNoteEstimationLine'
import { Alert, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreditNoteItemInput,
  CurrencyEnum,
  InvoiceForCreditNoteFormCalculationFragment,
  LagoApiError,
  useCreditNoteEstimateLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'

import { CreditNoteForm, CreditTypeEnum, PayBackErrorEnum } from './types'

gql`
  fragment InvoiceForCreditNoteFormCalculation on Invoice {
    id
    couponsAmountCents
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    feesAmountCents
    currency
    versionNumber
    paymentDisputeLostAt
    totalPaidAmountCents
    fees {
      id
      appliedTaxes {
        id
        taxName
        taxRate
      }
    }
  }

  query creditNoteEstimate($invoiceId: ID!, $items: [CreditNoteItemInput!]!) {
    creditNoteEstimate(invoiceId: $invoiceId, items: $items) {
      appliedTaxes {
        taxCode
        taxName
        taxRate
        amountCents
      }
      couponsAdjustmentAmountCents
      currency
      items {
        amountCents
        fee {
          id
        }
      }
      maxCreditableAmountCents
      maxRefundableAmountCents
      subTotalExcludingTaxesAmountCents
      taxesAmountCents
      taxesRate
    }
  }
`

interface CreditNoteFormCalculationProps {
  invoice?: InvoiceForCreditNoteFormCalculationFragment
  formikProps: FormikProps<Partial<CreditNoteForm>>
  feeForEstimate: CreditNoteItemInput[] | undefined
  hasError: boolean
  setPayBackValidation: (value: Schema) => void
}

export const CreditNoteFormCalculation = ({
  invoice,
  formikProps,
  feeForEstimate,
  hasError,
  setPayBackValidation,
}: CreditNoteFormCalculationProps) => {
  const { translate } = useInternationalization()

  const hasNoPayment = Number(invoice?.totalPaidAmountCents) === 0
  const canOnlyCredit = hasNoPayment || !!invoice?.paymentDisputeLostAt
  const canRefund = !canOnlyCredit

  const currency = invoice?.currency || CurrencyEnum.Usd
  const currencyPrecision = getCurrencyPrecision(currency)
  const isLegacyInvoice = (invoice?.versionNumber || 0) < 3
  const hasCouponLine = Number(invoice?.couponsAmountCents || 0) > 0 && !isLegacyInvoice

  const [
    getEstimate,
    { data: estimationData, error: estimationError, loading: estimationLoading },
  ] = useCreditNoteEstimateLazyQuery()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedQuery = useCallback(
    // We want to delay the query execution, to prevent sending a query on every key down
    debounce(() => {
      getEstimate &&
        invoice?.id &&
        feeForEstimate &&
        getEstimate({
          variables: {
            invoiceId: invoice?.id,
            items: feeForEstimate,
          },
        })
    }, DEBOUNCE_SEARCH_MS),
    [invoice?.id, feeForEstimate, getEstimate],
  )

  useEffect(() => {
    debouncedQuery()

    return () => {
      debouncedQuery.cancel()
    }
  }, [getEstimate, debouncedQuery, feeForEstimate, formikProps.values.fees, invoice?.id])

  const {
    maxCreditableAmount,
    maxRefundableAmount,
    proRatedCouponAmount,
    taxes,
    totalExcludedTax,
    totalTaxIncluded,
  } = useMemo(() => {
    const isError =
      estimationError ||
      estimationData?.creditNoteEstimate === null ||
      estimationData?.creditNoteEstimate === undefined

    if (isError) {
      return {
        maxCreditableAmount: 0,
        maxRefundableAmount: 0,
        totalTaxIncluded: 0,
        proRatedCouponAmount: 0,
        totalExcludedTax: 0,
        taxes: new Map(),
        hasCreditOrCoupon: false,
      }
    }

    const {
      maxCreditableAmountCents,
      maxRefundableAmountCents,
      subTotalExcludingTaxesAmountCents,
      taxesAmountCents,
      couponsAdjustmentAmountCents,
      appliedTaxes,
    } = estimationData?.creditNoteEstimate || {}

    return {
      maxCreditableAmount: deserializeAmount(maxCreditableAmountCents || 0, currency),
      maxRefundableAmount: deserializeAmount(maxRefundableAmountCents || 0, currency),
      totalTaxIncluded:
        deserializeAmount(subTotalExcludingTaxesAmountCents || 0, currency) +
        deserializeAmount(taxesAmountCents || 0, currency),
      proRatedCouponAmount: deserializeAmount(couponsAdjustmentAmountCents || 0, currency),
      totalExcludedTax: deserializeAmount(subTotalExcludingTaxesAmountCents || 0, currency),
      taxes: new Map(
        appliedTaxes.map((tax) => [
          tax.taxCode,
          {
            label: tax.taxName,
            taxRate: tax.taxRate,
            amount: deserializeAmount(tax.amountCents || 0, currency),
          },
        ]),
      ),
    }
  }, [currency, estimationData?.creditNoteEstimate, estimationError])

  useEffect(() => {
    // Set the default values for credit payback fields
    formikProps.setFieldValue('payBack.0.type', CreditTypeEnum.credit)
    formikProps.setFieldValue('payBack.0.value', undefined)

    // Initialize the refund field if possible
    if (canRefund) {
      formikProps.setFieldValue('payBack.1.type', CreditTypeEnum.refund)
      formikProps.setFieldValue('payBack.1.value', undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    formikProps.setFieldValue(
      'payBack.0.value',
      !totalTaxIncluded ? undefined : Number(totalTaxIncluded || 0)?.toFixed(currencyPrecision),
    )

    if (canRefund) {
      formikProps.setFieldValue('payBack.1.value', undefined)
    }

    setPayBackValidation(
      array()
        .of(
          object().shape({
            type: string().required(''),
            value: number(),
          }),
        )
        .test({
          test: (payback, { createError }) => {
            if (canRefund) {
              const credit = payback?.[0]?.value ?? 0
              const refund = payback?.[1]?.value ?? 0
              const errors: ValidationError[] = []

              // Check if the sum of credit and refund is different than the total tax included
              const sum = credit + refund
              const sumPrecision = Number(sum.toFixed(currencyPrecision))
              const totalPrecision = Number(totalTaxIncluded.toFixed(currencyPrecision))

              if (sumPrecision !== totalPrecision) {
                errors.push(
                  createError({
                    message: PayBackErrorEnum.maxTotalInvoice,
                    path: 'payBackErrors',
                  }),
                )
              }
              // Check if refund is greater than the max refundable amount
              if (refund > maxRefundableAmount) {
                errors.push(
                  createError({
                    message: PayBackErrorEnum.maxRefund,
                    path: 'payBack.1.value',
                  }),
                )
              }
              // Check if credit is greater than the max creditable amount
              if (credit > maxCreditableAmount) {
                errors.push(
                  createError({
                    message: PayBackErrorEnum.maxCredit,
                    path: 'payBack.0.value',
                  }),
                )
              }

              return errors.length ? new ValidationError(errors) : true
            }

            return true
          },
        }),
    )

    formikProps.setTouched({ payBack: true })
  }, [totalTaxIncluded])

  if (!invoice) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="ml-auto flex w-full max-w-100 flex-col gap-3">
        {hasCouponLine && (
          <CreditNoteEstimationLine
            label={translate('text_644b9f17623605a945cafdbb')}
            value={
              !proRatedCouponAmount || hasError
                ? '-'
                : `-${intlFormatNumber(proRatedCouponAmount || 0, {
                    currency,
                  })}`
            }
            loading={estimationLoading}
            labelColor="grey600"
            tooltipContent={translate('text_644b9f17623605a945cafdb9')}
          />
        )}

        <CreditNoteEstimationLine
          label={translate('text_636bedf292786b19d3398f02')}
          labelColor="grey600"
          loading={estimationLoading}
          value={
            !totalExcludedTax || hasError
              ? '-'
              : intlFormatNumber(totalExcludedTax, {
                  currency,
                })
          }
        />

        {!totalExcludedTax && (
          <CreditNoteEstimationLine
            label={translate('text_636bedf292786b19d3398f06')}
            labelColor="grey600"
            value={'-'}
            loading={estimationLoading}
          />
        )}

        {totalExcludedTax && !!taxes?.size ? (
          Array.from(taxes.values())
            .sort((a, b) => b.taxRate - a.taxRate)
            .map((tax) => (
              <CreditNoteEstimationLine
                key={tax.label}
                label={`${tax.label} (${tax.taxRate}%)`}
                labelColor="grey600"
                value={
                  !tax.amount || hasError
                    ? '-'
                    : intlFormatNumber(tax.amount, {
                        currency,
                      })
                }
                loading={estimationLoading}
                data-test={`tax-${tax.taxRate}-amount`}
              />
            ))
        ) : (
          <CreditNoteEstimationLine
            label={`${translate('text_636bedf292786b19d3398f06')} (0%)`}
            labelColor="grey600"
            value={
              hasError
                ? '-'
                : intlFormatNumber(0, {
                    currency,
                  })
            }
            loading={estimationLoading}
          />
        )}

        <CreditNoteEstimationLine
          label={translate('text_636bedf292786b19d3398f0a')}
          loading={estimationLoading}
          value={
            !totalTaxIncluded || hasError
              ? '-'
              : intlFormatNumber(totalTaxIncluded, {
                  currency,
                })
          }
        />

        {canOnlyCredit && (
          <CreditNoteEstimationLine
            label={translate('text_636bedf292786b19d3398f0e')}
            loading={estimationLoading}
            value={
              totalTaxIncluded === undefined || hasError
                ? '-'
                : intlFormatNumber(totalTaxIncluded, {
                    currency,
                  })
            }
          />
        )}
      </div>

      {canRefund && (
        <div className="flex flex-col gap-4">
          <CreditNoteActionsLine
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
                    max: intlFormatNumber(maxCreditableAmount, { currency }),
                  })
                : undefined
            }
          />
          <CreditNoteActionsLine
            formikProps={formikProps}
            name="payBack.1.value"
            currency={currency}
            label={translate('text_637d10c83077eff6e8c79cd0', {
              max: intlFormatNumber(maxRefundableAmount, { currency }),
            })}
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
        </div>
      )}

      {getIn(formikProps.errors, 'payBackErrors') && (
        <Alert type="danger">
          <Typography
            color="textSecondary"
            {...((getIn(formikProps.errors, 'payBackErrors') === PayBackErrorEnum.maxTotalInvoice ||
              getIn(formikProps.errors, 'payBack.0.value') ===
                LagoApiError.DoesNotMatchItemAmounts) && {
              html: translate('text_637e334680481f653e8caa9d', {
                total: intlFormatNumber(totalTaxIncluded || 0, { currency }),
              }),
            })}
          />
        </Alert>
      )}
    </div>
  )
}
