import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PaymentMethodComboBoxProps } from './types'
import { usePaymentMethodOptions } from './usePaymentMethodOptions'

export const PaymentMethodComboBox = ({
  paymentMethodsList,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  className,
  disabled = false,
  name = 'selectPaymentMethod',
  PopperProps,
}: PaymentMethodComboBoxProps) => {
  const { translate } = useInternationalization()

  const paymentMethodOptions = usePaymentMethodOptions(paymentMethodsList, translate)

  const onChange = (value: string) => {
    const selectedPaymentMethodOption = paymentMethodOptions.find(
      (option) => option.value === value,
    )

    setSelectedPaymentMethod({
      paymentMethodId: selectedPaymentMethodOption?.value || undefined,
      paymentMethodType: selectedPaymentMethodOption?.type || undefined,
    })
  }

  return (
    <ComboBox
      className={className}
      name={name}
      data={paymentMethodOptions}
      placeholder={translate('text_176433192749240fjx4tced9')}
      emptyText={translate('text_176432831893806loy6xo6qt')}
      value={selectedPaymentMethod?.paymentMethodId || undefined}
      onChange={onChange}
      disabled={disabled}
      sortValues={false}
      PopperProps={PopperProps}
    />
  )
}
