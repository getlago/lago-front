import { useMemo, useEffect } from 'react'
import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import styled, { css } from 'styled-components'
import { InputAdornment } from '@mui/material'
import _get from 'lodash/get'

import {
  InvoicePaymentStatusTypeEnum,
  LagoApiError,
  CreditNoteFormFragment,
  CurrencyEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { intlFormatNumber, getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { ComboBoxField, ComboBox, AmountInputField } from '~/components/form'
import { Typography, Button, Tooltip, Alert, Icon } from '~/components/designSystem'
import { theme } from '~/styles'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'

import {
  CreditNoteForm,
  GroupedFee,
  FromFee,
  CreditTypeEnum,
  PayBackErrorEnum,
  FeesPerInvoice,
} from './types'

gql`
  fragment CreditNoteForm on Invoice {
    id
    couponsAmountCents
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    feesAmountCents
    taxesRate
    currency
    versionNumber
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

  // This method calculate the credit notes amounts to display
  // It does parse once all items. If no coupon applied, values are used for display
  // If coupon applied, it will calculate the credit note tax amount based on the coupon value on pro rata of each item
  const calculation = useMemo(() => {
    if (hasFeeError) return { totalExcludedTax: undefined, taxAmount: undefined }

    const feeTotal = Object.keys(formikProps?.values.fees || {}).reduce<{
      totalExcludedTax: number
      taxAmount: number
    }>(
      (accSub, subKey) => {
        const subChild = ((formikProps?.values.fees as FeesPerInvoice) || {})[subKey]
        const subValues = Object.keys(subChild?.fees || {}).reduce<{
          totalExcludedTax: number
          taxAmount: number
        }>(
          (accGroup, groupKey) => {
            const child = subChild?.fees[groupKey] as FromFee

            if (typeof child.checked === 'boolean') {
              const childExcludedTax = Number(child.value as number)

              return !child.checked
                ? accGroup
                : (accGroup = {
                    totalExcludedTax: accGroup.totalExcludedTax + childExcludedTax,
                    taxAmount:
                      accGroup.taxAmount + Math.round(childExcludedTax * child.taxesRate) / 100,
                  })
            }

            const grouped = (child as unknown as GroupedFee)?.grouped
            const groupedValues = Object.keys(grouped || {}).reduce<{
              totalExcludedTax: number
              taxAmount: number
            }>(
              (accFee, feeKey) => {
                const fee = grouped[feeKey]
                const feeExcludedTax = Number(fee.value)

                return !fee.checked
                  ? accFee
                  : (accFee = {
                      totalExcludedTax: accFee.totalExcludedTax + feeExcludedTax,
                      taxAmount:
                        accFee.taxAmount + Math.round(feeExcludedTax * fee.taxesRate) / 100,
                    })
              },
              { totalExcludedTax: 0, taxAmount: 0 }
            )

            return {
              totalExcludedTax: accGroup.totalExcludedTax + groupedValues.totalExcludedTax,
              taxAmount: accGroup.taxAmount + groupedValues.taxAmount,
            }
          },
          { totalExcludedTax: 0, taxAmount: 0 }
        )

        return {
          totalExcludedTax: accSub?.totalExcludedTax + subValues.totalExcludedTax,
          taxAmount: accSub?.taxAmount + subValues.taxAmount,
        }
      },
      { totalExcludedTax: 0, taxAmount: 0 }
    )

    const { value, taxesRate } = formikProps.values.addOnFee?.reduce(
      (acc, fee) => {
        return {
          value: acc.value + (fee.checked ? Number(fee.value) : 0),
          taxesRate: fee.taxesRate,
        }
      },
      { value: 0, taxesRate: 0 }
    ) || { value: 0, taxesRate: 0 }

    let proRatedCouponAmount = 0
    let totalExcludedTax = feeTotal.totalExcludedTax + Number(value || 0)
    const totalInvoiceFeesCreditableAmountCentsExcludingTax = invoice?.feesAmountCents || 0

    // If no coupon, return "basic" calculation
    if (isLegacyInvoice || totalInvoiceFeesCreditableAmountCentsExcludingTax === 0) {
      return {
        proRatedCouponAmount,
        totalExcludedTax,
        taxAmount:
          feeTotal.taxAmount + Math.round(Number(value || 0) * Number(taxesRate || 0)) / 100,
      }
    }

    const couponsAdjustmentAmountCents = () => {
      return (
        (invoice?.couponsAmountCents / totalInvoiceFeesCreditableAmountCentsExcludingTax) *
        feeTotal.totalExcludedTax
      )
    }

    // Parse fees a second time to calculate pro-rated amounts
    const proRatedTotal = () => {
      return Object.keys(formikProps?.values.fees || {}).reduce<{
        totalExcludedTax: number
        taxAmount: number
      }>(
        (accSub, subKey) => {
          const subChild = ((formikProps?.values.fees as FeesPerInvoice) || {})[subKey]
          const subValues = Object.keys(subChild?.fees || {}).reduce<{
            totalExcludedTax: number
            taxAmount: number
          }>(
            (accGroup, groupKey) => {
              const child = subChild?.fees[groupKey] as FromFee

              if (typeof child.checked === 'boolean') {
                const childExcludedTax = Number(child.value as number)
                let itemRate = Number(child.value) / feeTotal.totalExcludedTax
                let proratedCouponAmount = couponsAdjustmentAmountCents() * itemRate

                return !child.checked
                  ? accGroup
                  : (accGroup = {
                      totalExcludedTax: accGroup.totalExcludedTax + childExcludedTax,
                      taxAmount:
                        accGroup.taxAmount +
                        ((childExcludedTax - proratedCouponAmount) * (child.taxesRate || 0)) / 100,
                    })
              }

              const grouped = (child as unknown as GroupedFee)?.grouped
              const groupedValues = Object.keys(grouped || {}).reduce<{
                totalExcludedTax: number
                taxAmount: number
              }>(
                (accFee, feeKey) => {
                  const fee = grouped[feeKey]
                  const feeExcludedTax = Number(fee.value)
                  let itemRate = Number(fee.value) / feeTotal.totalExcludedTax
                  let proratedCouponAmount = couponsAdjustmentAmountCents() * itemRate

                  return !fee.checked
                    ? accFee
                    : (accFee = {
                        totalExcludedTax: accFee.totalExcludedTax + feeExcludedTax,
                        taxAmount:
                          accFee.taxAmount +
                          ((feeExcludedTax - proratedCouponAmount) * (fee.taxesRate || 0)) / 100,
                      })
                },
                { totalExcludedTax: 0, taxAmount: 0 }
              )

              return {
                totalExcludedTax: accGroup.totalExcludedTax + groupedValues.totalExcludedTax,
                taxAmount: accGroup.taxAmount + groupedValues.taxAmount,
              }
            },
            { totalExcludedTax: 0, taxAmount: 0 }
          )

          return {
            totalExcludedTax: accSub?.totalExcludedTax + subValues.totalExcludedTax,
            taxAmount: accSub?.taxAmount + subValues.taxAmount,
          }
        },
        { totalExcludedTax: 0, taxAmount: 0 }
      )
    }

    // If coupon is applied, we need to pro-rate the coupon amount and the tax amount
    proRatedCouponAmount =
      (Number(invoice?.couponsAmountCents) / totalInvoiceFeesCreditableAmountCentsExcludingTax) *
      feeTotal.totalExcludedTax

    // And deduct the coupon amount from the total excluding Tax
    totalExcludedTax -= proRatedCouponAmount

    const { taxAmount: proRatedTaxAmount } = proRatedTotal()

    return {
      proRatedCouponAmount,
      totalExcludedTax,
      taxAmount: proRatedTaxAmount + Math.round(Number(value || 0) * Number(taxesRate || 0)) / 100,
    }
  }, [
    formikProps?.values.fees,
    formikProps.values.addOnFee,
    hasFeeError,
    invoice?.feesAmountCents,
    invoice?.couponsAmountCents,
    isLegacyInvoice,
  ])

  const { totalExcludedTax, taxAmount, proRatedCouponAmount } = calculation
  const hasCreditOrCoupon =
    (invoice?.creditableAmountCents || 0) > (invoice?.refundableAmountCents || 0)
  const totalTaxIncluded =
    !!totalExcludedTax && taxAmount !== undefined
      ? Number(totalExcludedTax + taxAmount || 0)
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
            <Typography color="grey700">
              -
              {intlFormatNumber(proRatedCouponAmount || 0, {
                currency,
              })}
            </Typography>
          </Line>
        )}
        <Line>
          <Typography variant="bodyHl">{translate('text_636bedf292786b19d3398f02')}</Typography>
          <Typography color="grey700">
            {!totalExcludedTax
              ? '-'
              : intlFormatNumber(totalExcludedTax, {
                  currency,
                })}
          </Typography>
        </Line>
        <Line>
          <Typography variant="bodyHl">{translate('text_636bedf292786b19d3398f06')}</Typography>
          <Typography color="grey700">
            {taxAmount === undefined
              ? '-'
              : intlFormatNumber(taxAmount, {
                  currency,
                })}
          </Typography>
        </Line>
        <Line>
          <Typography variant="bodyHl" color="grey700">
            {translate('text_636bedf292786b19d3398f0a')}
          </Typography>
          <Typography color="grey700">
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
