import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { useEffect, useMemo } from 'react'
import styled, { css } from 'styled-components'

import { Alert, Button, Icon, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  CreditNoteFormFragment,
  CurrencyEnum,
  InvoicePaymentStatusTypeEnum,
  LagoApiError,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { CreditNoteForm, CreditTypeEnum, PayBackErrorEnum } from './types'
import { creditNoteFormCalculationCalculation } from './utils'

gql`
  fragment CreditNoteForm on Invoice {
    id
    couponsAmountCents
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    feesAmountCents
    currency
    versionNumber
    fees {
      id
      appliedTaxes {
        id
        tax {
          id
          name
          rate
        }
      }
    }
  }
`

interface CreditNoteFormCalculationProps {
  invoice?: CreditNoteFormFragment
  formikProps: FormikProps<Partial<CreditNoteForm>>
}

export const CreditNoteFormCalculation = ({
  invoice,
  formikProps,
}: CreditNoteFormCalculationProps) => {
  const { translate } = useInternationalization()
  const canOnlyCredit = invoice?.paymentStatus !== InvoicePaymentStatusTypeEnum.Succeeded
  const hasFeeError = !!formikProps.errors.fees || !!formikProps.errors.addOnFee
  const currency = invoice?.currency || CurrencyEnum.Usd
  const currencyPrecision = getCurrencyPrecision(currency)
  const isLegacyInvoice = (invoice?.versionNumber || 0) < 3

  const { totalExcludedTax, taxes, proRatedCouponAmount } = useMemo(
    () =>
      creditNoteFormCalculationCalculation({
        hasFeeError,
        isLegacyInvoice,
        addOnFee: formikProps.values.addOnFee,
        couponsAmountCents: invoice?.couponsAmountCents,
        fees: formikProps.values.fees,
        feesAmountCents: invoice?.feesAmountCents,
      }),
    [
      formikProps.values.addOnFee,
      formikProps.values.fees,
      hasFeeError,
      invoice?.couponsAmountCents,
      invoice?.feesAmountCents,
      isLegacyInvoice,
    ]
  )
  const totalTaxAmount = taxes?.size
    ? Array.from(taxes.values()).reduce((acc, tax) => acc + tax.amount, 0)
    : 0

  const hasCreditOrCoupon =
    (invoice?.creditableAmountCents || 0) > (invoice?.refundableAmountCents || 0)
  const totalTaxIncluded =
    !!totalExcludedTax && totalTaxAmount !== undefined
      ? Number(totalExcludedTax + totalTaxAmount || 0)
      : undefined
  const payBack = formikProps.values.payBack || []

  useEffect(() => {
    if (canOnlyCredit) {
      formikProps.setFieldValue('payBack', [
        { value: totalTaxIncluded?.toFixed(currencyPrecision), type: CreditTypeEnum.credit },
      ])
    } else if (payBack.length < 2) {
      formikProps.setFieldValue(
        'payBack.0.value',
        !totalTaxIncluded ? undefined : totalTaxIncluded?.toFixed(currencyPrecision)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTaxIncluded, canOnlyCredit])

  if (!invoice) return null

  return (
    <div>
      <CalculationContainer>
        {Number(invoice?.couponsAmountCents || 0) > 0 && !isLegacyInvoice && (
          <Line>
            <InlineLabel>
              <Typography variant="bodyHl">{translate('text_644b9f17623605a945cafdbb')}</Typography>
              <Tooltip placement="top-start" title={translate('text_644b9f17623605a945cafdb9')}>
                <Icon name="info-circle" />
              </Tooltip>
            </InlineLabel>
            <Typography color="grey700" data-test="prorated-coupon-amount">
              -
              {intlFormatNumber(proRatedCouponAmount || 0, {
                currency,
              })}
            </Typography>
          </Line>
        )}
        <Line>
          <Typography variant="bodyHl">{translate('text_636bedf292786b19d3398f02')}</Typography>
          <Typography color="grey700" data-test="total-excluded-tax">
            {!totalExcludedTax
              ? '-'
              : intlFormatNumber(totalExcludedTax, {
                  currency,
                })}
          </Typography>
        </Line>
        {!totalExcludedTax ? (
          <Line>
            <Typography variant="bodyHl">{translate('text_636bedf292786b19d3398f06')}</Typography>
            <Typography color="grey700">-</Typography>
          </Line>
        ) : !!taxes?.size ? (
          Array.from(taxes.values())
            .sort((a, b) => b.taxRate - a.taxRate)
            .map((tax) => (
              <Line key={tax.label}>
                <Typography variant="bodyHl">{tax.label}</Typography>
                <Typography color="grey700" data-test={`tax-${tax.taxRate}-amount`}>
                  {intlFormatNumber(tax.amount, {
                    currency,
                  })}
                </Typography>
              </Line>
            ))
        ) : (
          <Line>
            <Typography variant="bodyHl">{`${translate(
              'text_636bedf292786b19d3398f06'
            )} (0%)`}</Typography>
            <Typography color="grey700">
              {intlFormatNumber(0, {
                currency,
              })}
            </Typography>
          </Line>
        )}
        <Line>
          <Typography variant="bodyHl" color="grey700">
            {translate('text_636bedf292786b19d3398f0a')}
          </Typography>
          <Typography color="grey700" data-test="total-tax-included">
            {!totalTaxIncluded
              ? '-'
              : intlFormatNumber(totalTaxIncluded, {
                  currency,
                })}
          </Typography>
        </Line>
        {canOnlyCredit && (
          <Line>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_636bedf292786b19d3398f0e')}
            </Typography>
            <Typography color="grey700">
              {totalTaxIncluded === undefined
                ? '-'
                : intlFormatNumber(totalTaxIncluded, {
                    currency,
                  })}
            </Typography>
          </Line>
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
                            Number(invoice?.refundableAmountCents || 0)
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
                        }
                      ),
                    }
                  ),
                },
              ]}
            />
            {payBack.length > 1 ? (
              <>
                <Tooltip
                  title={translate('text_637e23e47a15bf0bd71e0d03', {
                    max: intlFormatNumber(
                      deserializeAmount(invoice?.refundableAmountCents, currency),
                      {
                        currency,
                      }
                    ),
                  })}
                  placement="top-end"
                  disableHoverListener={
                    _get(formikProps.errors, 'payBack.0.value') !== PayBackErrorEnum.maxRefund
                  }
                >
                  <StyledTextInput
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
                {!totalTaxIncluded
                  ? '-'
                  : intlFormatNumber(payBack[0]?.value || 0, {
                      currency,
                    })}
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
                          }
                        ),
                      }
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
                    }
                  ),
                })}
                placement="top-end"
                disableHoverListener={
                  _get(formikProps.errors, 'payBack.1.value') !== PayBackErrorEnum.maxRefund
                }
              >
                <StyledTextInput
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
        <StyledAlert type="danger">
          {translate('text_637e334680481f653e8caa9d', {
            total: intlFormatNumber(totalTaxIncluded || 0, {
              currency,
            }),
          })}
        </StyledAlert>
      )}
    </div>
  )
}

const Line = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

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

const StyledTextInput = styled(AmountInputField)`
  max-width: 152px;

  input {
    text-align: right;
  }
`

const StyledAlert = styled(Alert)`
  margin-top: ${theme.spacing(6)};
`

const InlineLabel = styled.div`
  display: flex;
  align-items: center;

  > *:last-child {
    margin-left: ${theme.spacing(2)};
    height: 16px;
  }
`
