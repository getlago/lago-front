import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { usePaymentMethodDefaultSelection } from '../paymentMethodsInvoiceSettings/usePaymentMethodDefaultSelection'
import { usePaymentMethodOptions } from '../paymentMethodsInvoiceSettings/usePaymentMethodOptions'

interface PaymentMethodComboBoxProps {
  externalCustomerId: string
  value?: string
  onChange?: (value: string) => void
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

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = usePaymentMethodDefaultSelection(
    paymentMethodOptions,
    paymentMethodsList,
  )

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
      onChange={setSelectedPaymentMethodId}
      loading={paymentMethodsLoading}
      disabled={disabled}
      sortValues={false}
    />
  )
}
