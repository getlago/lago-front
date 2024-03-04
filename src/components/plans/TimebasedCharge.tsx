import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { memo, useCallback } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { PlanFormInput } from './types'

import { AmountInput } from '../form/AmountInput/AmountInput'

gql`
  fragment TimebasedCharge on Charge {
    id
    properties {
      amount
      blockTimeInMinutes
    }
  }
`

interface TimebasedChargeProps {
  chargeIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}

export const TimebasedCharge = memo(
  ({
    chargeIndex,
    currency,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: TimebasedChargeProps) => {
    const { translate } = useInternationalization()
    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    return (
      <Container>
        <AmountInput
          name={`${propertyCursor}.amount`}
          currency={currency}
          beforeChangeFormatter={['positiveNumber', 'chargeDecimal']}
          disabled={disabled}
          label={translate('text_6282085b4f283b0102655870')}
          value={valuePointer?.amount || ''}
          onChange={(value) => handleUpdate(`${propertyCursor}.amount`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">{getCurrencySymbol(currency)}</InputAdornment>
            ),
          }}
        />
        <TextInput
          name={`${propertyCursor}.blockTimeInMinutes`}
          beforeChangeFormatter={['positiveNumber', 'int']}
          error={_get(formikProps.errors, `charges.${chargeIndex}.properties.blockTimeInMinutes`)}
          disabled={disabled}
          value={valuePointer?.blockTimeInMinutes as number | undefined}
          onChange={(value) => handleUpdate(`${propertyCursor}.blockTimeInMinutes`, value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography color={disabled ? 'disabled' : 'textSecondary'}>
                  {translate('text_6282085b4f283b010265587c')}
                </Typography>
              </InputAdornment>
            ),
            endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
          }}
        />
      </Container>
    )
  },
)

TimebasedCharge.displayName = 'TimebasedCharge'

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`
