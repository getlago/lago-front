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
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { intlFormatNumber, getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { ComboBoxField, ComboBox, AmountInputField } from '~/components/form'
import { Typography, Button, Tooltip, Alert } from '~/components/designSystem'
import { theme } from '~/styles'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

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
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    vatRate
    amountCurrency
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
  const hasFeeError = !!formikProps.errors.fees
  const calculation = useMemo(() => {
    if (hasFeeError) return { totalExcludedVat: undefined, vatAmount: undefined }

    const feeTotal = Object.keys(formikProps?.values.fees || {}).reduce<{
      totalExcludedVat: number
      vatAmount: number
    }>(
      (accSub, subKey) => {
        const subChild = ((formikProps?.values.fees as FeesPerInvoice) || {})[subKey]
        const subValues = Object.keys(subChild?.fees || {}).reduce<{
          totalExcludedVat: number
          vatAmount: number
        }>(
          (accGroup, groupKey) => {
            const child = subChild?.fees[groupKey] as FromFee

            if (typeof child.checked === 'boolean') {
              const childExcludedVat = Number(child.value as number)

              return !child.checked
                ? accGroup
                : (accGroup = {
                    totalExcludedVat: accGroup.totalExcludedVat + childExcludedVat,
                    vatAmount:
                      accGroup.vatAmount + Math.round(childExcludedVat * child.vatRate) / 100,
                  })
            }

            const grouped = (child as unknown as GroupedFee)?.grouped
            const groupedValues = Object.keys(grouped || {}).reduce<{
              totalExcludedVat: number
              vatAmount: number
            }>(
              (accFee, feeKey) => {
                const fee = grouped[feeKey]
                const feeExcludedVat = Number(fee.value)

                return !fee.checked
                  ? accFee
                  : (accFee = {
                      totalExcludedVat: accFee.totalExcludedVat + feeExcludedVat,
                      vatAmount: accFee.vatAmount + Math.round(feeExcludedVat * fee.vatRate) / 100,
                    })
              },
              { totalExcludedVat: 0, vatAmount: 0 }
            )

            return {
              totalExcludedVat: accGroup.totalExcludedVat + groupedValues.totalExcludedVat,
              vatAmount: accGroup.vatAmount + groupedValues.vatAmount,
            }
          },
          { totalExcludedVat: 0, vatAmount: 0 }
        )

        return {
          totalExcludedVat: accSub?.totalExcludedVat + subValues.totalExcludedVat,
          vatAmount: accSub?.vatAmount + subValues.vatAmount,
        }
      },
      { totalExcludedVat: 0, vatAmount: 0 }
    )
    const { value, vatRate } = formikProps.values.addOnFee || {}

    return {
      totalExcludedVat: feeTotal.totalExcludedVat + Number(value || 0),
      vatAmount: feeTotal.vatAmount + Math.round(Number(value || 0) * Number(vatRate || 0)) / 100,
    }
  }, [formikProps?.values.fees, formikProps.values.addOnFee, hasFeeError])

  const { totalExcludedVat, vatAmount } = calculation
  const hasCreditOrCoupon =
    (invoice?.creditableAmountCents || 0) > (invoice?.refundableAmountCents || 0)
  const totalTaxIncluded =
    !!totalExcludedVat && vatAmount !== undefined ? totalExcludedVat + vatAmount : undefined
  const payBack = formikProps.values.payBack || []

  useEffect(() => {
    if (canOnlyCredit) {
      formikProps.setFieldValue('payBack', [
        { value: totalTaxIncluded, type: CreditTypeEnum.credit },
      ])
    } else if (payBack.length < 2) {
      formikProps.setFieldValue('payBack.0.value', !totalTaxIncluded ? undefined : totalTaxIncluded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTaxIncluded, canOnlyCredit])

  if (!invoice) return null

  return (
    <div>
      <CalculationContainer>
        <Line>
          <Typography variant="bodyHl">{translate('text_636bedf292786b19d3398f02')}</Typography>
          <Typography color="grey700">
            {!totalExcludedVat
              ? '-'
              : intlFormatNumber(totalExcludedVat, {
                  currency: invoice?.amountCurrency,
                })}
          </Typography>
        </Line>
        <Line>
          <Typography variant="bodyHl">{translate('text_636bedf292786b19d3398f06')}</Typography>
          <Typography color="grey700">
            {vatAmount === undefined
              ? '-'
              : intlFormatNumber(vatAmount, {
                  currency: invoice?.amountCurrency,
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
                  currency: invoice?.amountCurrency,
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
                    currency: invoice?.amountCurrency,
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
                      value: Number(invoice?.refundableAmountCents || 0),
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
                        deserializeAmount(
                          invoice?.refundableAmountCents || 0,
                          invoice?.amountCurrency
                        ),
                        {
                          currency: invoice?.amountCurrency,
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
                      deserializeAmount(invoice?.refundableAmountCents, invoice?.amountCurrency),
                      {
                        currency: invoice?.amountCurrency,
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
                    currency={invoice?.amountCurrency}
                    formikProps={formikProps}
                    beforeChangeFormatter={['positiveNumber']}
                    displayErrorText={false}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {getCurrencySymbol(invoice?.amountCurrency)}
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
                      currency: invoice?.amountCurrency,
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
                          deserializeAmount(
                            invoice?.refundableAmountCents || 0,
                            invoice?.amountCurrency
                          ),
                          {
                            currency: invoice?.amountCurrency,
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
                    deserializeAmount(invoice?.refundableAmountCents || 0, invoice?.amountCurrency),
                    {
                      currency: invoice?.amountCurrency,
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
                  currency={invoice?.amountCurrency}
                  formikProps={formikProps}
                  beforeChangeFormatter={['positiveNumber']}
                  displayErrorText={false}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {getCurrencySymbol(invoice?.amountCurrency)}
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
              currency: invoice?.amountCurrency,
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
