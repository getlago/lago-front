import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { FC } from 'react'
import styled, { css } from 'styled-components'

import { CreditNoteForm, CreditTypeEnum, PayBackErrorEnum } from '~/components/creditNote/types'
import { Button, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, InvoiceForCreditNoteFormCalculationFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

interface CreditNoteActionsProps {
  invoice?: InvoiceForCreditNoteFormCalculationFragment
  formikProps: FormikProps<Partial<CreditNoteForm>>
  hasCreditOrCoupon: boolean
  maxRefundableAmountCents: number
  totalTaxIncluded: number
  currency: CurrencyEnum
  estimationLoading: boolean
  hasError: boolean
}

export const CreditNoteActions: FC<CreditNoteActionsProps> = ({
  invoice,
  formikProps,
  hasCreditOrCoupon,
  maxRefundableAmountCents,
  totalTaxIncluded,
  currency,
  estimationLoading,
  hasError,
}) => {
  const { translate } = useInternationalization()

  const payBack = formikProps.values.payBack || []

  return (
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
                      (totalTaxIncluded || 0) * 100 - Number(invoice?.refundableAmountCents || 0),
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
                    <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>
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
                  <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>
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
  )
}

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
