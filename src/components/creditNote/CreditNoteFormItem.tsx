import styled, { css } from 'styled-components'
import _get from 'lodash/get'
import { FormikProps } from 'formik'
import { InputAdornment } from '@mui/material'

import { theme } from '~/styles'
import { CheckboxField, AmountInputField } from '~/components/form'
import { intlFormatNumber, getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum } from '~/generated/graphql'
import { Typography, Tooltip } from '~/components/designSystem'
import { CreditNoteFeeErrorEnum } from '~/components/creditNote/types'
import { deserializeAmount } from '~/core/serializers/serializeAmount'

import { CreditNoteForm } from './types'

interface CreditNoteFormItemProps {
  formikProps: FormikProps<Partial<CreditNoteForm>> // TOSO
  currency: CurrencyEnum
  feeName: string
  formikKey: string
  maxValue: number
  grouped?: boolean
}

export const CreditNoteFormItem = ({
  formikProps,
  grouped = false,
  currency,
  formikKey,
  maxValue,
  feeName,
}: CreditNoteFormItemProps) => {
  const { translate } = useInternationalization()
  const error = _get(formikProps.errors, `${formikKey}.value`)

  return (
    <FeeLine $grouped={grouped}>
      <CheckboxField
        name={`${formikKey}.checked`}
        labelAlignment="center"
        formikProps={formikProps}
        label={
          <Typography color="grey700">
            {feeName}
            <Typography variant="caption">
              {translate('text_636bedf292786b19d3398efc', {
                max: intlFormatNumber(deserializeAmount(maxValue || 0, currency), {
                  currencyDisplay: 'symbol',
                  currency,
                }),
              })}
            </Typography>
          </Typography>
        }
      />
      <Tooltip
        placement="top-end"
        title={
          error === CreditNoteFeeErrorEnum?.minZero
            ? translate('text_6374e868262bab8719eac121', {
                min: intlFormatNumber(0, {
                  currencyDisplay: 'symbol',
                  currency,
                }),
              })
            : translate('text_6374e868262bab8719eac11f', {
                max: intlFormatNumber(deserializeAmount(maxValue || 0, currency), {
                  currencyDisplay: 'symbol',
                  currency,
                }),
              })
        }
        disableHoverListener={!error}
      >
        <StyledAmountField
          name={`${formikKey}.value`}
          currency={currency}
          displayErrorText={false}
          disabled={!_get(formikProps.values, `${formikKey}.checked`)}
          beforeChangeFormatter={['positiveNumber']}
          InputProps={
            currency
              ? {
                  startAdornment: (
                    <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>
                  ),
                }
              : {}
          }
          formikProps={formikProps}
        />
      </Tooltip>
    </FeeLine>
  )
}

const StyledAmountField = styled(AmountInputField)`
  max-width: 168px;
  .MuiOutlinedInput-input {
    text-align: right;
  }
`

const FeeLine = styled.div<{ $grouped?: boolean }>`
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  height: 68px;
  justify-content: space-between;

  ${({ $grouped }) =>
    $grouped &&
    css`
      padding-left: ${theme.spacing(8)};
    `}
`
