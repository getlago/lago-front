import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { memo, useCallback, useRef } from 'react'
import styled from 'styled-components'

import { JsonEditor } from '~/components/form'
import {
  EditCustomChargeDrawer,
  EditCustomChargeDrawerRef,
} from '~/components/plans/EditCustomChargeDrawer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { LocalChargeFilterInput, LocalPropertiesInput, PlanFormInput } from './types'

gql`
  fragment CustomCharge on Properties {
    customProperties
  }
`

interface CustomChargeProps {
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: LocalPropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const CustomCharge = memo(
  ({ chargeIndex, disabled, formikProps, propertyCursor, valuePointer }: CustomChargeProps) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<EditCustomChargeDrawerRef>(null)

    const propertyInput: keyof LocalPropertiesInput = 'customProperties'
    const inputId = `charges.${chargeIndex}.${propertyCursor}.${propertyInput}`

    const handleUpdate = useCallback(
      (value: string) => {
        formikProps.setFieldValue(inputId, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeIndex],
    )

    return (
      <>
        <Container>
          <JsonEditor
            name={`${propertyCursor}.${propertyInput}`}
            label={translate('text_663dea5702b60301d8d06502')}
            value={valuePointer?.customProperties}
            disabled={disabled}
            error={_get(formikProps.errors, inputId)}
            onExpand={() =>
              drawerRef.current?.openDrawer({
                customProperties: _get(formikProps.values, inputId),
              })
            }
          />
        </Container>
        <EditCustomChargeDrawer ref={drawerRef} onSubmit={(value) => handleUpdate(value)} />
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
