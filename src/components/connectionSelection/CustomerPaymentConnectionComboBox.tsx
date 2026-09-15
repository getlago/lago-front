import { buildConnectionComboBoxData } from '~/components/customerConnections/ConnectionComboBox'
import { ComboBox } from '~/components/form'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerPaymentConnections } from '~/hooks/customer/useCustomerPaymentConnections'

interface CustomerPaymentConnectionComboBoxProps {
  customerId: string
  value: string
  onChange: (code: string) => void
  error?: string
  PopperProps?: ComboBoxProps['PopperProps']
}

export const CustomerPaymentConnectionComboBox = ({
  customerId,
  value,
  onChange,
  error,
  PopperProps,
}: CustomerPaymentConnectionComboBoxProps) => {
  const { translate } = useInternationalization()
  const { options, loading } = useCustomerPaymentConnections({ customerId })

  const selectedValue = options.some((option) => option.value === value) ? value : undefined

  return (
    <ComboBox
      name="selectPaymentConnection"
      loading={loading}
      data={buildConnectionComboBoxData(options)}
      placeholder={translate('text_1789374590510321c7axnlzo')}
      emptyText={translate('text_1789374590510g6jwxpdsf9q')}
      value={selectedValue}
      onChange={onChange}
      error={error}
      sortValues={false}
      PopperProps={PopperProps}
    />
  )
}
