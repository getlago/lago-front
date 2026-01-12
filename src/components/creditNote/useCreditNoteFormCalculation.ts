import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo } from 'react'
import { array, number, object, Schema, string, ValidationError } from 'yup'

import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreditNoteItemInput,
  CurrencyEnum,
  InvoiceForCreditNoteFormCalculationFragment,
  InvoiceTypeEnum,
  useCreditNoteEstimateLazyQuery,
} from '~/generated/graphql'
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
    invoiceType
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

export interface TaxInfo {
  label: string
  taxRate: number
  amount: number
}

interface UseCreditNoteFormCalculationProps {
  invoice?: InvoiceForCreditNoteFormCalculationFragment
  formikProps: FormikProps<Partial<CreditNoteForm>>
  feeForEstimate: CreditNoteItemInput[] | undefined
  setPayBackValidation: (value: Schema) => void
}

interface UseCreditNoteFormCalculationReturn {
  // Calculated values
  maxCreditableAmount: number
  maxRefundableAmount: number
  proRatedCouponAmount: number
  taxes: Map<string, TaxInfo>
  totalExcludedTax: number
  totalTaxIncluded: number
  // Derived flags
  canOnlyCredit: boolean
  canRefund: boolean
  hasCouponLine: boolean
  // Loading/error state
  estimationLoading: boolean
  // Invoice-derived values
  currency: CurrencyEnum
}

export const useCreditNoteFormCalculation = ({
  invoice,
  formikProps,
  feeForEstimate,
  setPayBackValidation,
}: UseCreditNoteFormCalculationProps): UseCreditNoteFormCalculationReturn => {
  const hasNoPayment = Number(invoice?.totalPaidAmountCents) === 0
  const canOnlyCredit = hasNoPayment || !!invoice?.paymentDisputeLostAt
  const canRefund = !canOnlyCredit
  const isPrepaidCreditsInvoice = invoice?.invoiceType === InvoiceTypeEnum.Credit

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
      totalTaxIncluded: deserializeAmount(
        (Number(subTotalExcludingTaxesAmountCents) || 0) + (Number(taxesAmountCents) || 0),
        currency,
      ),
      proRatedCouponAmount: deserializeAmount(couponsAdjustmentAmountCents || 0, currency),
      totalExcludedTax: deserializeAmount(subTotalExcludingTaxesAmountCents || 0, currency),
      taxes: new Map(
        appliedTaxes?.map((tax) => [
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
    // Skip initialization for prepaid credits invoices
    // They use a different payBack structure managed by CreateCreditNote component
    if (isPrepaidCreditsInvoice) {
      return
    }

    // Set the default values for credit payback fields
    formikProps.setFieldValue('payBack.0.type', CreditTypeEnum.credit)
    formikProps.setFieldValue('payBack.0.value', undefined)

    // Initialize the refund field if possible
    if (canRefund) {
      formikProps.setFieldValue('payBack.1', {
        type: CreditTypeEnum.refund,
        value: undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Skip validation setup for prepaid credits invoices
    // They use a different payBack structure (single refund element)
    // and don't use the estimation API
    if (isPrepaidCreditsInvoice) {
      setPayBackValidation(array())
      return
    }

    formikProps.setFieldValue(
      'payBack.0.value',
      !totalTaxIncluded ? undefined : Number(totalTaxIncluded || 0)?.toFixed(currencyPrecision),
    )

    if (canRefund) {
      formikProps.setFieldValue('payBack.1', {
        type: CreditTypeEnum.refund,
        value: undefined,
      })
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

    // NEVER watch formikProps as a dependency to avoid re-rendering loop: https://github.com/getlago/lago-front/pull/2689
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canRefund,
    currencyPrecision,
    isPrepaidCreditsInvoice,
    maxCreditableAmount,
    maxRefundableAmount,
    setPayBackValidation,
    totalTaxIncluded,
  ])

  return {
    // Calculated values
    maxCreditableAmount,
    maxRefundableAmount,
    proRatedCouponAmount,
    taxes,
    totalExcludedTax,
    totalTaxIncluded,
    // Derived flags
    canOnlyCredit,
    canRefund,
    hasCouponLine,
    // Loading/error state
    estimationLoading,
    // Invoice-derived values
    currency,
  }
}
