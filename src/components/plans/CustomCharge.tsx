import { gql } from '@apollo/client'
import { FormikErrors } from 'formik'
import _get from 'lodash/get'
import { memo, useRef } from 'react'

import { JsonEditor } from '~/components/form'
import {
  EditCustomChargeDrawer,
  EditCustomChargeDrawerRef,
} from '~/components/plans/EditCustomChargeDrawer'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput, PlanFormInput, THandleUpdate } from './types'

gql`
  fragment CustomCharge on Properties {
    customProperties
  }
`

interface CustomChargeProps {
  chargeIndex: number
  handleUpdate: THandleUpdate
  formikErrors: FormikErrors<PlanFormInput>
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const CustomCharge = memo(
  ({
    chargeIndex,
    disabled,
    handleUpdate,
    propertyCursor,
    valuePointer,
    formikErrors,
  }: CustomChargeProps) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<EditCustomChargeDrawerRef>(null)

    const propertyName: keyof PropertiesInput = 'customProperties'

    return (
      <>
        <div className="flex flex-col gap-6">
          <JsonEditor
            name={`${propertyCursor}.${propertyName}`}
            label={translate('text_663dea5702b60301d8d06502')}
            value={valuePointer?.customProperties}
            disabled={disabled}
            error={_get(formikErrors, `charges.${chargeIndex}.${propertyCursor}.${propertyName}`)}
            onExpand={() =>
              drawerRef.current?.openDrawer({
                customProperties: valuePointer?.[propertyName],
              })
            }
          />
        </div>
        <EditCustomChargeDrawer
          ref={drawerRef}
          onSubmit={(value) => handleUpdate(`${propertyCursor}.${propertyName}`, value)}
        />
      </>
    )
  },
)

CustomCharge.displayName = 'CustomCharge'
