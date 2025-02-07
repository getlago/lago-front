import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { debounce } from 'lodash'
import _get from 'lodash/get'
import { useCallback, useEffect, useMemo } from 'react'
import styled, { css } from 'styled-components'
import { array, number, object, string } from 'yup'

import { CreditNoteEstimationLine } from '~/components/creditNote/CreditNoteEstimationLine'
import { Alert, Button, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
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
import { theme } from '~/styles'

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
    maxCreditableAmountCents,
    maxRefundableAmountCents,
    proRatedCouponAmount,
    taxes,
    totalExcludedTax,
    totalTaxIncluded,
  } = useMemo(() => {
    const isError =
      estimationError ||
      estimationData?.creditNoteEstimate === null ||
      estimationData?.creditNoteEstimate === undefined

    return {
      maxCreditableAmountCents: estimationData?.creditNoteEstimate.maxCreditableAmountCents || 0,
      maxRefundableAmountCents: estimationData?.creditNoteEstimate.maxRefundableAmountCents || 0,
      totalTaxIncluded: isError
        ? 0
        : deserializeAmount(
            estimationData?.creditNoteEstimate?.subTotalExcludingTaxesAmountCents || 0,
            currency,
          ) + deserializeAmount(estimationData?.creditNoteEstimate.taxesAmountCents || 0, currency),
      proRatedCouponAmount: isError
        ? 0
        : deserializeAmount(
            estimationData?.creditNoteEstimate?.couponsAdjustmentAmountCents || 0,
            currency,
          ),
      totalExcludedTax: isError
        ? 0
        : deserializeAmount(
            estimationData?.creditNoteEstimate?.subTotalExcludingTaxesAmountCents || 0,
            currency,
          ),
      taxes: isError
        ? new Map()
        : new Map(
            estimationData?.creditNoteEstimate?.appliedTaxes?.map((tax) => [
              tax.taxCode,
              {
                label: tax.taxName,
                taxRate: tax.taxRate,
                amount: deserializeAmount(tax.amountCents || 0, currency),
              },
            ]),
          ),
      hasCreditOrCoupon: isError
        ? false
        : (estimationData?.creditNoteEstimate?.maxCreditableAmountCents || 0) >
          (estimationData?.creditNoteEstimate?.maxRefundableAmountCents || 0),
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
                ? number().max(
                    deserializeAmount(maxRefundableAmountCents, currency) || 0,
                    PayBackErrorEnum.maxRefund,
                  )
                : number().max(
                    deserializeAmount(maxCreditableAmountCents, currency) || 0,
                    PayBackErrorEnum.maxRefund,
                  )
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
      <CalculationContainer>
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
      </CalculationContainer>
      {!canOnlyCredit && (
        <PayBackBlock>
          <PayBackLine $multiline={payBack.length > 1}>
            <ComboBox
              name="payBack.0.type"
              value={payBack[0]?.type}
              onChange={(value) => {
                if (value === CreditTypeEnum.refund && hasCreditOrCoupon) {
                  formikProps.setFieldValue('payBack', [
                    {
                      type: value,
                      value: Number(invoice?.refundableAmountCents || 0) / 100,
                    },
                    {
                      type: CreditTypeEnum.credit,
                      value:
                        Math.round(
                          (totalTaxIncluded || 0) * 100 -
                            Number(invoice?.refundableAmountCents || 0),
                        ) / 100,
                    },
                  ])
                } else {
                  formikProps.setFieldValue('payBack.0.type', value)
                }
              }}
              placeholder={translate('text_637d0e628762bd8fc95f045d')}
              data={[
                {
                  value: CreditTypeEnum?.credit,
                  label: translate('text_637d0e720ace4ea09aaf0630'),
                  disabled: payBack[1]?.type === CreditTypeEnum.credit,
                },
                {
                  value: CreditTypeEnum?.refund,
                  disabled: payBack[1]?.type === CreditTypeEnum.refund,
                  label: translate(
                    hasCreditOrCoupon
                      ? 'text_637d10c83077eff6e8c79cd0'
                      : 'text_637d0e6d94c87b04785fc6d2',
                    {
                      max: intlFormatNumber(
                        deserializeAmount(invoice?.refundableAmountCents || 0, currency),
                        {
                          currency,
                        },
                      ),
                    },
                  ),
                },
              ]}
            />
            {payBack.length > 1 ? (
              <>
                <Tooltip
                  title={translate('text_637e23e47a15bf0bd71e0d03', {
                    max: intlFormatNumber(deserializeAmount(maxRefundableAmountCents, currency), {
                      currency,
                    }),
                  })}
                  placement="top-end"
                  disableHoverListener={
                    _get(formikProps.errors, 'payBack.0.value') !== PayBackErrorEnum.maxRefund
                  }
                >
                  <AmountInputField
                    className="max-w-38 [&_input]:text-right"
                    name="payBack.0.value"
                    currency={currency}
                    formikProps={formikProps}
                    beforeChangeFormatter={['positiveNumber']}
                    displayErrorText={false}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {getCurrencySymbol(currency)}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Tooltip>
                <Tooltip title={translate('text_637d2e7e5af40c52246b1a12')} placement="top-end">
                  <Button
                    icon="trash"
                    variant="quaternary"
                    size="small"
                    onClick={() =>
                      formikProps.setFieldValue('payBack', [
                        { type: payBack[1].type, value: totalTaxIncluded },
                      ])
                    }
                  />
                </Tooltip>
              </>
            ) : (
              <Typography color="grey700">
                {estimationLoading ? (
                  <Skeleton variant="text" className="w-22" />
                ) : !payBack[0]?.value || hasError ? (
                  '-'
                ) : (
                  intlFormatNumber(payBack[0]?.value || 0, {
                    currency,
                  })
                )}
              </Typography>
            )}
          </PayBackLine>

          {payBack.length < 2 ? (
            <Button
              variant="quaternary"
              startIcon="plus"
              onClick={() => {
                formikProps.setFieldValue('payBack.1', {
                  type: payBack[0]?.type
                    ? payBack[0]?.type === CreditTypeEnum.credit
                      ? CreditTypeEnum.refund
                      : CreditTypeEnum.credit
                    : undefined,
                  value:
                    payBack[0]?.value && (totalTaxIncluded || 0) - payBack[0]?.value
                      ? (totalTaxIncluded || 0) - payBack[0]?.value
                      : undefined,
                })
              }}
            >
              {translate('text_637d0e9729bcc6bb0cb77141')}
            </Button>
          ) : (
            <PayBackLine $multiline>
              <ComboBoxField
                name="payBack.1.type"
                formikProps={formikProps}
                placeholder={translate('text_637d0e628762bd8fc95f045d')}
                data={[
                  {
                    value: CreditTypeEnum?.credit,
                    label: translate('text_637d0e720ace4ea09aaf0630'),
                    disabled: payBack[0]?.type === CreditTypeEnum.credit,
                  },
                  {
                    value: CreditTypeEnum?.refund,
                    disabled: payBack[0]?.type === CreditTypeEnum.refund,
                    label: translate(
                      hasCreditOrCoupon
                        ? 'text_637d10c83077eff6e8c79cd0'
                        : 'text_637d0e6d94c87b04785fc6d2',
                      {
                        max: intlFormatNumber(
                          deserializeAmount(invoice?.refundableAmountCents || 0, currency),
                          {
                            currency,
                          },
                        ),
                      },
                    ),
                  },
                ]}
              />
              <Tooltip
                title={translate('text_637e23e47a15bf0bd71e0d03', {
                  max: intlFormatNumber(
                    deserializeAmount(invoice?.refundableAmountCents || 0, currency),
                    {
                      currency,
                    },
                  ),
                })}
                placement="top-end"
                disableHoverListener={
                  _get(formikProps.errors, 'payBack.1.value') !== PayBackErrorEnum.maxRefund
                }
              >
                <AmountInputField
                  className="max-w-38 [&_input]:text-right"
                  name="payBack.1.value"
                  currency={currency}
                  formikProps={formikProps}
                  beforeChangeFormatter={['positiveNumber']}
                  displayErrorText={false}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {getCurrencySymbol(currency)}
                      </InputAdornment>
                    ),
                  }}
                />
              </Tooltip>
              <Tooltip title={translate('text_637d2e7e5af40c52246b1a12')} placement="top-end">
                <Button
                  icon="trash"
                  variant="quaternary"
                  size="small"
                  onClick={() => {
                    formikProps.setFieldValue('payBack', [
                      { type: payBack[0].type, value: totalTaxIncluded },
                    ])
                  }}
                />
              </Tooltip>
            </PayBackLine>
          )}
        </PayBackBlock>
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

const CalculationContainer = styled.div`
  max-width: 400px;
  margin-left: auto;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`

const PayBackLine = styled.div<{ $multiline?: boolean }>`
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(3)};
  }

  > *:first-child {
    flex: 1;
    max-width: 456px;
  }

  ${({ $multiline }) =>
    !$multiline &&
    css`
      > *:last-child {
        margin-left: auto;
      }
    `}
`

const PayBackBlock = styled.div`
  margin-top: ${theme.spacing(6)};

  > *:first-child {
    margin-bottom: ${theme.spacing(6)};
  }
`
