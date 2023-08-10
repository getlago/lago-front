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

type TaxMapType = Map<
  string, // id of the tax
  {
    label: string
    amount: number
    taxRate: number // Used for sorting purpose
  }
>

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
    if (hasFeeError) return { totalExcludedTax: undefined, taxes: new Map() }

    const mergeTaxMaps = (map1: TaxMapType, map2: TaxMapType): TaxMapType => {
      if (!map1.size) return map2
      if (!map2.size) return map1

      // We assume both map1 and map2 are the same length and contain the same keys
      const mergedMap = new Map()

      map1.forEach((_, key) => {
        const previousTax1 = map1.get(key)
        const previousTax2 = map2.get(key)

        if (previousTax1 && previousTax2) {
          mergedMap.set(key, {
            label: previousTax1.label,
            amount: previousTax1.amount + previousTax2.amount,
            taxRate: previousTax1.taxRate,
          })
        }
      })

      return mergedMap
    }

    const updateOrCreateTaxMap = (
      currentTaxesMap: TaxMapType,
      feeAmount?: number,
      feeAppliedTaxes?: { id: string; tax: { id: string; name: string; rate: number } }[]
    ) => {
      if (!feeAppliedTaxes?.length) return currentTaxesMap
      if (!currentTaxesMap) currentTaxesMap = new Map()

      feeAppliedTaxes.forEach((appliedTax) => {
        const { id, name, rate } = appliedTax.tax
        const amount = ((feeAmount || 0) * rate) / 100

        const previousTax = currentTaxesMap?.get(id)

        if (previousTax) {
          previousTax.amount += amount
          currentTaxesMap?.set(id, previousTax)
        } else {
          currentTaxesMap?.set(id, { amount, label: `${name} (${rate}%)`, taxRate: rate })
        }
      })

      return currentTaxesMap
    }

    const feeTotal = Object.keys(formikProps?.values.fees || {}).reduce<{
      totalExcludedTax: number
      taxes: TaxMapType
    }>(
      (accSub, subKey) => {
        const subChild = ((formikProps?.values.fees as FeesPerInvoice) || {})[subKey]
        const subValues = Object.keys(subChild?.fees || {}).reduce<{
          totalExcludedTax: number
          taxes: TaxMapType
        }>(
          (accGroup, groupKey) => {
            const child = subChild?.fees[groupKey] as FromFee

            if (typeof child.checked === 'boolean') {
              const childExcludedTax = Number(child.value as number)

              return !child.checked
                ? accGroup
                : (accGroup = {
                    totalExcludedTax: accGroup.totalExcludedTax + childExcludedTax,
                    taxes: updateOrCreateTaxMap(
                      accGroup.taxes,
                      childExcludedTax,
                      child?.appliedTaxes
                    ),
                  })
            }

            const grouped = (child as unknown as GroupedFee)?.grouped
            const groupedValues = Object.keys(grouped || {}).reduce<{
              totalExcludedTax: number
              taxes: TaxMapType
            }>(
              (accFee, feeKey) => {
                const fee = grouped[feeKey]
                const feeExcludedTax = Number(fee.value)

                return !fee.checked
                  ? accFee
                  : (accFee = {
                      totalExcludedTax: accFee.totalExcludedTax + feeExcludedTax,
                      taxes: updateOrCreateTaxMap(accFee.taxes, feeExcludedTax, fee?.appliedTaxes),
                    })
              },
              { totalExcludedTax: 0, taxes: new Map() }
            )

            return {
              totalExcludedTax: accGroup.totalExcludedTax + groupedValues.totalExcludedTax,
              taxes: mergeTaxMaps(accGroup.taxes, groupedValues.taxes),
            }
          },
          { totalExcludedTax: 0, taxes: new Map() }
        )

        return {
          totalExcludedTax: accSub?.totalExcludedTax + subValues.totalExcludedTax,
          taxes: mergeTaxMaps(accSub?.taxes, subValues.taxes),
        }
      },
      { totalExcludedTax: 0, taxes: new Map() }
    )

    const { value: addOnValue, taxes: addOnTaxes } = formikProps.values.addOnFee?.reduce(
      (acc, fee) => {
        return {
          value: acc.value + (fee.checked ? Number(fee.value) : 0),
          taxes: updateOrCreateTaxMap(
            acc.taxes,
            fee.checked ? Number(fee.value) : 0,
            fee?.appliedTaxes
          ),
        }
      },
      { value: 0, taxes: new Map() }
    ) || { value: 0, taxes: new Map() }

    let proRatedCouponAmount = 0
    let totalExcludedTax = feeTotal.totalExcludedTax + Number(addOnValue || 0)
    const totalInvoiceFeesCreditableAmountCentsExcludingTax = Number(invoice?.feesAmountCents || 0)

    // If legacy invoice or no coupon, return "basic" calculation
    if (isLegacyInvoice || Number(invoice?.couponsAmountCents) === 0) {
      return {
        proRatedCouponAmount,
        totalExcludedTax,
        taxes: mergeTaxMaps(feeTotal.taxes, addOnTaxes),
      }
    }

    const couponsAdjustmentAmountCents = () => {
      return (
        (Number(invoice?.couponsAmountCents) / totalInvoiceFeesCreditableAmountCentsExcludingTax) *
        feeTotal.totalExcludedTax
      )
    }

    // Parse fees a second time to calculate pro-rated amounts
    const proRatedTotal = () => {
      return Object.keys(formikProps?.values.fees || {}).reduce<{
        totalExcludedTax: number
        taxes: TaxMapType
      }>(
        (accSub, subKey) => {
          const subChild = ((formikProps?.values.fees as FeesPerInvoice) || {})[subKey]
          const subValues = Object.keys(subChild?.fees || {}).reduce<{
            totalExcludedTax: number
            taxes: TaxMapType
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
                      taxes: updateOrCreateTaxMap(
                        accGroup.taxes,
                        childExcludedTax - proratedCouponAmount,
                        child?.appliedTaxes
                      ),
                    })
              }

              const grouped = (child as unknown as GroupedFee)?.grouped
              const groupedValues = Object.keys(grouped || {}).reduce<{
                totalExcludedTax: number
                taxes: TaxMapType
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
                        taxes: updateOrCreateTaxMap(
                          accFee.taxes,
                          feeExcludedTax - proratedCouponAmount,
                          fee?.appliedTaxes
                        ),
                      })
                },
                { totalExcludedTax: 0, taxes: new Map() }
              )

              return {
                totalExcludedTax: accGroup.totalExcludedTax + groupedValues.totalExcludedTax,
                taxes: mergeTaxMaps(accGroup.taxes, groupedValues.taxes),
              }
            },
            { totalExcludedTax: 0, taxes: new Map() }
          )

          return {
            totalExcludedTax: accSub?.totalExcludedTax + subValues.totalExcludedTax,
            taxes: mergeTaxMaps(accSub?.taxes, subValues.taxes),
          }
        },
        { totalExcludedTax: 0, taxes: new Map() }
      )
    }

    // If coupon is applied, we need to pro-rate the coupon amount and the tax amount
    proRatedCouponAmount =
      (Number(invoice?.couponsAmountCents) / totalInvoiceFeesCreditableAmountCentsExcludingTax) *
      feeTotal.totalExcludedTax

    // And deduct the coupon amount from the total excluding Tax
    totalExcludedTax -= proRatedCouponAmount

    const { taxes } = proRatedTotal()

    return {
      proRatedCouponAmount,
      totalExcludedTax,
      taxes,
    }
  }, [
    formikProps?.values.fees,
    formikProps.values.addOnFee,
    hasFeeError,
    invoice?.feesAmountCents,
    invoice?.couponsAmountCents,
    isLegacyInvoice,
  ])

  const { totalExcludedTax, taxes, proRatedCouponAmount } = calculation
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
                <Typography color="grey700">
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
