import { useMemo } from 'react'

import { ComboBox } from '~/components/form'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodComboBoxProps } from './types'
import { usePaymentMethodOptions } from './usePaymentMethodOptions'

export const PaymentMethodComboBox = ({
  externalCustomerId,
  label,
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  selectedPaymentMethod,
  setSelectedPaymentMethod,
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

  const comboboxValue = useMemo(() => {
    if (selectedPaymentMethod?.paymentMethodId) {
      return selectedPaymentMethod.paymentMethodId
    }

    if (selectedPaymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual) {
      return 'manual'
    }

    return ''
  }, [selectedPaymentMethod])

  const onChange = (value: string) => {
    const selectedPaymentMethodOption = paymentMethodOptions.find(
      (option) => option.value === value,
    )

    setSelectedPaymentMethod({
      paymentMethodId: selectedPaymentMethodOption?.value || undefined,
      paymentMethodType: selectedPaymentMethodOption?.type || undefined,
    })
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
      value={comboboxValue}
      onChange={onChange}
      loading={paymentMethodsLoading}
      disabled={disabled}
      sortValues={false}
    />
  )
}
