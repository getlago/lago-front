import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import { memo, useCallback } from 'react'
import styled from 'styled-components'

import { getCurrencySymbol } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, InputMaybe, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { PlanFormInput } from './types'

import { AmountInput } from '../form/AmountInput/AmountInput'

gql`
  fragment PackageGroupCharge on Charge {
    id
    properties {
      amount
      packageSize
      freeUnits
    }
    groupProperties {
      groupId
      values {
        amount
        packageSize
        freeUnits
      }
    }
  }
`

interface PackageGroupChargeProps {
  chargeGroupIndex: number
  currency: CurrencyEnum
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}

export const PackageGroupCharge = memo(
  ({
    chargeGroupIndex,
    currency,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: PackageGroupChargeProps) => {
    const { translate } = useInternationalization()
    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`chargeGroups.${chargeGroupIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeGroupIndex],
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
      </Container>
    )
  },
)

PackageGroupCharge.displayName = 'PackageGroupCharge'

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`
