import { gql } from '@apollo/client'
import { memo } from 'react'

import { Alert } from '~/components/designSystem'
import PricingGroupKeys from '~/components/plans/PricingGroupKeys'
import { LocalChargeFilterInput, THandleUpdate } from '~/components/plans/types'
import { PropertiesInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DynamicCharge on Properties {
    pricingGroupKeys
  }
`

type DynamicChargeProps = {
  disabled?: boolean
  handleUpdate: THandleUpdate
  propertyCursor: string
  valuePointer: PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}

export const DynamicCharge = memo(
  ({ disabled, handleUpdate, propertyCursor, valuePointer }: DynamicChargeProps) => {
    const { translate } = useInternationalization()

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
