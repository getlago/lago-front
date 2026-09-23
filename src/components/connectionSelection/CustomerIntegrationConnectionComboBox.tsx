import { useEffect } from 'react'

import { buildConnectionComboBoxData } from '~/components/customerConnections/ConnectionComboBox'
import {
  CONNECTION_CATEGORY_SELECT_TITLE_KEYS,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { ComboBox } from '~/components/form'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerIntegrationConnections } from '~/hooks/customer/useCustomerIntegrationConnections'

interface CustomerIntegrationConnectionComboBoxProps {
  customerId: string
  category: IntegrationConnectionCategory
  value: string
  onChange: (code: string) => void
  error?: string
  PopperProps?: ComboBoxProps['PopperProps']
}

export const CustomerIntegrationConnectionComboBox = ({
  customerId,
  category,
  value,
  onChange,
  error,
  PopperProps,
}: CustomerIntegrationConnectionComboBoxProps) => {
  const { translate } = useInternationalization()
  const { options, loading } = useCustomerIntegrationConnections({ customerId, category })

  const isValueSelectable = options.some((option) => option.value === value)

  // A connection deleted on the customer after the object was saved must not survive in the form:
  // the schema only refines on an empty code, so a dangling one would re-persist without an error.
  useEffect(() => {
    if (loading || !value || isValueSelectable) return

    onChange('')
  }, [loading, value, isValueSelectable, onChange])

  return (
    <ComboBox
      name={`selectConnection-${category}`}
      loading={loading}
      data={buildConnectionComboBoxData(options)}
      placeholder={translate(CONNECTION_CATEGORY_SELECT_TITLE_KEYS[category])}
      emptyText={translate('text_1789374590510g6jwxpdsf9q')}
      value={isValueSelectable ? value : undefined}
      onChange={onChange}
      error={error}
      sortValues={false}
      PopperProps={PopperProps}
    />
  )
}
