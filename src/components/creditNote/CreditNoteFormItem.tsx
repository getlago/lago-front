import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import styled from 'styled-components'

import { CreditNoteFeeErrorEnum } from '~/components/creditNote/types'
import { Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, CheckboxField } from '~/components/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { CreditNoteForm } from './types'

interface CreditNoteFormItemProps {
  formikProps: FormikProps<Partial<CreditNoteForm>> // TOSO
  currency: CurrencyEnum
  feeName: string
  formikKey: string
  maxValue: number
}

export const CreditNoteFormItem = ({
  formikProps,
  currency,
  formikKey,
  maxValue,
  feeName,
}: CreditNoteFormItemProps) => {
  const { translate } = useInternationalization()
  const error = _get(formikProps.errors, `${formikKey}.value`)

  return (
    <FeeLine>
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

const FeeLine = styled.div`
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  height: 68px;
  justify-content: space-between;
`
