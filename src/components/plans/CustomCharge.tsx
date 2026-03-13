import { gql } from '@apollo/client'
import { memo, useCallback, useRef } from 'react'

import { JsonEditor } from '~/components/form'
import {
  EditCustomChargeDrawer,
  EditCustomChargeDrawerRef,
} from '~/components/plans/EditCustomChargeDrawer'
import { useChargeFormContext, usePropertyValues } from '~/contexts/ChargeFormContext'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment CustomCharge on Properties {
    customProperties
  }
`

export const CustomCharge = memo(() => {
  const { form, propertyCursor, disabled } = useChargeFormContext()
  const { translate } = useInternationalization()
  const drawerRef = useRef<EditCustomChargeDrawerRef>(null)
  const valuePointer = usePropertyValues(form, propertyCursor)

  const propertyInput: keyof PropertiesInput = 'customProperties'
  const inputId = `${propertyCursor}.${propertyInput}`

  const handleUpdate = useCallback(
    (value: string) => {
      form.setFieldValue(inputId, value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputId],
  )

  return (
    <>
      <JsonEditor
        name={`${propertyCursor}.${propertyInput}`}
        label={translate('text_663dea5702b60301d8d06502')}
        value={valuePointer?.customProperties}
        disabled={disabled}
        onExpand={() =>
          drawerRef.current?.openDrawer({
            customProperties: valuePointer?.customProperties,
          })
        }
      />
      <EditCustomChargeDrawer ref={drawerRef} onSubmit={(value) => handleUpdate(value)} />
    </>
  )
})

CustomCharge.displayName = 'CustomCharge'
