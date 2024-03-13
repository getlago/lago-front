import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { memo, useCallback } from 'react'
import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { InputMaybe, PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { PlanFormInput } from './types'

gql`
  fragment PackageGroupChildCharge on Charge {
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

interface PackageGroupChildChargeProps {
  chargeIndex: number
  disabled?: boolean
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: InputMaybe<PropertiesInput> | undefined
}

export const PackageGroupChildCharge = memo(
  ({
    chargeIndex,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: PackageGroupChildChargeProps) => {
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
        <TextInput
          name={`${propertyCursor}.packageSize`}
          beforeChangeFormatter={['positiveNumber', 'int']}
          error={_get(formikProps.errors, `charges.${chargeIndex}.properties.packageSize`)}
          disabled={disabled}
          value={valuePointer?.packageSize as number | undefined}
          onChange={(value) => handleUpdate(`${propertyCursor}.packageSize`, value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography color={disabled ? 'disabled' : 'textSecondary'}>
                  {translate('text_6282085b4f283b010265587c')}
                </Typography>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_6282085b4f283b0102655884')}
              </InputAdornment>
            ),
          }}
        />
        <TextInput
          name={`${propertyCursor}.freeUnits`}
          label={translate('text_6282085b4f283b010265588c')}
          placeholder={translate('text_62824f0e5d93bc008d268d00')}
          beforeChangeFormatter={['positiveNumber', 'int']}
          disabled={disabled}
          value={valuePointer?.freeUnits as number | undefined}
          onChange={(value) => handleUpdate(`${propertyCursor}.freeUnits`, value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_6282085b4f283b0102655894')}
              </InputAdornment>
            ),
          }}
        />
      </Container>
    )
  },
)

PackageGroupChildCharge.displayName = 'PackageGroupChildCharge'

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`
