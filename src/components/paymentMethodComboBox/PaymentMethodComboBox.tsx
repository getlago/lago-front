import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { usePaymentMethodOptions } from './usePaymentMethodOptions'
import { usePaymentMethodSelection } from './usePaymentMethodSelection'

interface PaymentMethodComboBoxProps {
  externalCustomerId: string
  value?: string
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
}

export const PaymentMethodComboBox = ({
  externalCustomerId,
  label,
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
}: PaymentMethodComboBoxProps) => {
  const { translate } = useInternationalization()

  const {
    data: paymentMethodsList,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethodsList({
    externalCustomerId: externalCustomerId || '',
  })

  const paymentMethodOptions = usePaymentMethodOptions(paymentMethodsList, translate)

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    usePaymentMethodSelection(paymentMethodOptions)

  const onChange = (value: string) => {
    const selectedPaymentMethod = paymentMethodOptions.find((option) => option.value === value)

    if (selectedPaymentMethod) {
      setSelectedPaymentMethodId(selectedPaymentMethod.value)
    }
  }

  const disabled = externalDisabled || paymentMethodsLoading || !!paymentMethodsError

  return (
    <ComboBox
      className={className}
      name={name}
      data={paymentMethodOptions}
      label={label}
      placeholder={placeholder}
      emptyText={emptyText}
      value={selectedPaymentMethodId}
      onChange={onChange}
      loading={paymentMethodsLoading}
      disabled={disabled}
      sortValues={false}
    />
  )
}
