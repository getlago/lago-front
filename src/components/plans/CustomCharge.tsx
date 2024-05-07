import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { memo, useCallback } from 'react'
import styled from 'styled-components'

import { JsonEditor } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'

gql`
  fragment CustomCharge on Properties {
    customProperties
  }
`

interface PackageChargeProps {
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const CustomCharge = memo(
  ({ chargeIndex, disabled, formikProps, propertyCursor, valuePointer }: PackageChargeProps) => {
    const { translate } = useInternationalization()

    const propertyInput: keyof LocalPropertiesInput = 'customProperties'
    const inputId = `charges.${chargeIndex}.${propertyCursor}.${propertyInput}`

    const handleUpdate = useCallback(
      (name: string, value: string) => {
        formikProps.setFieldValue(`charges.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    return (
      <>
        <Container>
          <JsonEditor
            name={`${propertyCursor}.${propertyInput}`}
            label={translate('Custom price')}
            value={valuePointer?.customProperties}
            onChange={(value) => handleUpdate(`${propertyCursor}.${propertyInput}`, value)}
            disabled={disabled}
            error={_get(formikProps.errors, inputId)}
          />
        </Container>
      </>
    )
  },
)

CustomCharge.displayName = 'CustomCharge'

const Container = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`
