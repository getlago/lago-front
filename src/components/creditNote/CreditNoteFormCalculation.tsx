import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { debounce } from 'lodash'
import _get from 'lodash/get'
import { useCallback, useEffect, useMemo } from 'react'
import { array, number, object, string } from 'yup'

import { CreditNoteActions } from '~/components/creditNote/CreditNoteActions'
import { CreditNoteEstimationLine } from '~/components/creditNote/CreditNoteEstimationLine'
import { Alert } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreditNoteItemInput,
  CurrencyEnum,
  InvoiceForCreditNoteFormCalculationFragment,
  InvoicePaymentStatusTypeEnum,
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
  setPayBackValidation: Function
}

export const CreditNoteFormCalculation = ({
  invoice,
  formikProps,
  feeForEstimate,
  hasError,
  setPayBackValidation,
}: CreditNoteFormCalculationProps) => {
  const { translate } = useInternationalization()
  const canOnlyCredit =
    invoice?.paymentStatus !== InvoicePaymentStatusTypeEnum.Succeeded ||
    !!invoice.paymentDisputeLostAt
  const canRefund = !canOnlyCredit

  const currency = invoice?.currency || CurrencyEnum.Usd
  const currencyPrecision = getCurrencyPrecision(currency)
  const isLegacyInvoice = (invoice?.versionNumber || 0) < 3

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
    hasCreditOrCoupon,
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
      hasCreditOrCoupon: (maxCreditableAmountCents || 0) > (maxRefundableAmountCents || 0),
    }
  }, [currency, estimationData?.creditNoteEstimate, estimationError])

  const payBack = formikProps.values.payBack || []

  useEffect(() => {
    if (canOnlyCredit) {
      formikProps.setFieldValue('payBack', [
        {
          value: Number(totalTaxIncluded || 0)?.toFixed(currencyPrecision),
          type: CreditTypeEnum.credit,
        },
      ])
    } else if (payBack.length < 2) {
      formikProps.setFieldValue(
        'payBack.0.value',
        !totalTaxIncluded ? undefined : Number(totalTaxIncluded || 0)?.toFixed(currencyPrecision),
      )
    }

    setPayBackValidation(
      array().of(
        object().shape({
          type: string().required(''),
          value: number()
            .required('')
            .when('type', ([type]) => {
              return type === CreditTypeEnum.refund
                ? number().max(maxRefundableAmount, PayBackErrorEnum.maxRefund)
                : number().max(maxCreditableAmount, PayBackErrorEnum.maxRefund)
            }),
        }),
      ),
    )
    formikProps.setTouched({
      payBack: true,
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTaxIncluded, canOnlyCredit])

  if (!invoice) return null

  const hasCouponLine = Number(invoice?.couponsAmountCents || 0) > 0 && !isLegacyInvoice

  return (
    <div>
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
        <CreditNoteActions
          invoice={invoice}
          formikProps={formikProps}
          hasCreditOrCoupon={hasCreditOrCoupon}
          maxRefundableAmount={maxRefundableAmount}
          totalTaxIncluded={totalTaxIncluded}
          currency={currency}
          estimationLoading={estimationLoading}
          hasError={hasError}
        />
      )}

      {_get(formikProps.errors, 'payBack.0.value') === LagoApiError.DoesNotMatchItemAmounts && (
        <Alert className="mt-6" type="danger">
          {translate('text_637e334680481f653e8caa9d', {
            total: intlFormatNumber(totalTaxIncluded || 0, {
              currency,
            }),
          })}
        </Alert>
      )}
    </div>
  )
}
