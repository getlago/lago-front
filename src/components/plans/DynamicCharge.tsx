import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useCallback } from 'react'

import { Alert } from '~/components/designSystem'
import { ChargeCursor } from '~/components/plans/chargeAccordion/ChargeWrapperSwitch'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { LocalChargeFilterInput, PlanFormInput } from '~/components/plans/types'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DynamicCharge on Properties {
    pricingGroupKeys
  }
`

type DynamicChargeProps = {
  chargeCursor: ChargeCursor
  chargeIndex: number
  formikProps: FormikProps<PlanFormInput>
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
  disabled?: boolean
}

export const DynamicCharge = memo(
  ({
    chargeCursor,
    chargeIndex,
    disabled,
    formikProps,
    propertyCursor,
    valuePointer,
  }: DynamicChargeProps) => {
    const { translate } = useInternationalization()

    const handleUpdate = useCallback(
      (name: string, value: string | string[]) => {
        formikProps.setFieldValue(`${chargeCursor}.${chargeIndex}.${name}`, value)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [chargeCursor, chargeIndex],
    )

    return (
      <div className="flex flex-col gap-6">
        <Alert type="info">{translate('text_17277706303454rxgscdqklx')}</Alert>

        <PricingGroupKeys
          disabled={disabled}
          handleUpdate={handleUpdate}
          propertyCursor={propertyCursor}
          valuePointer={valuePointer}
        />
      </div>
    )
  },
)

DynamicCharge.displayName = 'DynamicCharge'
