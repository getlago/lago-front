import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { memo, useCallback, useRef } from 'react'

import { JsonEditor } from '~/components/form'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import {
  EditCustomChargeDrawer,
  EditCustomChargeDrawerRef,
} from '~/components/plans/EditCustomChargeDrawer'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput, PlanFormInput } from './types'

gql`
  fragment CustomCharge on Properties {
    customProperties
  }
`

interface CustomChargeProps {
  chargeCursor: ChargeCursor
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const CustomCharge = memo(
  ({
    chargeCursor,
    chargeIndex,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: CustomChargeProps) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<EditCustomChargeDrawerRef>(null)

    const propertyInput: keyof PropertiesInput = 'customProperties'
    const inputId = `${chargeCursor}.${chargeIndex}.${propertyCursor}.${propertyInput}`

    const handleUpdate = useCallback(
      (value: string) => {
        formikProps.setFieldValue(inputId, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [inputId],
    )

    return (
      <>
        <div className="flex flex-col gap-6">
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
        </div>
        <EditCustomChargeDrawer ref={drawerRef} onSubmit={(value) => handleUpdate(value)} />
      </>
    )
  },
)

CustomCharge.displayName = 'CustomCharge'
