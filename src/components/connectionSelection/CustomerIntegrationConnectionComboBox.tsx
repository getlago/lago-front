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

  const selectedValue = options.some((option) => option.value === value) ? value : undefined

  return (
    <ComboBox
      name={`selectConnection-${category}`}
      loading={loading}
      data={buildConnectionComboBoxData(options)}
      placeholder={translate(CONNECTION_CATEGORY_SELECT_TITLE_KEYS[category])}
      emptyText={translate('text_1789374590510g6jwxpdsf9q')}
      value={selectedValue}
      onChange={onChange}
      error={error}
      sortValues={false}
      PopperProps={PopperProps}
    />
  )
}
