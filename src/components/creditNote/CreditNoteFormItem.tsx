import styled, { css } from 'styled-components'
import _get from 'lodash/get'
import { FormikProps } from 'formik'
import { InputAdornment } from '@mui/material'

import { theme } from '~/styles'
import { TextInputField, CheckboxField } from '~/components/form'
import { intlFormatNumber, getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CurrencyEnum } from '~/generated/graphql'
import { Typography, Tooltip } from '~/components/designSystem'
import { CreditNoteFeeErrorEnum } from '~/components/creditNote/types'

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
                max: intlFormatNumber(maxValue, {
                  currencyDisplay: 'symbol',
                  initialUnit: 'cent',
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
                  initialUnit: 'cent',
                  currency,
                  minimumFractionDigits: 2,
                }),
              })
            : translate('text_6374e868262bab8719eac11f', {
                max: intlFormatNumber(maxValue, {
                  currencyDisplay: 'symbol',
                  initialUnit: 'cent',
                  currency,
                  minimumFractionDigits: 2,
                }),
              })
        }
        disableHoverListener={!error}
      >
        <StyledAmountField
          name={`${formikKey}.value`}
          displayErrorText={false}
          disabled={!_get(formikProps.values, `${formikKey}.checked`)}
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
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

const StyledAmountField = styled(TextInputField)`
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
